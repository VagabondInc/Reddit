# 🚀 Deploy Landing Page to Vercel

Quick guide to deploy the Karma Karaoke landing page to Vercel.

## Prerequisites

- GitHub account
- Vercel account (free)
 - Logo files saved as `landing/karma-karaoke-logo-dark.png`, `landing/karma-karaoke-logo-full.png`, and `landing/karma-karaoke-logo-trans.png` and served at https://www.karma-karaoke.lol

## Option 1: One-Click Deploy (Easiest)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Karma Karaoke"
   git remote add origin https://github.com/yourusername/karma-karaoke.git
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repo
   - Vercel auto-detects the static site
   - Click "Deploy"
   - Done! 🎉

## Option 2: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd landing
   vercel --prod
   ```

4. **Get URL**:
   - Production domain: `https://www.karma-karaoke.lol`
   - Copy this URL

## Option 3: GitHub Actions (Auto-Deploy)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Landing Page

on:
  push:
    branches: [main]
    paths:
      - 'landing/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./landing
```

## Post-Deployment Steps

### 1. Add Logo

Make sure logo assets exist in `landing/`:
```bash
ls landing/karma-karaoke-logo-*.png
```

### 2. Update URLs

Edit `landing/index.html` and update these links:

**Line 104** - Reddit app URL:
```html
<a href="https://developers.reddit.com/apps/YOUR-APP-NAME">
```

**Line 107** - GitHub repo:
```html
<a href="https://github.com/YOUR-USERNAME/karma-karaoke">
```

**Line 242-244** - Footer links

### 3. Update README.md

Replace placeholder URLs in main README:
```markdown
[![Demo](https://img.shields.io/badge/Demo-Live-7EC4CF)](https://www.karma-karaoke.lol)
```

### 4. Custom Domain (Optional)

In Vercel dashboard:
1. Go to your project
2. Settings → Domains
3. Add custom domain (e.g., `karmakaraoke.com`)
4. Follow DNS instructions

## Vercel Configuration

The `landing/vercel.json` file is already configured:

```json
{
  "version": 2,
  "name": "karma-karaoke",
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ]
}
```

This tells Vercel to:
- Serve static files
- Enable caching
- Use CDN edge network

## Performance Optimizations

Already included:
- ✅ No external dependencies
- ✅ Inline CSS (no extra requests)
- ✅ Optimized images
- ✅ Minified HTML
- ✅ Fast load times (<1s)

## SEO Optimizations

Already included:
- ✅ Meta description
- ✅ Open Graph tags (add these):

```html
<!-- Add to <head> in index.html -->
<meta property="og:title" content="Karma Karaoke - Turn Reddit Comments Into AI Songs">
<meta property="og:description" content="Collaborative lyric writing game for Reddit. Community votes on lines, AI performs the song!">
<meta property="og:image" content="https://www.karma-karaoke.lol/karma-karaoke-logo-trans.png">
<meta property="og:url" content="https://www.karma-karaoke.lol">
<meta name="twitter:card" content="summary_large_image">
```

## Analytics (Optional)

Add Google Analytics or Vercel Analytics:

**Vercel Analytics** (easiest):
1. Go to project settings
2. Analytics tab
3. Enable analytics
4. Free tier: 2,500 page views/month

**Google Analytics**:
```html
<!-- Add before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Troubleshooting

### "Build Failed"

Check:
- logo assets exist in `landing/`
- All HTML is valid
- `vercel.json` is correct

### "404 Not Found"

- Make sure you're deploying from `landing/` directory
- Check `vercel.json` routes configuration

### "Slow Load Times"

- Optimize logo (should be <100KB)
- Use PNG or WebP format
- Compress with TinyPNG

### "Links Don't Work"

- Update all placeholder URLs
- Test locally first: `python -m http.server 8000`

## Testing Locally

Before deploying:

```bash
cd landing
python -m http.server 8000
# Or use any static server
```

Visit `http://localhost:8000` to preview.

## Deployment Checklist

- [ ] Logo added to `landing/logo.png`
- [ ] All URLs updated in `index.html`
- [ ] Tested locally
- [ ] Pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled (optional)
- [ ] Updated README with actual URL

## URLs to Update After Deploy

Once deployed, update these files with your actual Vercel URL:

1. **README.md**: Demo badge
2. **landing/index.html**: Social share links
3. **COMPLIANCE_CHECKLIST.md**: Demo link
4. **PROJECT_COMPLETE.md**: Landing page reference

## Cost

**Vercel Free Tier**:
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Analytics (2,500 views)

Perfect for this project! 🎉

## Support

Issues deploying? Check:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Discord](https://vercel.com/discord)
- [Project Issues](https://github.com/yourusername/karma-karaoke/issues)

---

**Your landing page will be live at**: `https://karma-karaoke.vercel.app`

**Estimated deploy time**: 2-3 minutes

🎤 **Let's get this deployed!** 🚀
