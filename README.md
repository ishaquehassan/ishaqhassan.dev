# ishaqhassan.dev

Personal portfolio website with a macOS-inspired desktop UI on larger screens and a native mobile app experience on phones.

## Features

**Desktop (macOS Style)**
- Draggable, resizable windows with traffic light controls
- Interactive dock with magnification effect
- Live desktop widgets (clock, GitHub activity, stats)
- Terminal-style About window with typing animation
- Animated aurora borealis wallpaper with particle system
- 3D tilt effect on cards
- Menu bar with dropdown navigation

**Mobile (App Style)**
- Scroll-based hero with animated gradient background
- Glass morphism section cards with scroll reveal animations
- Expandable detail views for each section
- Bottom social bar with quick links
- Animated number counters

**Content**
- Flutter framework contributions (3 merged, 2 approved PRs)
- 10+ speaking events at GDG, universities, conferences
- 16 professional roles across 13+ years
- 6 Medium articles on Flutter and Dart
- Open source projects (document_scanner_flutter, alarm plugin, etc.)
- Full tech stack showcase
- LinkedIn profile replica with tabbed navigation

## Stack

- Pure HTML, CSS, JavaScript (no frameworks, no build step)
- Hosted on DigitalOcean (nginx + Let's Encrypt SSL)
- Cloudflare CDN, DDoS protection, email routing
- Domain: ishaqhassan.dev (Name.com + Cloudflare DNS)

## Deploy

Pushes to `main` automatically deploy to the server via GitHub Actions.

```bash
git add . && git commit -m "update" && git push
```

## Local Dev

Just open `index.html` in a browser. No build tools needed.

## License

All rights reserved.
