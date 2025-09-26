# Pixel Art Styling Implementation

This document describes the pixel art styling implementation for the ASUR Space Mafia Game.

## Fonts

We've implemented three pixel fonts for the retro aesthetic:

1. **Press Start 2P** - Classic arcade font (used for headings and important UI elements)
2. **VT323** - Retro monospace font (used for body text and secondary UI)
3. **Silkscreen** - Clean pixel font (used for decorative elements)

### Usage

Apply fonts using these CSS classes:
- `press-start` - Press Start 2P font
- `vt323` - VT323 font
- `silkscreen` - Silkscreen font

Example:
```jsx
<h1 className="press-start">GAME TITLE</h1>
<p className="vt323">Game description</p>
```

## Color Palette

We've implemented a Pepe-themed color scheme with a dark, mysterious vibe and neon mafia energy:

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| **Primary Pepe Green** | 🟩 Frog Green | `#4A8C4A` | Character highlights, primary text, borders |
| **Secondary Dark Green** | 🟢 Deep Moss Green | `#365E33` | Background panels, HUD boxes, hover states |
| **Background Black** | ⚫ Space Black | `#0A0A0A` | Main background, outer space vibe |
| **Accent Neon Red** | 🔴 Blood Neon | `#FF3B3B` | Danger alerts, enemy markers, mafia warning text |
| **Accent Neon Purple** | 🟣 Cosmic Purple | `#A259FF` | Special abilities, rare loot indicators |
| **Accent Neon Yellow** | 🟡 Toxic Yellow | `#FFEA00` | Money, coins, bounty rewards |
| **Secondary Gray** | 🌑 Dim Gray | `#2B2B2B` | Neutral panels, inactive buttons |
| **Highlight White** | ⚪ Bright White | `#FFFFFF` | UI text for max contrast |

### Glowing Effects

Apply reduced glowing effects using these CSS classes:
- `glow-green` - Reduced Pepe green glow
- `glow-red` - Reduced neon red glow
- `glow-purple` - Reduced cosmic purple glow
- `glow-yellow` - Reduced toxic yellow glow

Example:
```jsx
<div className="glow-green">GLOWING TEXT</div>
```

## Pixel Art Components

### Pixelated Rendering

All sprites and assets use pixelated rendering with the `pixelated` CSS class:
```css
.pixelated {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}
```

### UI Components

1. **Pixel Buttons** - Available in multiple variants:
   - `pixel` - Pepe green pixel button
   - `pixelRed` - Neon red pixel button
   - `pixelPurple` - Cosmic purple pixel button
   - `pixelYellow` - Toxic yellow pixel button
   - `pixelOutline` - Outlined pixel button
   - `pixelDark` - Dark green pixel button

2. **Pixel Cards** - Styled cards with pixel art borders:
   - `PixelCard` component with variants:
     - `default` - Standard card with dark green background
     - `outline` - Outlined card with Pepe green border
     - `glow` - Glowing card with reduced Pepe green glow

3. **Pixel Loader** - Animated pixel art loader:
   - `PixelLoader` component with size and color options (green, red, purple, yellow)

4. **Pixel Progress Bar** - Pixel-styled progress indicator:
   - `PixelProgress` component with color options (green, red, purple, yellow)

## Animations

### Retro Animations

We've implemented stepped animations for a retro feel:

1. **Retro Pulse** - Subtle scaling animation
2. **Retro Blink** - Blinking opacity effect
3. **Retro Bounce** - Vertical bouncing effect
4. **Retro Shake** - Horizontal shaking effect

Usage:
```jsx
import RetroAnimation from '@/components/retro-animation'

<RetroAnimation type="pulse">
  <div>Animated content</div>
</RetroAnimation>
```

### Custom Animation Classes

Additional CSS animation classes:
- `retro-pulse` - Continuous pulsing effect
- `retro-blink` - Blinking effect
- `retro-spin` - Stepped rotation

## Implementation Files

- `app/layout.tsx` - Font imports
- `app/globals.css` - Global styles and color definitions
- `components/ui/button.tsx` - Pixel button variants
- `components/retro-animation.tsx` - Animation components
- `components/pixel-loader.tsx` - Pixel art loader
- `components/pixel-progress.tsx` - Pixel progress bar
- `components/pixel-card.tsx` - Pixel art cards
- `components/loader-screen.tsx` - Updated with pixel styling
- `components/wallet-connect-screen.tsx` - Updated with pixel styling
- `components/lobby-screen.tsx` - Updated with pixel styling
- `components/role-assignment-screen.tsx` - Updated with pixel styling

## Usage Examples

### Creating a Pixel Button
```jsx
<Button variant="pixel" size="pixelLarge">
  CLICK ME
</Button>
```

### Creating a Pixel Card
```jsx
<PixelCard variant="glow">
  <h2 className="press-start">Card Title</h2>
  <p className="vt323">Card content</p>
</PixelCard>
```

### Adding a Pixel Loader
```jsx
<PixelLoader size="lg" color="green" />
```

### Using Retro Animations
```jsx
<RetroAnimation type="bounce">
  <div>Bouncing content</div>
</RetroAnimation>
```