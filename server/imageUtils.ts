/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

/**
 * Detect image format from base64 data
 */
export function detectImageFormat(base64Data: string): string {
  // Check for data URL prefix
  if (base64Data.startsWith('data:')) {
    const match = base64Data.match(/^data:image\/(\w+);base64,/);
    if (match) {
      return match[1]; // png, jpeg, jpg, gif, webp, etc
    }
  }

  // Fallback to PNG if no format detected
  return 'png';
}

/**
 * Extract pure base64 data from data URL or return as-is
 */
export function extractBase64Data(base64Data: string): string {
  if (base64Data.startsWith('data:')) {
    const base64Match = base64Data.match(/^data:image\/\w+;base64,(.+)$/);
    if (base64Match) {
      return base64Match[1];
    }
  }
  return base64Data;
}

/**
 * Ensure pictures directory exists in session working directory
 */
export function ensurePicturesDirectory(workingDir: string): string {
  const picturesPath = path.join(workingDir, 'pictures');

  if (!fs.existsSync(picturesPath)) {
    fs.mkdirSync(picturesPath, { recursive: true });
  }

  return picturesPath;
}

/**
 * Save image to session's pictures folder
 * Returns relative path: ./pictures/image-{timestamp}-{random}.{ext}
 */
export function saveImageToSessionPictures(
  base64Data: string,
  sessionId: string,
  workingDir: string
): string {
  const picturesDir = ensurePicturesDirectory(workingDir);

  // Detect format and generate filename
  const format = detectImageFormat(base64Data);
  const timestamp = Date.now();
  const randomSuffix = randomBytes(4).toString('hex');
  const filename = `image-${timestamp}-${randomSuffix}.${format}`;
  const absolutePath = path.join(picturesDir, filename);
  const relativePath = `./pictures/${filename}`;

  // Extract pure base64 data and save
  const pureBase64 = extractBase64Data(base64Data);
  const buffer = Buffer.from(pureBase64, 'base64');

  fs.writeFileSync(absolutePath, buffer);

  return relativePath;
}

/**
 * Save non-image file to session's files folder
 * Returns relative path: ./files/{originalFilename}
 */
export function saveFileToSessionFiles(
  fileData: string,
  fileName: string,
  sessionId: string,
  workingDir: string
): string {
  const filesDir = path.join(workingDir, 'files');

  if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true });
  }

  // Use original filename for better model recognition
  const absolutePath = path.join(filesDir, fileName);
  const relativePath = `./files/${fileName}`;

  // Decode base64 and save
  const base64Match = fileData.match(/^data:[^;]+;base64,(.+)$/);
  const base64Data = base64Match ? base64Match[1] : fileData;
  const buffer = Buffer.from(base64Data, 'base64');

  fs.writeFileSync(absolutePath, buffer);

  return relativePath;
}

/**
 * Delete pictures directory for a session
 */
export function deleteSessionPictures(workingDir: string): void {
  const picturesPath = path.join(workingDir, 'pictures');

  if (fs.existsSync(picturesPath)) {
    fs.rmSync(picturesPath, { recursive: true, force: true });
  }
}

/**
 * Delete files directory for a session
 */
export function deleteSessionFiles(workingDir: string): void {
  const filesPath = path.join(workingDir, 'files');

  if (fs.existsSync(filesPath)) {
    fs.rmSync(filesPath, { recursive: true, force: true });
  }
}
