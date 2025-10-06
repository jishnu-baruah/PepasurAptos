const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FlowToken", function () {
  let flowToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const FlowToken = await ethers.getContractFactory("FlowToken");
    flowToken = await FlowToken.deploy();
    await flowToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await flowToken.name()).to.equal("FlowToken");
      expect(await flowToken.symbol()).to.equal("FLOWT");
    });

    it("Should set the correct initial supply", async function () {
      const expectedSupply = ethers.parseEther("1000000"); // 1 million tokens
      expect(await flowToken.totalSupply()).to.equal(expectedSupply);
    });

    it("Should assign the initial supply to the owner", async function () {
      const ownerBalance = await flowToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(await flowToken.totalSupply());
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await flowToken.mint(addr1.address, mintAmount);
      
      expect(await flowToken.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        flowToken.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWithCustomError(flowToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Burning", function () {
    it("Should allow users to burn their own tokens", async function () {
      const burnAmount = ethers.parseEther("1000");
      const initialBalance = await flowToken.balanceOf(owner.address);
      
      await flowToken.burn(burnAmount);
      
      expect(await flowToken.balanceOf(owner.address)).to.equal(
        initialBalance - burnAmount
      );
    });

    it("Should not allow users to burn more tokens than they have", async function () {
      const burnAmount = ethers.parseEther("2000000"); // More than total supply
      
      await expect(flowToken.burn(burnAmount)).to.be.revertedWithCustomError(
        flowToken,
        "ERC20InsufficientBalance"
      );
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("1000");
      
      await flowToken.transfer(addr1.address, transferAmount);
      
      expect(await flowToken.balanceOf(addr1.address)).to.equal(transferAmount);
      expect(await flowToken.balanceOf(owner.address)).to.equal(
        ethers.parseEther("999000")
      );
    });
  });
});
