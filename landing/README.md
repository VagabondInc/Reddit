# Karma Karaoke Landing Page

A modern, responsive landing page for the Karma Karaoke Reddit app.

## 🎨 Design

- **Colors**: Gradient sunset theme (orange → pink → purple → blue)
- **Logo**: Reddit Snoo with microphone
- **Style**: Dark theme with gradient accents
- **Responsive**: Mobile-first design

## 🚀 Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/karma-karaoke/tree/main/landing)

### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from landing directory
cd landing
vercel

# Or deploy from root
vercel --prod
```

### Environment Setup

No environment variables needed! This is a static site.

## 📁 Files

- `index.html` - Main landing page
- `logo.png` - Karma Karaoke logo (place here)
- `vercel.json` - Vercel configuration
- `README.md` - This file

## 🎯 Features

- ✅ Animated floating logo
- ✅ Gradient text effects
- ✅ Hover animations on cards
- ✅ Mobile responsive
- ✅ SEO optimized
- ✅ Fast load times (<1s)

## 🔗 Links to Update

Before deploying, update these URLs in `index.html`:

1. **Line 104**: Reddit app URL
   ```html
   <a href="https://developers.reddit.com/apps/karma-karaoke">
   ```

2. **Line 107**: GitHub repo URL
   ```html
   <a href="https://github.com/yourusername/karma-karaoke">
   ```

3. **Line 242-244**: Footer links

## 🎨 Color Scheme

```css
Primary: #FF9D5C (orange)
Secondary: #FF7B9D (pink)
Accent: #B89FE8 (purple)
Highlight: #7EC4CF (blue)
Background: #1C1C1C (dark)
Text: #FFFFFF (white)
```

## 📱 Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## ⚡ Performance

- No external dependencies
- Pure HTML/CSS
- Optimized images
- Fast loading

## 📄 License

MIT License - Same as main project
