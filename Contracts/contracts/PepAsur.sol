// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
  ASUR / LeoMafia - Minimal staking & settlement contract (Flow EVM compatible)
  Gas-optimized & corrected ECDSA usage
*/

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract PepAsur {
    using ECDSA for bytes32;

    address public owner;            // admin / deployer
    address public serverSigner;     // oracle / game server address used to sign settlements
    address public feeRecipient;     // where house cut goes
    uint16 public houseCutBps;       // basis points for house cut (100 = 1%)

    uint64 private nextGameId = 1;

    enum GameStatus { Lobby, InProgress, Settled, Cancelled }

    struct Game {
        uint64 id;
        address creator;
        uint256 stakeAmount;
        uint8 minPlayers;
        address[] players;
        mapping(address => uint256) deposits; // per player deposit
        bytes32 roleCommit;          // hash(roles + salt)
        GameStatus status;
        bool settled;
        uint256 totalPool;
    }

    mapping(uint64 => Game) private games;
    mapping(address => uint256) public pendingWithdrawals;

    event GameCreated(uint64 indexed gameId, address indexed creator, uint256 stake, uint8 minPlayers);
    event PlayerJoined(uint64 indexed gameId, address indexed player);
    event RoleCommitStored(uint64 indexed gameId, bytes32 commit);
    event SettlementSubmitted(uint64 indexed gameId, bytes32 settlementHash, address indexed submitter);
    event GameSettled(uint64 indexed gameId, address[] winners);
    event PayoutQueued(uint64 indexed gameId, address indexed to, uint256 amount);
    event Withdrawn(address indexed who, uint256 amount);
    event EmergencyCancelled(uint64 indexed gameId);

    modifier onlyOwner() { require(msg.sender == owner, "only owner"); _; }
    modifier onlyCreator(uint64 gameId) { require(msg.sender == games[gameId].creator, "only creator"); _; }

    constructor(address _serverSigner, address _feeRecipient, uint16 _houseCutBps) {
        require(_serverSigner != address(0), "invalid signer");
        require(_feeRecipient != address(0), "invalid fee recipient");
        require(_houseCutBps <= 2000, "bps must be <= 2000");

        owner = msg.sender;
        serverSigner = _serverSigner;
        feeRecipient = _feeRecipient;
        houseCutBps = _houseCutBps;
    }

    // ---------- Game creation & join ----------
    function createGame(uint256 stakeAmountWei, uint8 minPlayers) external returns (uint64) {
        require(stakeAmountWei > 0, "stake > 0");
        require(minPlayers >= 2, "minPlayers >= 2");

        uint64 gameId = nextGameId++;
        Game storage g = games[gameId];
        g.id = gameId;
        g.creator = msg.sender;
        g.stakeAmount = stakeAmountWei;
        g.minPlayers = minPlayers;
        g.status = GameStatus.Lobby;
        g.settled = false;
        g.totalPool = 0;

        emit GameCreated(gameId, msg.sender, stakeAmountWei, minPlayers);
        return gameId;
    }

    function joinGame(uint64 gameId) external payable {
        Game storage g = games[gameId];
        require(g.id != 0, "invalid game");
        require(g.status == GameStatus.Lobby, "game not open");
        require(msg.value == g.stakeAmount, "incorrect stake");
        require(g.deposits[msg.sender] == 0, "already joined");

        g.players.push(msg.sender);
        g.deposits[msg.sender] = msg.value;
        g.totalPool += msg.value;

        if (g.players.length >= g.minPlayers) {
            g.status = GameStatus.InProgress;
        }

        emit PlayerJoined(gameId, msg.sender);
    }

    function storeRoleCommit(uint64 gameId, bytes32 commit) external {
        Game storage g = games[gameId];
        require(g.id != 0, "invalid game");
        require(g.status == GameStatus.InProgress, "game not in progress");
        require(g.roleCommit == bytes32(0), "role commit already set");
        require(msg.sender == g.creator || msg.sender == serverSigner, "not authorized");

        g.roleCommit = commit;
        emit RoleCommitStored(gameId, commit);
    }

    // ---------- Settlement ----------
    function submitSettlement(
        uint64 gameId,
        bytes32 settlementHash,
        address[] calldata winners,
        uint256[] calldata payoutAmounts,
        bytes calldata signature
    ) external {
        Game storage g = games[gameId];
        require(g.id != 0, "invalid game");
        require(!g.settled, "already settled");
        require(g.status == GameStatus.InProgress, "game not in progress");
        require(winners.length == payoutAmounts.length, "length mismatch");

        // ✅ Correct ECDSA usage for OpenZeppelin v5
        bytes32 ethSigned = MessageHashUtils.toEthSignedMessageHash(settlementHash);
        address recovered = ECDSA.recover(ethSigned, signature);
        require(recovered == serverSigner, "invalid settlement signature");

        uint256 sum;
        for (uint i = 0; i < payoutAmounts.length; ++i) sum += payoutAmounts[i];

        uint256 houseCut = (g.totalPool * houseCutBps) / 10000;
        uint256 availablePool = g.totalPool - houseCut;
        require(sum <= availablePool, "payouts exceed pool");

        g.settled = true;
        g.status = GameStatus.Settled;

        if (houseCut > 0) {
            pendingWithdrawals[feeRecipient] += houseCut;
            emit PayoutQueued(gameId, feeRecipient, houseCut);
        }

        for (uint i = 0; i < winners.length; ++i) {
            uint256 amt = payoutAmounts[i];
            if (amt > 0) {
                pendingWithdrawals[winners[i]] += amt;
                emit PayoutQueued(gameId, winners[i], amt);
            }
        }

        emit SettlementSubmitted(gameId, settlementHash, msg.sender);
        emit GameSettled(gameId, winners);
    }

    // ---------- Withdraw ----------
    function withdraw() external {
        uint256 bal = pendingWithdrawals[msg.sender];
        require(bal > 0, "no balance");

        pendingWithdrawals[msg.sender] = 0;
        (bool ok, ) = payable(msg.sender).call{value: bal}("");
        require(ok, "transfer failed");

        emit Withdrawn(msg.sender, bal);
    }

    // ---------- Admin emergency ----------
    function emergencyCancel(uint64 gameId) external onlyOwner {
        Game storage g = games[gameId];
        require(g.id != 0, "invalid game");
        require(!g.settled, "already settled");
        require(g.status != GameStatus.Cancelled, "already cancelled");

        for (uint i = 0; i < g.players.length; ++i) {
            address p = g.players[i];
            uint256 dep = g.deposits[p];
            if (dep > 0) {
                pendingWithdrawals[p] += dep;
                emit PayoutQueued(gameId, p, dep);
                g.deposits[p] = 0;
            }
        }

        g.status = GameStatus.Cancelled;
        g.settled = true;

        emit EmergencyCancelled(gameId);
    }

    // ---------- Admin setters ----------
    function setServerSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "zero addr");
        serverSigner = _signer;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "zero addr");
        feeRecipient = _feeRecipient;
    }

    function setHouseCutBps(uint16 _bps) external onlyOwner {
        require(_bps <= 10000, "max 10000");
        houseCutBps = _bps;
    }

    // ---------- Views ----------
    function getGamePlayers(uint64 gameId) external view returns (address[] memory) {
        return games[gameId].players;
    }

    function getGameInfo(uint64 gameId) external view returns (
        address creator,
        uint256 stakeAmount,
        uint8 minPlayers,
        bytes32 roleCommit,
        GameStatus status,
        bool settled,
        uint256 totalPool
    ) {
        Game storage g = games[gameId];
        return (
            g.creator,
            g.stakeAmount,
            g.minPlayers,
            g.roleCommit,
            g.status,
            g.settled,
            g.totalPool
        );
    }

    receive() external payable { revert("do not send ETH directly"); }
}
