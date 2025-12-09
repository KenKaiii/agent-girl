---
description: "Clone website with pixel-perfect accuracy"
argument-hint: "<url>"
---

# /clone - Pixel-Perfect Website Clone

Clone any website with complete accuracy using Puppeteer-based scraping.
Based on the proven astro-premium-builder method that achieves 95%+ visual match.

**Target URL:** $ARGUMENTS

## Prerequisites Check

Before starting, verify tools are available:

```bash
# Check if website-scraper is installed globally
npm list -g website-scraper || npm install -g website-scraper website-scraper-puppeteer

# Check for ImageMagick (for visual comparison)
which compare || brew install imagemagick
```

## Execution Protocol

### Phase 1: Setup & Analysis

1. **Extract Domain Name**
   ```bash
   DOMAIN=$(echo "$ARGUMENTS" | sed 's|https\?://||' | sed 's|/.*||' | sed 's|^www\.||')
   OUTPUT_DIR="/Users/master/astro-clones/cloned-${DOMAIN}"
   echo "Cloning $ARGUMENTS to $OUTPUT_DIR"
   ```

2. **Create Clone Script**
   Generate a Node.js script for complete website cloning:

   ```javascript
   // /Users/master/astro-clones/clone-script.mjs
   import scrape from 'website-scraper';
   import PuppeteerPlugin from 'website-scraper-puppeteer';
   import path from 'path';

   const TARGET_URL = '$ARGUMENTS';
   const OUTPUT_DIR = process.env.OUTPUT_DIR || './cloned-site';
   const DOMAIN = new URL(TARGET_URL).hostname;

   const options = {
     urls: [TARGET_URL],
     directory: OUTPUT_DIR,

     // Use Puppeteer for JavaScript-rendered content
     plugins: [
       new PuppeteerPlugin({
         launchOptions: {
           headless: 'new',
           args: ['--no-sandbox', '--disable-setuid-sandbox']
         },
         scrollToBottom: { timeout: 10000, viewportN: 10 },
         blockNavigation: true
       })
     ],

     // Browser headers
     request: {
       headers: {
         'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
       }
     },

     // Download ALL resource types
     sources: [
       { selector: 'img', attr: 'src' },
       { selector: 'img', attr: 'srcset' },
       { selector: 'link[rel="stylesheet"]', attr: 'href' },
       { selector: 'link[rel="icon"]', attr: 'href' },
       { selector: 'script', attr: 'src' },
       { selector: 'video', attr: 'src' },
       { selector: 'video source', attr: 'src' },
       { selector: 'source', attr: 'src' },
       { selector: 'a[href$=".pdf"]', attr: 'href' }
     ],

     // Organize by file type
     subdirectories: [
       { directory: 'images', extensions: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif', '.ico'] },
       { directory: 'css', extensions: ['.css'] },
       { directory: 'js', extensions: ['.js'] },
       { directory: 'fonts', extensions: ['.woff', '.woff2', '.ttf', '.eot', '.otf'] },
       { directory: 'media', extensions: ['.mp4', '.webm', '.mp3'] }
     ],

     filenameGenerator: 'bySiteStructure',
     prettifyUrls: true,
     recursive: true,
     maxRecursiveDepth: 3,
     urlFilter: (url) => url.includes(DOMAIN),
     ignoreRobotsTxt: true
   };

   console.log('🚀 Starting clone of ' + TARGET_URL);
   scrape(options)
     .then(result => {
       console.log('✅ Clone complete! Downloaded ' + result.length + ' files');
       console.log('📁 Location: ' + OUTPUT_DIR);
     })
     .catch(err => {
       console.error('❌ Error:', err.message);
       process.exit(1);
     });
   ```

### Phase 2: Execute Clone

3. **Run Clone Script**
   ```bash
   cd /Users/master/astro-clones
   OUTPUT_DIR="$OUTPUT_DIR" node clone-script.mjs
   ```
   - Wait for completion (may take 2-5 minutes)
   - CHECKPOINT: "clone_complete"

### Phase 3: Asset Sanitization (CRITICAL)

4. **Fix Query String Filenames**
   Files often have `?v=1.2.3` suffixes that break references:

   ```bash
   # Find the actual HTML directory
   HTML_DIR=$(find "$OUTPUT_DIR" -name "index.html" -type f | head -1 | xargs dirname)

   # Fix fonts
   cd "$HTML_DIR/fonts" 2>/dev/null && for f in *\?*; do
     [ -f "$f" ] && base=$(echo "$f" | sed 's/\?.*$//') && [ ! -f "$base" ] && cp "$f" "$base"
   done

   # Fix CSS
   cd "$HTML_DIR/css" 2>/dev/null && for f in *\?*; do
     [ -f "$f" ] && base=$(echo "$f" | sed 's/\?.*$//') && [ ! -f "$base" ] && cp "$f" "$base"
   done

   # Fix images
   cd "$HTML_DIR/images" 2>/dev/null && for f in *\?*; do
     [ -f "$f" ] && base=$(echo "$f" | sed 's/\?.*$//') && [ ! -f "$base" ] && cp "$f" "$base"
   done
   ```
   - CHECKPOINT: "assets_sanitized"

### Phase 4: Verification

5. **Start Local Server**
   ```bash
   HTML_DIR=$(find "$OUTPUT_DIR" -name "index.html" -type f | head -1 | xargs dirname)
   cd "$HTML_DIR"

   # Kill any existing server on 4321
   lsof -ti:4321 | xargs kill -9 2>/dev/null

   # Start Python server in background
   python3 -m http.server 4321 &
   SERVER_PID=$!

   # Wait and verify
   sleep 3
   HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4321)

   if [ "$HTTP_CODE" = "200" ]; then
     echo "✅ Server running on http://localhost:4321"
   else
     echo "❌ Server returned $HTTP_CODE - check for missing assets"
   fi
   ```
   - CHECKPOINT: "server_verified"

6. **Visual Comparison (Optional but Recommended)**
   Take screenshots of original vs clone to verify accuracy:

   ```bash
   # Install puppeteer if needed
   npm list puppeteer || npm install puppeteer

   # Create comparison script and run
   # This compares original URL with localhost:4321
   ```

### Phase 5: Open Preview (CRITICAL - DO NOT SKIP)

7. **Display Preview in Agent Girl**

   After server verification, output the preview action tag:

   ```
   🚀 **Clone Complete!**

   **Source:** $ARGUMENTS
   **Location:** [HTML_DIR path]
   **Preview:** http://localhost:4321

   <preview-action type="open" url="http://localhost:4321" />
   ```

   This automatically opens the split-screen preview panel.
   - CHECKPOINT: "preview_opened"

## Progress Tracking

Use TodoWrite with these items:
```
1. [pending] Setup and extract domain
2. [pending] Generate clone script
3. [pending] Execute Puppeteer clone
4. [pending] Sanitize asset filenames
5. [pending] Start and verify local server
6. [pending] Visual comparison (optional)
7. [pending] Open preview in Agent Girl
```

## Troubleshooting

### Common Issues

**500 Error on Load:**
- Missing fonts/CSS - run asset sanitization again
- Check browser console for 404 errors
- Copy missing files from `?version` variants

**Blank Page:**
- JavaScript might not have executed
- Try with `js_render: true` in website-scraper
- Check if site uses client-side rendering (React/Vue)

**Missing Images:**
- Some images loaded dynamically
- Use `scrollToBottom` option to trigger lazy loading
- Manually download missing images

**Fonts Not Loading:**
- Check font-face declarations in CSS
- Ensure font files exist without query strings
- Check CORS if loading from CDN

## Quality Targets

- **Visual Match:** 95%+ pixel accuracy
- **All Assets:** HTML, CSS, JS, images, fonts, media
- **Functional:** Links work, forms display (may not submit)
- **Performance:** Should load in < 3 seconds locally

## Fallback: Manual Clone

If automated clone fails, use browser DevTools:
1. Open Network tab
2. Load page completely
3. Right-click > Save As > Complete Webpage
4. Or use `wget --mirror` as alternative

Execute now with progress tracking.
