# ASUR Game Pixel Button Component

A comprehensive reusable CSS button component for the ASUR game with pixelated retro arcade styling and 3D blocky effects.

## Features

- **3D Blocky Design**: Simulates depth with layered shadows and borders
- **Pixelated Font**: Uses "Press Start 2P" for authentic retro feel
- **Interactive States**: Hover, active, focus, and disabled states
- **Color Variants**: Multiple color schemes for different actions
- **Size Variants**: Small, normal, and large sizes
- **Accessibility**: Proper focus states and keyboard navigation
- **Smooth Animations**: CSS transitions for all interactions

## Base Usage

```html
<button class="btn-pixel">Connect Wallet</button>
```

## Color Variants

### Default Green (Primary)
```html
<button class="btn-pixel">Join Game</button>
```

### Red (Danger Actions)
```html
<button class="btn-pixel btn-pixel--red">Delete Account</button>
```

### Blue (Info Actions)
```html
<button class="btn-pixel btn-pixel--blue">View Details</button>
```

### Purple (Special Actions)
```html
<button class="btn-pixel btn-pixel--purple">Special Power</button>
```

### Yellow (Warning Actions)
```html
<button class="btn-pixel btn-pixel--yellow">Warning Action</button>
```

## Size Variants

### Small
```html
<button class="btn-pixel btn-pixel--small">Small Button</button>
```

### Normal (Default)
```html
<button class="btn-pixel">Normal Button</button>
```

### Large
```html
<button class="btn-pixel btn-pixel--large">Large Button</button>
```

## Combining Classes

You can combine color and size variants:

```html
<button class="btn-pixel btn-pixel--red btn-pixel--large">Large Red Button</button>
<button class="btn-pixel btn-pixel--blue btn-pixel--small">Small Blue Button</button>
```

## Game-Specific Examples

### Wallet Connection
```html
<button class="btn-pixel btn-pixel--large">Connect Wallet</button>
```

### Game Actions
```html
<button class="btn-pixel btn-pixel--blue btn-pixel--large">Join Game</button>
<button class="btn-pixel btn-pixel--red btn-pixel--large">Create Lobby</button>
<button class="btn-pixel btn-pixel--purple btn-pixel--large">Start Game</button>
```

### Voting Actions
```html
<button class="btn-pixel btn-pixel--red btn-pixel--large">Submit Vote</button>
<button class="btn-pixel btn-pixel--yellow btn-pixel--large">Skip Vote</button>
```

### Player Actions
```html
<button class="btn-pixel btn-pixel--small">Chat</button>
<button class="btn-pixel btn-pixel--small">Settings</button>
<button class="btn-pixel btn-pixel--red btn-pixel--small">Leave Game</button>
```

## Interactive States

### Hover State
- Button lifts up by 3px
- Shadow extends and adds glow effect
- Smooth transition animation

### Active/Pressed State
- Button sinks down by 2px
- Shadow shrinks to simulate pressing
- Immediate visual feedback

### Focus State
- Green glow outline for accessibility
- Keyboard navigation support
- WCAG compliant

### Disabled State
- Reduced opacity (60%)
- No hover effects
- Cursor changes to not-allowed

## CSS Customization

### Color Scheme
The component uses these color variables:
- **Primary Green**: `#2ECC71`
- **Darker Bottom**: `#1F7A49`
- **Deep Shadow**: `#0B3F2A`

### Typography
- **Font**: Press Start 2P (Google Fonts)
- **Size**: 12px (base), 10px (small), 14px (large)
- **Weight**: 400 (normal)
- **Transform**: Uppercase
- **Letter Spacing**: 0.1em

### 3D Effects
- **Border Radius**: 6px (slightly rounded)
- **Shadow Layers**: Multiple box-shadows for depth
- **Bevel Highlight**: `::before` pseudo-element
- **Transform**: translateY for lift/sink effects

## Browser Support

- **Modern Browsers**: Full support
- **CSS Features Used**:
  - CSS Grid/Flexbox
  - CSS Transforms
  - CSS Box-shadow
  - CSS Pseudo-elements
  - CSS Transitions

## Performance

- **GPU Accelerated**: Uses transform and box-shadow
- **Smooth Animations**: 0.15s cubic-bezier transitions
- **Lightweight**: Pure CSS, no JavaScript required
- **Optimized**: Minimal repaints and reflows

## Integration with React

```jsx
// Basic usage
<button className="btn-pixel">Connect Wallet</button>

// With variants
<button className="btn-pixel btn-pixel--red btn-pixel--large">
  Start Game
</button>

// With event handlers
<button 
  className="btn-pixel btn-pixel--blue"
  onClick={handleJoinGame}
>
  Join Game
</button>

// Disabled state
<button 
  className="btn-pixel"
  disabled={!walletConnected}
>
  Connect Wallet
</button>
```

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support
- **Focus Indicators**: Clear focus states
- **Screen Reader**: Proper button semantics
- **Color Contrast**: WCAG AA compliant
- **Disabled States**: Proper disabled styling

## Best Practices

1. **Use Semantic HTML**: Always use `<button>` elements
2. **Provide Context**: Use descriptive button text
3. **Consistent Sizing**: Use size variants consistently
4. **Color Coding**: Use color variants for different action types
5. **Loading States**: Consider adding loading indicators
6. **Error Handling**: Provide feedback for failed actions

## Troubleshooting

### Button Not Appearing
- Ensure Press Start 2P font is loaded
- Check for CSS conflicts
- Verify class names are correct

### Animations Not Working
- Check browser support for CSS transforms
- Ensure no conflicting CSS rules
- Verify transition properties

### Color Variants Not Working
- Ensure modifier classes are applied correctly
- Check for CSS specificity issues
- Verify color values are valid

## Future Enhancements

- Loading spinner integration
- Icon support
- Animation presets
- Theme customization
- Dark mode variants
