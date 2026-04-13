# Mobile Testing Guide

## Quick Test Checklist

### Menubar
- [ ] Height: 24px (thin status bar)
- [ ] Only first menu item visible (apple logo + name)
- [ ] Right side shows battery/signal (smaller, 10px font)
- [ ] Menu dropdowns hidden

### Dock (Bottom Navigation)
- [ ] Fixed at bottom of screen
- [ ] Full width (100%)
- [ ] 60px total height
- [ ] Icons: 36x36px, centered
- [ ] Slight tap feedback (active state shows bg change)
- [ ] Top border visible (visual separation)
- [ ] Safe area padding applied (devices with notch)

### Windows
- [ ] Full screen except menubar (24px) and dock (60px)
- [ ] No rounded corners (fully rectangular)
- [ ] Open animation: slides up from bottom smoothly
- [ ] Close animation: slides down smoothly
- [ ] Toolbar: 36px height, only close button visible
- [ ] Title centered in toolbar
- [ ] Content readable with proper padding (12px)
- [ ] Scrollable when content overflows

### Content Layout
- [ ] Contact grid: 1 column (stacked vertically)
- [ ] Tech grid: 3 columns
- [ ] Stat row: 3 columns with smaller text
- [ ] Articles/Experience: Full width, single column
- [ ] LinkedIn tabs: Horizontally scrollable
- [ ] All fonts readable (13-14px for body text)

### Performance
- [ ] Page loads quickly
- [ ] Animations smooth (60fps)
- [ ] No janky scrolling
- [ ] Touch targets are 36x36px minimum

## How to Test

### Option 1: On Real Device
1. Open Safari/Chrome on iPhone/Android
2. Visit `https://ishaqhassan.dev`
3. Check items in checklist above

### Option 2: Browser DevTools (Desktop)
1. Press `Ctrl+Shift+M` (or Cmd+Shift+M on Mac)
2. Select device: iPhone 12, Pixel 5, etc.
3. Check media query is active: `max-width: 768px`
4. Verify CSS rules are applied

### Option 3: Manual Viewport Resize
1. Open browser
2. Resize window to ~390px width
3. Media query should trigger
4. All mobile CSS should apply

## Key Measurements

| Element | Desktop | Mobile |
|---------|---------|--------|
| Menubar Height | 28px | 24px |
| Dock Height | N/A (relative) | 60px (fixed bottom) |
| Dock Icon Size | 44x44px | 36x36px |
| Window Toolbar | 40px | 36px |
| Window Top Position | 60px offset | 24px (below menubar) |
| Window Bottom Position | 100px offset | 60px (above dock) |
| Contact Grid | 2 columns | 1 column |
| Tech Grid | auto-fill | 3 columns |
| Body Padding | 20px | 12px |
| Body Font | 14px | 13px |

## Viewport Breakpoint
- **Triggers at**: max-width: 768px
- **Typical devices**: 
  - iPhone: 390px (SE, 13, 14, 15, 16)
  - iPad: 810px+ (no mobile CSS)
  - Android: 360-412px (most phones)

## What's Hidden on Mobile

| Hidden | Reason |
|--------|--------|
| Desktop widgets | Take up space, not mobile-friendly |
| Window maximize/minimize buttons | Not needed on full-screen |
| Dock tooltips | Touch devices use long-press or icons only |
| Menu dropdowns (except first) | Limited viewport width |
| Window magnification on hover | Touch devices don't hover |
| Widget drag/resize | Single column layout |

## Performance Notes

- **Window Animations**: 0.3s open, 0.25s close (snappy)
- **Transitions**: 0.2s for interactive elements (dock icon tap)
- **Safe Area**: Automatically applies to notched phones
- **Font Sizes**: Scaled for mobile readability without pinch-zoom needed

## Troubleshooting

### Mobile CSS not applying?
- Check browser viewport width is ≤ 768px
- Clear browser cache
- Refresh page (Ctrl+Shift+R or Cmd+Shift+R)
- Check DevTools shows media query as active

### Dock icons overlapping?
- Window should be positioned `bottom: 60px`
- Check if z-index conflicts exist
- Ensure dock has `z-index: 9998`

### Text too small?
- Body text is 13px (13-14px for readability)
- Should be readable without zoom
- If not, check browser zoom is 100%

### Safe area not working?
- Only applies to notched devices (iPhone 12+, etc.)
- Use `env(safe-area-inset-bottom, 0)` as fallback
- Should automatically work on modern devices

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome/Edge | ✅ Full | CSS Grid, Flexbox, env() |
| Firefox | ✅ Full | All features supported |
| Safari | ✅ Full | env() supported |
| IE 11 | ❌ Not tested | No Flexbox Grid support |

## Questions?

Check the main HTML file for:
- All media query CSS (lines 803-1137)
- Window element structure
- Dock layout
- Animation definitions

The CSS is self-documented with section comments.
