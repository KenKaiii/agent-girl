
import scrape from 'website-scraper';
import PuppeteerPlugin from 'website-scraper-puppeteer';

const TARGET_URL = 'https://example.com';
const OUTPUT_DIR = '/Users/master/astro-clones/cloned-example.com';
const DOMAIN = 'example.com';

const options = {
  urls: [TARGET_URL],
  directory: OUTPUT_DIR,
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
  request: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  },
  sources: [
    { selector: 'img', attr: 'src' },
    { selector: 'img', attr: 'srcset' },
    { selector: 'link[rel="stylesheet"]', attr: 'href' },
    { selector: 'link[rel="icon"]', attr: 'href' },
    { selector: 'link[rel="preload"]', attr: 'href' },
    { selector: 'script', attr: 'src' },
    { selector: 'video', attr: 'src' },
    { selector: 'video source', attr: 'src' },
    { selector: 'video', attr: 'poster' },
    { selector: 'source', attr: 'src' },
    { selector: 'source', attr: 'srcset' },
    { selector: 'a[href$=".pdf"]', attr: 'href' },
    { selector: '[style*="background"]', attr: 'style' }
  ],
  subdirectories: [
    { directory: 'images', extensions: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.avif', '.ico', '.bmp'] },
    { directory: 'css', extensions: ['.css'] },
    { directory: 'js', extensions: ['.js', '.mjs'] },
    { directory: 'fonts', extensions: ['.woff', '.woff2', '.ttf', '.eot', '.otf'] },
    { directory: 'media', extensions: ['.mp4', '.webm', '.mp3', '.ogg', '.wav'] },
    { directory: 'docs', extensions: ['.pdf', '.doc', '.docx'] }
  ],
  filenameGenerator: 'bySiteStructure',
  prettifyUrls: true,
  recursive: true,
  maxRecursiveDepth: 3,
  urlFilter: (url) => url.includes(DOMAIN) || url.includes('cdn') || url.includes('static'),
  ignoreRobotsTxt: true
};

console.log(JSON.stringify({ type: 'start', url: TARGET_URL }));

scrape(options)
  .then(result => {
    console.log(JSON.stringify({
      type: 'complete',
      files: result.length,
      outputDir: OUTPUT_DIR
    }));
  })
  .catch(err => {
    console.log(JSON.stringify({
      type: 'error',
      message: err.message
    }));
    process.exit(1);
  });
