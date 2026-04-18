# Changelog

All notable changes to [ishaqhassan.dev](https://ishaqhassan.dev) are documented here.

## [v2.0] - 2026-04-18

### Spotlight Search
- macOS Spotlight-style global search (`Cmd+K` or click `🔍 ⌘K` in menubar)
- Searches across all 12 windows: experience, PRs, speaking events, tech stack, articles, contact, OSS repos, Flutter Course videos
- Fuzzy word-boundary matching with scored results grouped by category
- Keyboard navigation (arrow keys, Enter to open, Escape to close)
- Opens target window and scrolls to matched item with highlight flash
- Mobile support (opens mobile sections instead of windows)
- ~120 indexed items including 35 Flutter Course videos

### QuickTime-Style Video Player
- Standalone player window separate from Flutter Course library
- Edge-to-edge YouTube iframe with dark cinema background
- Toolbar: section pill, video title, counter (3/35)
- Bottom controls: Prev/Next buttons with hover preview tooltips (thumbnail + title)
- Course library stays open while player plays
- Clicking another video updates player, no duplicate windows
- Auto-stop previous video when new one plays (desktop + mobile)
- Video progress saved per video in localStorage, resumes on replay

### Fullscreen Spaces (macOS Style)
- Green button click or "Full Screen" menu item enters fullscreen space
- Window expands to fill entire screen, menubar and dock hide
- New space appears in Mission Control strip
- Dock auto-shows on mouse at bottom edge, apps launch on original desktop
- Exit via green button, "Exit Full Screen" button, or Escape
- Smooth enter/exit animations
- Green button hover shows snap menu (Tile Left, Right, etc.)

### Show Desktop
- Click empty desktop (wallpaper) to slide all windows off screen
- Each window slides toward nearest edge based on its position
- Click again or press Escape to restore all windows
- F11 keyboard shortcut
- Weighted diagonal movement (dominant axis gets more travel)

### Mission Control Improvements
- Desktop snapshots via html2canvas for strip thumbnails
- Shimmer loading animation while snapshot captures
- Snapshot captured on MC open, desktop switch, and MC close
- Individual window previews in main grid (cloned, no iframes/canvas)
- Fullscreen spaces show as separate desktops in strip
- Click window preview to focus and center it (animated slide to center)
- Desktop switch animation changed from slide to smooth fade
- No duplicate video playback in previews (iframes removed from clones)

### Dynamic Menubar
- Menubar updates per focused window (macOS style)
- App name replaces "Ishaq Hassan" with smooth fade transition
- File menu: window-specific links (PR links, article links, repo links, etc.)
- Go menu: contextual navigation between related windows
- Name dropdown: window info and external profile links
- Menu items auto-close dropdown on click (event delegation for dynamic items)
- Reverts to default "Ishaq Hassan" menu when no windows open

### Window Management
- All-edge resize (8 directions: N, S, E, W, NE, NW, SE, SW) without visible icon
- Smart positioning: grid scan finds empty space first, auto-tile when full, cascade as last resort
- Auto-tile rearranges existing windows into grid (min 600x480 per cell, max 6 tiled)
- Cascade offset 42px (toolbar height) so every titlebar stays visible
- Drag clamping: windows can't leave viewport (all 4 edges)
- Browser resize clamping: windows animate back inside viewport with smooth transition
- Window state persistence in localStorage (position, size, open/close)
- Restored on page reload after boot screen

### Flutter Course Desktop Search
- Search bar in course header with flutter-blue theme
- Live filtering with highlighted matched text
- Click result plays video in player window
- `⌘F` keyboard hint badge

### Snake Game
- Keyboard input only when snake window is topmost (focused)
- Other windows don't intercept arrow keys / WASD

### Performance
- html2canvas snapshots: lazy capture only on MC open/close and desktop switch
- No periodic background capture, no scroll/drag listeners for snapshots
- `requestIdleCallback` for non-blocking snapshot capture
- Mission Control clones exclude iframes and canvas elements

### Other
- LinkedIn banner updated (new WebP, 29KB)
- Cache bust system (v=51)
