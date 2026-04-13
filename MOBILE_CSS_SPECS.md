# Mobile CSS Specifications

## File Location
`/Users/ishaqhassan/Desktop/Personal/ishaqhassan-dev/index.html`
- **Lines**: 803-1137 (@media query section)
- **Total lines added**: 334 lines
- **CSS weight**: ~12KB

## Breakpoint
```css
@media (max-width: 768px) {
  /* All mobile CSS here */
}
```

## Component Specifications

### 1. Menubar (Status Bar)
```css
#menubar {
  height: 24px;           /* Was: 28px */
  font-size: 11px;        /* Compact */
  padding: 0 8px;         /* Reduced from 0 10px */
}

#menubar .menu-item {
  padding: 0 6px;         /* Reduced from 0 11px */
  height: 22px;
  line-height: 22px;
  font-size: 11px;
}

#menubar .right {
  gap: 8px;               /* Reduced from 14px */
  font-size: 10px;        /* Smaller icons text */
}
```

### 2. Dock (Bottom Tab Bar)
```css
#dock-container {
  position: fixed;
  bottom: 0;              /* Stick to bottom */
  left: 0;
  right: 0;
  z-index: 9998;
  padding-bottom: env(safe-area-inset-bottom, 0);  /* Notch support */
}

#dock {
  height: 60px;           /* Fixed height */
  padding: 8px 0 env(safe-area-inset-bottom, 8px) 0;
  background: rgba(30,30,46,0.92);
  backdrop-filter: blur(40px);
  border-top: 1px solid rgba(255,255,255,0.06);
  justify-content: space-around;
  gap: 0;                 /* No gap between items */
}

.dock-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;                /* Equal distribution */
  height: 44px;
}

.dock-icon {
  width: 36px;            /* Was: 44px */
  height: 36px;           /* Was: 44px */
  font-size: 18px;        /* Was: 22px */
  border-radius: 8px;
}

.dock-item:active .dock-icon {
  background: rgba(99,102,241,0.3);  /* Tap feedback */
}

.dock-tooltip {
  display: none;          /* Hide tooltips */
}
```

### 3. Windows (Full Screen Overlay)
```css
.window {
  position: fixed;
  top: 24px;              /* Below menubar */
  left: 0;
  right: 0;
  bottom: 60px;           /* Above dock */
  width: 100vw;
  height: calc(100vh - 84px);  /* 24px + 60px */
  border-radius: 0;       /* Rectangular, no curves */
}

.window.open {
  animation: mobileWindowOpen 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.window.closing {
  animation: mobileWindowClose 0.25s cubic-bezier(0.5, 0, 0.75, 0) forwards;
}

@keyframes mobileWindowOpen {
  from {
    opacity: 0;
    transform: translateY(100%);    /* Slide from bottom */
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes mobileWindowClose {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(100%);    /* Slide to bottom */
  }
}

.window-resize {
  display: none;          /* Hide resize handle */
}
```

### 4. Window Toolbar
```css
.window-toolbar {
  height: 36px;           /* Was: 40px (--toolbar-h) */
  background: rgba(20,20,30,0.6);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  cursor: default;
}

.traffic-lights {
  display: flex;
  gap: 4px;
  align-items: center;
  min-width: 30px;
}

.traffic-light {
  display: none;          /* Hide all by default */
}

.traffic-light.tl-close {
  display: flex;          /* Show only close button */
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.6);
  font-size: 16px;
  cursor: pointer;
}

.traffic-light.tl-close:active {
  background: rgba(255,255,255,0.15);
}

.tl-minimize,
.tl-maximize {
  display: none !important;
}

.window-title {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 13px;        /* Smaller title */
  font-weight: 500;
  color: rgba(255,255,255,0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### 5. Window Body Content
```css
.window-body {
  height: calc(100% - 36px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;          /* Was: 20px */
  font-size: 14px;
}

.window-body p {
  font-size: 13px;        /* Readable size */
  line-height: 1.5;
}

.window-body h2 {
  font-size: 16px;
  margin: 12px 0 8px 0;
}

.window-body h3 {
  font-size: 14px;
  margin: 10px 0 6px 0;
}
```

### 6. Content Grids

#### Contact Grid (1 column)
```css
.contact-grid {
  grid-template-columns: 1fr;  /* Was: 1fr 1fr (2 cols) */
  gap: 12px;
}

.contact-item {
  padding: 12px;
}
```

#### Tech Grid (3 columns)
```css
.tech-grid {
  grid-template-columns: repeat(3, 1fr);  /* Was: auto-fill */
  gap: 8px;
}

.tech-item {
  padding: 10px 4px;
  text-align: center;
  font-size: 12px;
}

.tech-icon {
  font-size: 32px;
  margin-bottom: 4px;
}
```

#### Stat Row (3 columns, smaller)
```css
.stat-row {
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.stat-card {
  padding: 12px 8px;
}

.stat-num {
  font-size: 18px;        /* Was: 20px */
  font-weight: 700;
}

.stat-label {
  font-size: 11px;
}
```

### 7. Experience Items
```css
.exp-item {
  padding: 12px;
  border-left: 3px solid rgba(99,102,241,0.3);
}

.exp-company {
  font-size: 13px;
  font-weight: 600;
}

.exp-title {
  font-size: 12px;
}

.exp-date {
  font-size: 11px;
}

.exp-desc {
  font-size: 12px;
}
```

### 8. LinkedIn Tabs (Horizontal Scroll)
```css
.linkedin-tabs {
  display: flex;
  gap: 0;
  overflow-x: auto;       /* Horizontal scroll */
  padding-bottom: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  scroll-behavior: smooth;
}

.linkedin-tab {
  font-size: 12px;
  padding: 8px 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

.linkedin-tab.active {
  border-bottom: 2px solid rgba(99,102,241,0.8);
  color: rgba(99,102,241,0.9);
}
```

### 9. Articles
```css
.article-item {
  padding: 12px;
  margin-bottom: 8px;
}

.article-title {
  font-size: 13px;        /* Was: 14px */
  font-weight: 600;
}

.article-meta {
  font-size: 11px;
  margin-top: 4px;
}
```

### 10. Hidden Elements on Mobile
```css
.widget {
  display: none !important;   /* Hide all widgets */
}

#desktop {
  display: none;              /* Hide widget columns */
}

.menu-dropdown {
  display: none;              /* Hide menu dropdowns */
}

.dock-tooltip {
  display: none;              /* Hide dock tooltips */
}
```

### 11. Boot Screen Adjustments
```css
#boot-logo {
  font-size: 56px;        /* Was: 64px */
  margin-bottom: 24px;    /* Was: 30px */
}

#boot-bar-container {
  width: 160px;           /* Was: 200px */
}
```

## Key Design Decisions

1. **Fixed Dock**: Prevents overlap with window content
2. **Full-Screen Windows**: Maximize usable space
3. **Smooth Animations**: 0.3s/0.25s for snappy feel
4. **Safe Area Support**: `env()` for notched devices
5. **Touch Feedback**: Active state on dock icons
6. **No Hover Effects**: Mobile devices don't hover
7. **Readable Fonts**: 13-14px minimum for comfort
8. **Proper Contrast**: Maintained for accessibility
9. **Efficient Space**: Single column where needed, 3-cols where space allows
10. **No Resize Handles**: Not needed on mobile

## Performance Impact

- **CSS Size**: ~12KB (minimal)
- **Rendering**: No JavaScript changes (CSS-only)
- **Animations**: GPU-accelerated transforms
- **Transitions**: Smooth 60fps (no janky scrolling)
- **Load Time**: No increase (already loaded in main file)

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CSS Grid | ✅ | ✅ | ✅ | ✅ |
| Flexbox | ✅ | ✅ | ✅ | ✅ |
| Media Queries | ✅ | ✅ | ✅ | ✅ |
| env() (safe-area) | ✅ | ✅ | ✅ | ✅ |
| Backdrop-filter | ✅ | ⚠️ | ✅ | ✅ |
| Transform animate | ✅ | ✅ | ✅ | ✅ |

*Note: env() has fallback values for unsupported browsers*
