import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { readFileAsArrayBuffer } from './formatters';
import { loadPdfJsDocument, renderPageToCanvas } from './pdfjs';

/**
 * Merges multiple PDF files into one.
 */
export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * Extracts specific pages (0-indexed) into a new PDF.
 */
export async function extractPages(file: File, pageIndices: number[]): Promise<Uint8Array> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const outPdf = await PDFDocument.create();

  const validIndices = pageIndices.filter((idx) => idx >= 0 && idx < srcPdf.getPageCount());
  if (validIndices.length === 0) {
    throw new Error('No valid pages selected for extraction.');
  }

  const copiedPages = await outPdf.copyPages(srcPdf, validIndices);
  copiedPages.forEach((page) => outPdf.addPage(page));

  return await outPdf.save();
}

/**
 * Removes specified pages (0-indexed) and produces a new PDF.
 */
export async function removePages(file: File, pageIndicesToRemove: number[]): Promise<Uint8Array> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const outPdf = await PDFDocument.create();

  const removeSet = new Set(pageIndicesToRemove);
  const keepIndices: number[] = [];

  for (let i = 0; i < srcPdf.getPageCount(); i++) {
    if (!removeSet.has(i)) {
      keepIndices.push(i);
    }
  }

  if (keepIndices.length === 0) {
    throw new Error('Cannot remove all pages. At least one page must remain.');
  }

  const copiedPages = await outPdf.copyPages(srcPdf, keepIndices);
  copiedPages.forEach((page) => outPdf.addPage(page));

  return await outPdf.save();
}

/**
 * Organizes pages: reorders according to pageOrder (0-indexed), applies per-page rotation deltas.
 */
export async function organizePdf(
  file: File,
  pageOrder: number[],
  rotations: Record<number, number>
): Promise<Uint8Array> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const outPdf = await PDFDocument.create();

  for (const pageIdx of pageOrder) {
    if (pageIdx < 0 || pageIdx >= srcPdf.getPageCount()) continue;
    const [copiedPage] = await outPdf.copyPages(srcPdf, [pageIdx]);
    const addedRotation = rotations[pageIdx] || 0;
    if (addedRotation !== 0) {
      const currentRot = copiedPage.getRotation()?.angle ?? 0;
      copiedPage.setRotation(degrees((currentRot + addedRotation) % 360));
    }
    outPdf.addPage(copiedPage);
  }

  return await outPdf.save();
}

/**
 * Rotates all pages or specific pages by specified degree angle.
 */
export async function rotatePdf(
  file: File,
  angleDegrees: number,
  pageRotations?: Record<number, number>
): Promise<Uint8Array> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const pages = pdfDoc.getPages();
  pages.forEach((page, idx) => {
    const currentRot = page.getRotation()?.angle ?? 0;
    let delta = angleDegrees;
    if (pageRotations && pageRotations[idx] !== undefined) {
      delta = pageRotations[idx];
    }
    const newAngle = ((currentRot + delta) % 360 + 360) % 360;
    page.setRotation(degrees(newAngle));
  });

  return await pdfDoc.save();
}

/**
 * Real compression: rasterizes pages at optimized resolutions and re-encodes images at chosen JPEG compression level.
 */
export async function compressPdf(
  file: File,
  preset: 'extreme' | 'recommended' | 'low'
): Promise<{ bytes: Uint8Array; originalSize: number; compressedSize: number }> {
  const originalSize = file.size;
  const arrayBuffer = await readFileAsArrayBuffer(file);

  // Settings per preset
  const config = {
    extreme: { scale: 1.0, quality: 0.45 },
    recommended: { scale: 1.3, quality: 0.65 },
    low: { scale: 1.6, quality: 0.82 },
  }[preset];

  const pdfJsDoc = await loadPdfJsDocument(arrayBuffer);
  const numPages = pdfJsDoc.numPages;

  const outDoc = await PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    const canvas = await renderPageToCanvas(pdfJsDoc, i, config.scale);
    const jpegDataUrl = canvas.toDataURL('image/jpeg', config.quality);
    const base64Data = jpegDataUrl.split(',')[1];
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const embeddedImage = await outDoc.embedJpg(imageBytes);
    const page = outDoc.addPage([canvas.width / config.scale, canvas.height / config.scale]);

    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: page.getWidth(),
      height: page.getHeight(),
    });
  }

  const bytes = await outDoc.save();
  return {
    bytes,
    originalSize,
    compressedSize: bytes.byteLength,
  };
}

/**
 * Converts multiple JPG or PNG images into a PDF.
 */
export async function imagesToPdf(
  files: File[],
  options: {
    orientation: 'portrait' | 'landscape' | 'auto';
    pageSize: 'a4' | 'fit' | 'letter';
    margin: number;
  }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');

    let embeddedImage;
    try {
      if (isPng) {
        embeddedImage = await pdfDoc.embedPng(arrayBuffer);
      } else {
        embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
      }
    } catch {
      // Browser canvas fallback for progressive JPEG, WebP, or non-standard format
      try {
        const blob = new Blob([arrayBuffer]);
        const imgBitmap = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = imgBitmap.width;
        canvas.height = imgBitmap.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(imgBitmap, 0, 0);
        const pngBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
        const fallbackBytes = await pngBlob.arrayBuffer();
        embeddedImage = await pdfDoc.embedPng(fallbackBytes);
      } catch {
        throw new Error(`Could not decode image format for ${file.name}`);
      }
    }

    const imgWidth = embeddedImage.width;
    const imgHeight = embeddedImage.height;

    let targetPageWidth = 595.28; // standard A4 pt
    let targetPageHeight = 841.89;

    if (options.pageSize === 'letter') {
      targetPageWidth = 612.0;
      targetPageHeight = 792.0;
    } else if (options.pageSize === 'fit') {
      targetPageWidth = imgWidth + options.margin * 2;
      targetPageHeight = imgHeight + options.margin * 2;
    }

    // Determine orientation
    let isLandscape = false;
    if (options.orientation === 'landscape') {
      isLandscape = true;
    } else if (options.orientation === 'auto') {
      isLandscape = imgWidth > imgHeight;
    }

    if (options.pageSize !== 'fit' && isLandscape && targetPageWidth < targetPageHeight) {
      const temp = targetPageWidth;
      targetPageWidth = targetPageHeight;
      targetPageHeight = temp;
    }

    const page = pdfDoc.addPage([targetPageWidth, targetPageHeight]);

    const usableWidth = Math.max(10, targetPageWidth - options.margin * 2);
    const usableHeight = Math.max(10, targetPageHeight - options.margin * 2);

    const scale = Math.min(usableWidth / imgWidth, usableHeight / imgHeight);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    const x = (targetPageWidth - drawWidth) / 2;
    const y = (targetPageHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return await pdfDoc.save();
}

/**
 * Adds page numbers to all pages.
 */
export async function addPageNumbers(
  file: File,
  options: {
    position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    startNumber: number;
    format: 'Page {n} of {total}' | 'Page {n}' | '{n}';
    fontSize: number;
  }
): Promise<Uint8Array> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const totalPages = pdfDoc.getPageCount();
  const pages = pdfDoc.getPages();

  for (let i = 0; i < totalPages; i++) {
    const page = pages[i];
    const pageNum = options.startNumber + i;
    let label = `${pageNum}`;
    if (options.format === 'Page {n}') {
      label = `Page ${pageNum}`;
    } else if (options.format === 'Page {n} of {total}') {
      label = `Page ${pageNum} of ${options.startNumber + totalPages - 1}`;
    }

    const textWidth = font.widthOfTextAtSize(label, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);

    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    const margin = 30;

    let x = margin;
    let y = margin;

    if (options.position.includes('center')) {
      x = (pageWidth - textWidth) / 2;
    } else if (options.position.includes('right')) {
      x = pageWidth - margin - textWidth;
    }

    if (options.position.startsWith('top')) {
      y = pageHeight - margin - textHeight;
    }

    page.drawText(label, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  return await pdfDoc.save();
}

/**
 * Adds a configurable watermark to all pages.
 */
export async function addWatermark(
  file: File,
  options: {
    text: string;
    opacity: number;
    fontSize: number;
    rotation: number;
    colorHex: string;
    position: 'center' | 'diagonal' | 'bottom';
  }
): Promise<Uint8Array> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Convert hex color to rgb
  const hex = options.colorHex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255 || 0.5;
  const g = parseInt(hex.substring(2, 4), 16) / 255 || 0.5;
  const b = parseInt(hex.substring(4, 6), 16) / 255 || 0.5;

  const pages = pdfDoc.getPages();
  const rotAngle = options.position === 'diagonal' ? 45 : options.rotation;
  const cleanText = options.text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ');

  for (const page of pages) {
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    const textWidth = font.widthOfTextAtSize(cleanText, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);

    let x = (pageWidth - textWidth) / 2;
    let y = (pageHeight - textHeight) / 2;

    if (options.position === 'bottom') {
      y = 40;
    }

    page.drawText(cleanText, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(r, g, b),
      opacity: options.opacity,
      rotate: degrees(rotAngle),
    });
  }

  return await pdfDoc.save();
}

/**
 * Signs a PDF page with a drawn/typed signature.
 */
export async function signPdf(
  file: File,
  signaturePngDataUrl: string,
  pageNumber: number, // 1-indexed
  placement: {
    xPct: number; // percentage 0-1 across canvas width
    yPct: number; // percentage 0-1 across canvas height
    widthPct: number;
    heightPct: number;
  }
): Promise<Uint8Array> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const base64Data = signaturePngDataUrl.split(',')[1];
  const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  const signatureImage = await pdfDoc.embedPng(imageBytes);

  const page = pdfDoc.getPage(pageNumber - 1);
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();

  const width = pageWidth * placement.widthPct;
  const height = pageHeight * placement.heightPct;
  const x = pageWidth * placement.xPct;
  // PDF coordinates have (0,0) at bottom-left, while browser canvas has (0,0) at top-left
  const y = pageHeight - (pageHeight * placement.yPct) - height;

  page.drawImage(signatureImage, {
    x,
    y,
    width,
    height,
  });

  return await pdfDoc.save();
}

/**
 * Burns blackout redaction rectangles onto a specific page.
 */
export async function redactPdf(
  file: File,
  pageNumber: number, // 1-indexed
  redactions: {
    xPct: number;
    yPct: number;
    widthPct: number;
    heightPct: number;
  }[]
): Promise<Uint8Array> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const page = pdfDoc.getPage(pageNumber - 1);
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();

  for (const rect of redactions) {
    const width = pageWidth * rect.widthPct;
    const height = pageHeight * rect.heightPct;
    const x = pageWidth * rect.xPct;
    const y = pageHeight - (pageHeight * rect.yPct) - height;

    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: rgb(0, 0, 0),
    });
  }

  return await pdfDoc.save();
}

/**
 * Adjusts crop margins on all pages.
 */
export async function cropPdf(
  file: File,
  margins: { top: number; bottom: number; left: number; right: number }
): Promise<Uint8Array> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const pages = pdfDoc.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    const newX = margins.left;
    const newY = margins.bottom;
    const newWidth = Math.max(50, width - margins.left - margins.right);
    const newHeight = Math.max(50, height - margins.top - margins.bottom);

    page.setCropBox(newX, newY, newWidth, newHeight);
  }

  return await pdfDoc.save();
}

/**
 * Repairs a damaged or non-standard PDF document by safely re-serializing objects and structure.
 */
export async function repairPdf(file: File): Promise<Uint8Array> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  // pdf-lib's ignoreEncryption and auto-repairing parser handles damaged cross-reference tables
  const pdfDoc = await PDFDocument.load(arrayBuffer, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  return await pdfDoc.save({ useObjectStreams: false });
}
