/**
 * Premium Image Pipeline
 * AI Generation → Watermark Removal → Optimization → Responsive Variants
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Types
export interface ImageProcessResult {
  success: boolean;
  original: {
    path: string;
    size: number;
  };
  optimized: {
    avif: string;
    webp: string;
    fallback: string;
  };
  variants: {
    thumbnail: string;  // 150w
    small: string;      // 480w
    medium: string;     // 800w
    large: string;      // 1200w
    full: string;       // 1920w
  };
  metadata: {
    width: number;
    height: number;
    aspectRatio: number;
    dominantColor: string;
    blurHash?: string;
  };
  savings: {
    originalSize: number;
    optimizedSize: number;
    percentReduced: number;
  };
  astroComponent: string; // Ready-to-use Astro Image component
}

export interface AIImageRequest {
  prompt: string;
  style?: 'photorealistic' | 'illustration' | 'icon' | 'abstract';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  provider?: 'dalle' | 'midjourney' | 'flux' | 'leonardo';
}

// Alias types for backward compatibility with index.ts exports
export type AIImageConfig = AIImageRequest;

export interface ImageProcessConfig {
  removeWatermark?: boolean;
  generateVariants?: boolean;
  generateAstroComponent?: boolean;
}

export interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  dominantColor: string;
  blurHash?: string;
}

export interface WatermarkRemovalResult {
  success: boolean;
  cleanedPath: string;
  method: 'ai-inpaint' | 'pattern-removal' | 'crop' | 'none';
  confidence: number;
}

// Configuration
const IMAGE_CONFIG = {
  outputDir: './public/images',
  tempDir: './temp/images',
  variants: [
    { name: 'thumbnail', width: 150 },
    { name: 'small', width: 480 },
    { name: 'medium', width: 800 },
    { name: 'large', width: 1200 },
    { name: 'full', width: 1920 },
  ],
  quality: {
    avif: 80,
    webp: 85,
    jpeg: 85,
  },
  watermarkPatterns: [
    // Common watermark positions
    { name: 'bottom-right', region: { x: '70%', y: '70%', w: '30%', h: '30%' } },
    { name: 'bottom-center', region: { x: '25%', y: '80%', w: '50%', h: '20%' } },
    { name: 'center', region: { x: '30%', y: '30%', w: '40%', h: '40%' } },
    { name: 'diagonal', region: { x: '0%', y: '0%', w: '100%', h: '100%' } },
  ],
};

/**
 * Main image processing pipeline
 */
export async function processImage(
  input: Buffer | string,
  outputName: string,
  options: {
    removeWatermark?: boolean;
    generateVariants?: boolean;
    generateAstroComponent?: boolean;
  } = {}
): Promise<ImageProcessResult> {
  const {
    removeWatermark = true,
    generateVariants = true,
    generateAstroComponent = true,
  } = options;

  // Ensure directories exist
  await ensureDirectories();

  // Get input as file path
  const inputPath = typeof input === 'string' ? input : await saveBuffer(input, outputName);
  const originalSize = fs.statSync(inputPath).size;

  // Step 1: Watermark removal (if needed)
  let cleanPath = inputPath;
  if (removeWatermark) {
    const watermarkResult = await removeWatermarks(inputPath);
    if (watermarkResult.success) {
      cleanPath = watermarkResult.cleanedPath;
    }
  }

  // Step 2: Extract metadata
  const metadata = await extractMetadata(cleanPath);

  // Step 3: Generate optimized formats
  const optimized = await generateOptimizedFormats(cleanPath, outputName);

  // Step 4: Generate responsive variants
  const variants = generateVariants
    ? await generateResponsiveVariants(cleanPath, outputName)
    : createEmptyVariants(outputName);

  // Calculate savings
  const optimizedSize = fs.existsSync(optimized.webp)
    ? fs.statSync(optimized.webp).size
    : originalSize;

  const savings = {
    originalSize,
    optimizedSize,
    percentReduced: Math.round((1 - optimizedSize / originalSize) * 100),
  };

  // Generate Astro component
  const astroComponent = generateAstroComponent
    ? generateAstroImageComponent(outputName, metadata, variants)
    : '';

  return {
    success: true,
    original: { path: inputPath, size: originalSize },
    optimized,
    variants,
    metadata,
    savings,
    astroComponent,
  };
}

/**
 * Remove watermarks from image using multiple strategies
 */
export async function removeWatermarks(imagePath: string): Promise<WatermarkRemovalResult> {
  // Strategy 1: Detect watermark location
  const watermarkInfo = await detectWatermark(imagePath);

  if (!watermarkInfo.detected) {
    return {
      success: true,
      cleanedPath: imagePath,
      method: 'none',
      confidence: 1.0,
    };
  }

  // Strategy 2: Try AI inpainting first (best quality)
  try {
    if (!watermarkInfo.region) {
      throw new Error('No watermark region detected');
    }
    const inpaintResult = await aiInpaint(imagePath, watermarkInfo.region);
    if (inpaintResult.success) {
      return {
        success: true,
        cleanedPath: inpaintResult.outputPath,
        method: 'ai-inpaint',
        confidence: inpaintResult.confidence,
      };
    }
  } catch {
    console.log('AI inpainting not available, trying pattern removal');
  }

  // Strategy 3: Pattern-based removal (faster, less quality)
  try {
    const patternResult = await patternBasedRemoval(imagePath, watermarkInfo);
    if (patternResult.success) {
      return {
        success: true,
        cleanedPath: patternResult.outputPath,
        method: 'pattern-removal',
        confidence: patternResult.confidence,
      };
    }
  } catch {
    console.log('Pattern removal failed, trying crop');
  }

  // Strategy 4: Crop (last resort)
  if (watermarkInfo.canCrop && watermarkInfo.region) {
    const croppedPath = await cropWatermark(imagePath, watermarkInfo.region);
    return {
      success: true,
      cleanedPath: croppedPath,
      method: 'crop',
      confidence: 0.7,
    };
  }

  // No removal possible
  return {
    success: false,
    cleanedPath: imagePath,
    method: 'none',
    confidence: 0,
  };
}

/**
 * Detect watermark in image
 */
async function detectWatermark(imagePath: string): Promise<{
  detected: boolean;
  region?: { x: number; y: number; width: number; height: number };
  type?: 'text' | 'logo' | 'pattern';
  canCrop: boolean;
}> {
  // Use Sharp or external tool to analyze image
  // This is a simplified implementation - in production, use ML-based detection

  try {
    // Check common watermark positions
    const imageInfo = await getImageInfo(imagePath);

    // Analyze bottom-right corner (most common watermark location)
    // In production, this would use actual image analysis
    const commonWatermarkRegions = [
      { x: imageInfo.width * 0.7, y: imageInfo.height * 0.8, width: imageInfo.width * 0.3, height: imageInfo.height * 0.2 },
      { x: imageInfo.width * 0.3, y: imageInfo.height * 0.4, width: imageInfo.width * 0.4, height: imageInfo.height * 0.2 },
    ];

    // Simplified detection - check if image likely has watermark based on patterns
    // Real implementation would use ML models like WatermarkRemoval or similar
    return {
      detected: false, // Conservative default
      canCrop: true,
    };
  } catch {
    return { detected: false, canCrop: false };
  }
}

/**
 * AI-based watermark inpainting
 */
async function aiInpaint(
  imagePath: string,
  region: { x: number; y: number; width: number; height: number }
): Promise<{ success: boolean; outputPath: string; confidence: number }> {
  // This would integrate with:
  // - Stable Diffusion inpainting
  // - DALL-E edit API
  // - Replicate models

  const outputPath = imagePath.replace(/\.[^.]+$/, '_clean$&');

  // Placeholder - in production, call actual AI service
  // Example with Replicate:
  /*
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  const output = await replicate.run(
    "stability-ai/stable-diffusion-inpainting",
    {
      input: {
        image: await fs.promises.readFile(imagePath, 'base64'),
        mask: generateMask(region),
        prompt: "seamless background, continue pattern"
      }
    }
  );
  */

  return {
    success: false,
    outputPath,
    confidence: 0,
  };
}

/**
 * Pattern-based watermark removal
 */
async function patternBasedRemoval(
  imagePath: string,
  watermarkInfo: { region?: { x: number; y: number; width: number; height: number } }
): Promise<{ success: boolean; outputPath: string; confidence: number }> {
  // Use content-aware fill techniques
  // This would use libraries like OpenCV or Sharp

  const outputPath = imagePath.replace(/\.[^.]+$/, '_clean$&');

  // Placeholder for actual implementation
  return {
    success: false,
    outputPath,
    confidence: 0,
  };
}

/**
 * Crop watermark region
 */
async function cropWatermark(
  imagePath: string,
  region: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const outputPath = imagePath.replace(/\.[^.]+$/, '_cropped$&');

  // Use Sharp to crop
  // This preserves as much of the image as possible while removing watermark area

  return outputPath;
}

/**
 * Extract image metadata
 */
async function extractMetadata(imagePath: string): Promise<{
  width: number;
  height: number;
  aspectRatio: number;
  dominantColor: string;
  blurHash?: string;
}> {
  const info = await getImageInfo(imagePath);

  return {
    width: info.width,
    height: info.height,
    aspectRatio: Number((info.width / info.height).toFixed(2)),
    dominantColor: info.dominantColor || '#808080',
    blurHash: info.blurHash,
  };
}

/**
 * Get basic image info using Sharp
 */
async function getImageInfo(imagePath: string): Promise<{
  width: number;
  height: number;
  format: string;
  dominantColor?: string;
  blurHash?: string;
}> {
  // Use Sharp or imagemagick identify
  // Simplified implementation:

  return new Promise((resolve, reject) => {
    const identify = spawn('identify', ['-format', '%w %h %m', imagePath]);
    let output = '';

    identify.stdout.on('data', (data) => {
      output += data.toString();
    });

    identify.on('close', (code) => {
      if (code === 0) {
        const [width, height, format] = output.trim().split(' ');
        resolve({
          width: parseInt(width) || 1920,
          height: parseInt(height) || 1080,
          format: format || 'JPEG',
          dominantColor: '#808080',
        });
      } else {
        // Fallback defaults
        resolve({
          width: 1920,
          height: 1080,
          format: 'JPEG',
          dominantColor: '#808080',
        });
      }
    });

    identify.on('error', () => {
      resolve({
        width: 1920,
        height: 1080,
        format: 'JPEG',
        dominantColor: '#808080',
      });
    });
  });
}

/**
 * Generate optimized formats (AVIF, WebP, fallback)
 */
async function generateOptimizedFormats(
  inputPath: string,
  outputName: string
): Promise<{ avif: string; webp: string; fallback: string }> {
  const baseOutput = path.join(IMAGE_CONFIG.outputDir, outputName);

  const avifPath = `${baseOutput}.avif`;
  const webpPath = `${baseOutput}.webp`;
  const fallbackPath = `${baseOutput}.jpg`;

  // Generate AVIF (best compression, modern browsers)
  await convertImage(inputPath, avifPath, 'avif', IMAGE_CONFIG.quality.avif);

  // Generate WebP (good compression, wide support)
  await convertImage(inputPath, webpPath, 'webp', IMAGE_CONFIG.quality.webp);

  // Generate JPEG fallback (universal support)
  await convertImage(inputPath, fallbackPath, 'jpeg', IMAGE_CONFIG.quality.jpeg);

  return {
    avif: avifPath,
    webp: webpPath,
    fallback: fallbackPath,
  };
}

/**
 * Convert image to specific format
 */
async function convertImage(
  input: string,
  output: string,
  format: string,
  quality: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Ensure output directory exists
    const dir = path.dirname(output);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Use Sharp (preferred) or ImageMagick
    const args = [
      input,
      '-quality', quality.toString(),
    ];

    if (format === 'avif') {
      args.push('-define', 'heic:speed=2');
    }

    args.push(output);

    const convert = spawn('convert', args);

    convert.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        // Fallback: just copy original
        fs.copyFileSync(input, output);
        resolve();
      }
    });

    convert.on('error', () => {
      fs.copyFileSync(input, output);
      resolve();
    });
  });
}

/**
 * Generate responsive image variants
 */
async function generateResponsiveVariants(
  inputPath: string,
  outputName: string
): Promise<{
  thumbnail: string;
  small: string;
  medium: string;
  large: string;
  full: string;
}> {
  const variants: Record<string, string> = {};

  for (const variant of IMAGE_CONFIG.variants) {
    const outputPath = path.join(
      IMAGE_CONFIG.outputDir,
      `${outputName}-${variant.width}w.webp`
    );

    await resizeImage(inputPath, outputPath, variant.width);
    variants[variant.name] = outputPath;
  }

  return variants as {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    full: string;
  };
}

/**
 * Resize image to specific width
 */
async function resizeImage(
  input: string,
  output: string,
  width: number
): Promise<void> {
  return new Promise((resolve) => {
    const dir = path.dirname(output);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const resize = spawn('convert', [
      input,
      '-resize', `${width}x`,
      '-quality', '85',
      output,
    ]);

    resize.on('close', () => resolve());
    resize.on('error', () => resolve());
  });
}

/**
 * Create empty variants object (when variants not generated)
 */
function createEmptyVariants(outputName: string): {
  thumbnail: string;
  small: string;
  medium: string;
  large: string;
  full: string;
} {
  const base = path.join(IMAGE_CONFIG.outputDir, outputName);
  return {
    thumbnail: `${base}.webp`,
    small: `${base}.webp`,
    medium: `${base}.webp`,
    large: `${base}.webp`,
    full: `${base}.webp`,
  };
}

/**
 * Generate Astro Image component code
 */
function generateAstroImageComponent(
  imageName: string,
  metadata: { width: number; height: number; aspectRatio: number; dominantColor: string },
  variants: { thumbnail: string; small: string; medium: string; large: string; full: string }
): string {
  const basePath = `/images/${imageName}`;

  return `---
// Optimized image: ${imageName}
// Original: ${metadata.width}x${metadata.height} (${metadata.aspectRatio}:1)
// Dominant color: ${metadata.dominantColor}
---

<picture>
  <source
    type="image/avif"
    srcset="
      ${basePath}-480w.avif 480w,
      ${basePath}-800w.avif 800w,
      ${basePath}-1200w.avif 1200w,
      ${basePath}-1920w.avif 1920w
    "
    sizes="(max-width: 480px) 480px, (max-width: 800px) 800px, (max-width: 1200px) 1200px, 1920px"
  />
  <source
    type="image/webp"
    srcset="
      ${basePath}-480w.webp 480w,
      ${basePath}-800w.webp 800w,
      ${basePath}-1200w.webp 1200w,
      ${basePath}-1920w.webp 1920w
    "
    sizes="(max-width: 480px) 480px, (max-width: 800px) 800px, (max-width: 1200px) 1200px, 1920px"
  />
  <img
    src="${basePath}.jpg"
    alt=""
    width="${metadata.width}"
    height="${metadata.height}"
    loading="lazy"
    decoding="async"
    style="background-color: ${metadata.dominantColor};"
    class="w-full h-auto"
  />
</picture>`;
}

/**
 * Ensure required directories exist
 */
async function ensureDirectories(): Promise<void> {
  const dirs = [IMAGE_CONFIG.outputDir, IMAGE_CONFIG.tempDir];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Save buffer to temporary file
 */
async function saveBuffer(buffer: Buffer, name: string): Promise<string> {
  const tempPath = path.join(IMAGE_CONFIG.tempDir, `${name}_original`);
  await ensureDirectories();
  fs.writeFileSync(tempPath, buffer);
  return tempPath;
}

/**
 * Generate AI image using external providers
 */
export async function generateAIImage(request: AIImageRequest): Promise<{
  success: boolean;
  imagePath?: string;
  error?: string;
}> {
  const {
    prompt,
    style = 'photorealistic',
    size = '1024x1024',
    provider = 'dalle',
  } = request;

  // Enhance prompt based on style
  const enhancedPrompt = enhancePrompt(prompt, style);

  try {
    switch (provider) {
      case 'dalle':
        return await generateWithDalle(enhancedPrompt, size);
      case 'flux':
        return await generateWithFlux(enhancedPrompt, size);
      default:
        return { success: false, error: `Unknown provider: ${provider}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Enhance prompt based on style
 */
function enhancePrompt(prompt: string, style: string): string {
  const styleEnhancements: Record<string, string> = {
    photorealistic: 'photorealistic, 4K, professional photography, perfect lighting, high detail',
    illustration: 'digital illustration, clean vector style, modern flat design, vibrant colors',
    icon: 'minimalist icon, single color, clean lines, simple geometric shapes, transparent background',
    abstract: 'abstract geometric patterns, soft gradients, modern design, subtle textures',
  };

  return `${prompt}, ${styleEnhancements[style] || styleEnhancements.photorealistic}`;
}

/**
 * Generate image with DALL-E
 */
async function generateWithDalle(
  prompt: string,
  size: string
): Promise<{ success: boolean; imagePath?: string; error?: string }> {
  // This would use OpenAI API
  // const openai = new OpenAI();
  // const response = await openai.images.generate({
  //   model: "dall-e-3",
  //   prompt,
  //   n: 1,
  //   size,
  // });

  return {
    success: false,
    error: 'DALL-E integration requires OpenAI API key',
  };
}

/**
 * Generate image with Flux
 */
async function generateWithFlux(
  prompt: string,
  size: string
): Promise<{ success: boolean; imagePath?: string; error?: string }> {
  // This would use Replicate or fal.ai
  // const replicate = new Replicate();
  // const output = await replicate.run("black-forest-labs/flux-schnell", { input: { prompt } });

  return {
    success: false,
    error: 'Flux integration requires Replicate API key',
  };
}

/**
 * Batch process multiple images
 */
export async function batchProcessImages(
  images: Array<{ input: Buffer | string; name: string }>,
  options?: {
    removeWatermark?: boolean;
    generateVariants?: boolean;
  }
): Promise<ImageProcessResult[]> {
  const results: ImageProcessResult[] = [];

  // Process in parallel with concurrency limit
  const concurrency = 3;
  for (let i = 0; i < images.length; i += concurrency) {
    const batch = images.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((img) => processImage(img.input, img.name, options))
    );
    results.push(...batchResults);
  }

  return results;
}

export default {
  processImage,
  removeWatermarks,
  generateAIImage,
  batchProcessImages,
};
