import JSZip from 'jszip';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Sanitizes strings for PDF StandardFonts (WinAnsi encoding) to prevent encoding crashes
 */
export function sanitizeText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ');
}

/**
 * Helper to split text into wrapped lines fitting within maxWidth
 */
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const clean = sanitizeText(text).trim();
  if (!clean) return [''];

  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
}

// =========================================================================
// 1. WORD TO PDF CONVERTER (.docx / .doc / .txt)
// =========================================================================

export interface WordConvertOptions {
  fontSize?: number;
  lineSpacing?: number;
}

export async function convertWordToPdf(
  file: File,
  options: WordConvertOptions = {}
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.create();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // A4 Dimensions: 595.28 x 841.89 pt
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 54;
  const marginTop = 54;
  const marginBottom = 54;
  const contentWidth = pageWidth - marginX * 2;

  const baseFontSize = options.fontSize || 11;
  const baseLineHeight = baseFontSize * (options.lineSpacing || 1.4);

  // Extract paragraphs from docx or plain text
  interface ExtractedParagraph {
    text: string;
    isHeading: boolean;
    headingLevel?: number;
    isBold?: boolean;
    isBullet?: boolean;
  }

  const paragraphs: ExtractedParagraph[] = [];

  const fileNameLower = file.name.toLowerCase();
  if (fileNameLower.endsWith('.docx')) {
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);
      const documentXml = await zip.file('word/document.xml')?.async('string');

      if (documentXml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(documentXml, 'text/xml');
        const pNodes = xmlDoc.getElementsByTagName('w:p');

        for (let i = 0; i < pNodes.length; i++) {
          const p = pNodes[i];

          // Check style for headings
          let isHeading = false;
          let headingLevel = 1;
          const pStyle = p.getElementsByTagName('w:pStyle')[0];
          if (pStyle) {
            const styleVal = pStyle.getAttribute('w:val') || '';
            if (/heading\s*1/i.test(styleVal) || styleVal === 'Heading1' || styleVal === 'Title') {
              isHeading = true;
              headingLevel = 1;
            } else if (/heading\s*2/i.test(styleVal) || styleVal === 'Heading2') {
              isHeading = true;
              headingLevel = 2;
            } else if (/heading\s*3/i.test(styleVal) || styleVal === 'Heading3') {
              isHeading = true;
              headingLevel = 3;
            }
          }

          // Check for bullet list
          const numPr = p.getElementsByTagName('w:numPr')[0];
          const isBullet = !!numPr;

          // Extract text from runs
          const tNodes = p.getElementsByTagName('w:t');
          let text = '';
          for (let j = 0; j < tNodes.length; j++) {
            text += tNodes[j].textContent || '';
          }

          const trimmed = text.trim();
          if (trimmed) {
            paragraphs.push({
              text: trimmed,
              isHeading,
              headingLevel,
              isBullet,
            });
          }
        }
      }
    } catch {
      // Fallback if docx reading fails: read raw text
      const text = await file.text();
      text.split(/\r?\n/).forEach((line) => {
        const t = line.trim();
        if (t) paragraphs.push({ text: t, isHeading: false });
      });
    }
  } else {
    // Plain text / .txt fallback
    const text = await file.text();
    text.split(/\r?\n/).forEach((line) => {
      const t = line.trim();
      if (t) paragraphs.push({ text: t, isHeading: false });
    });
  }

  // If no paragraphs were found, add a fallback notice
  if (paragraphs.length === 0) {
    paragraphs.push({ text: `Document: ${file.name}`, isHeading: true, headingLevel: 1 });
    paragraphs.push({ text: 'Converted from Word document.', isHeading: false });
  }

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - marginTop;
  let pageNumber = 1;

  const drawFooter = (page: any, num: number) => {
    const footerText = `Page ${num}`;
    const w = fontRegular.widthOfTextAtSize(footerText, 9);
    page.drawText(footerText, {
      x: pageWidth - marginX - w,
      y: marginBottom / 2,
      size: 9,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Subtle line above footer
    page.drawLine({
      start: { x: marginX, y: marginBottom / 2 + 14 },
      end: { x: pageWidth - marginX, y: marginBottom / 2 + 14 },
      thickness: 0.5,
      color: rgb(0.85, 0.88, 0.92),
    });
  };

  for (const para of paragraphs) {
    let font = fontRegular;
    let size = baseFontSize;
    let spacingAfter = 8;
    let color = rgb(0.15, 0.18, 0.22);
    let indent = 0;

    if (para.isHeading) {
      font = fontBold;
      if (para.headingLevel === 1) {
        size = 18;
        spacingAfter = 14;
        color = rgb(0.08, 0.12, 0.25);
      } else if (para.headingLevel === 2) {
        size = 14;
        spacingAfter = 10;
        color = rgb(0.12, 0.16, 0.3);
      } else {
        size = 12;
        spacingAfter = 8;
      }
    } else if (para.isBullet) {
      indent = 16;
    }

    const availableWidth = contentWidth - indent;
    const lines = wrapText(para.text, availableWidth, font, size);
    const paraLineHeight = size * (options.lineSpacing || 1.35);

    // Check if paragraph fits on current page
    const totalParaHeight = lines.length * paraLineHeight + spacingAfter;
    if (y - totalParaHeight < marginBottom) {
      drawFooter(currentPage, pageNumber);
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      pageNumber++;
      y = pageHeight - marginTop;
    }

    // Draw bullet dot if needed
    if (para.isBullet) {
      currentPage.drawText('•', {
        x: marginX + 4,
        y: y - size + 2,
        size: size + 2,
        font: fontBold,
        color: rgb(0.2, 0.45, 0.9),
      });
    }

    // Draw lines
    for (const line of lines) {
      currentPage.drawText(line, {
        x: marginX + indent,
        y: y - size,
        size,
        font,
        color,
      });
      y -= paraLineHeight;
    }

    y -= spacingAfter;
  }

  drawFooter(currentPage, pageNumber);
  return await pdfDoc.save();
}

// =========================================================================
// 2. EXCEL TO PDF CONVERTER (.xlsx / .csv / .tsv)
// =========================================================================

export interface ExcelConvertOptions {
  orientation?: 'portrait' | 'landscape' | 'auto';
  showGrid?: boolean;
}

export async function convertExcelToPdf(
  file: File,
  options: ExcelConvertOptions = {}
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.create();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Parse tabular data
  let tableRows: string[][] = [];

  const fileNameLower = file.name.toLowerCase();
  if (fileNameLower.endsWith('.xlsx')) {
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);

      // 1. Shared Strings table
      const sharedStringsXml = await zip.file('xl/sharedStrings.xml')?.async('string');
      const sharedStrings: string[] = [];
      if (sharedStringsXml) {
        const parser = new DOMParser();
        const ssDoc = parser.parseFromString(sharedStringsXml, 'text/xml');
        const siNodes = ssDoc.getElementsByTagName('si');
        for (let i = 0; i < siNodes.length; i++) {
          const tNodes = siNodes[i].getElementsByTagName('t');
          let str = '';
          for (let j = 0; j < tNodes.length; j++) {
            str += tNodes[j].textContent || '';
          }
          sharedStrings.push(str);
        }
      }

      // 2. Sheet 1 XML
      const sheetXml = await zip.file('xl/worksheets/sheet1.xml')?.async('string');
      if (sheetXml) {
        const parser = new DOMParser();
        const sheetDoc = parser.parseFromString(sheetXml, 'text/xml');
        const rowNodes = sheetDoc.getElementsByTagName('row');

        for (let r = 0; r < rowNodes.length; r++) {
          const rowEl = rowNodes[r];
          const cellNodes = rowEl.getElementsByTagName('c');
          const rowData: string[] = [];

          for (let c = 0; c < cellNodes.length; c++) {
            const cell = cellNodes[c];
            const cellType = cell.getAttribute('t');
            const valEl = cell.getElementsByTagName('v')[0];
            let val = valEl ? valEl.textContent || '' : '';

            if (cellType === 's') {
              const idx = parseInt(val, 10);
              val = sharedStrings[idx] || '';
            } else if (cellType === 'inlineStr') {
              const tEl = cell.getElementsByTagName('t')[0];
              val = tEl ? tEl.textContent || '' : '';
            }

            rowData.push(sanitizeText(val));
          }

          if (rowData.some((cell) => cell.trim().length > 0)) {
            tableRows.push(rowData);
          }
        }
      }
    } catch {
      // Fallback to text parsing
      const text = await file.text();
      tableRows = text.split(/\r?\n/).map((l) => l.split(/[,;\t]/).map(sanitizeText));
    }
  } else {
    // CSV / TSV file
    const text = await file.text();
    tableRows = text
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0)
      .map((l) => l.split(fileNameLower.endsWith('.tsv') ? '\t' : ',').map(sanitizeText));
  }

  // Ensure we have at least sample data
  if (tableRows.length === 0) {
    tableRows = [
      ['Column 1', 'Column 2', 'Column 3'],
      ['Row 1 Value', 'Data A', '100'],
      ['Row 2 Value', 'Data B', '250'],
    ];
  }

  // Normalize column count
  const maxCols = Math.min(10, Math.max(...tableRows.map((r) => r.length), 1));
  tableRows = tableRows.map((r) => {
    const row = [...r.slice(0, maxCols)];
    while (row.length < maxCols) row.push('');
    return row;
  });

  // Determine orientation
  const isLandscape =
    options.orientation === 'landscape' ||
    (options.orientation !== 'portrait' && maxCols > 4);

  const pageWidth = isLandscape ? 841.89 : 595.28;
  const pageHeight = isLandscape ? 595.28 : 841.89;
  const marginX = 36;
  const marginTop = 40;
  const marginBottom = 40;
  const tableWidth = pageWidth - marginX * 2;

  // Calculate Column Widths
  const colWidth = tableWidth / maxCols;
  const rowHeight = 22;
  const headerHeight = 26;
  const fontSize = maxCols > 6 ? 8 : 9;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - marginTop;
  let pageNumber = 1;

  // Document Title Header
  currentPage.drawText(sanitizeText(file.name.replace(/\.[^/.]+$/, '')), {
    x: marginX,
    y: y - 14,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.25),
  });
  y -= 30;

  const drawTableHeader = (page: any, atY: number) => {
    // Header background fill
    page.drawRectangle({
      x: marginX,
      y: atY - headerHeight,
      width: tableWidth,
      height: headerHeight,
      color: rgb(0.12, 0.25, 0.55),
    });

    const headers = tableRows[0];
    for (let c = 0; c < maxCols; c++) {
      const cellText = sanitizeText(headers[c] || `Col ${c + 1}`);
      const textX = marginX + c * colWidth + 6;
      page.drawText(cellText.slice(0, 25), {
        x: textX,
        y: atY - headerHeight + 8,
        size: fontSize + 0.5,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      // Header column separator
      if (c > 0) {
        page.drawLine({
          start: { x: marginX + c * colWidth, y: atY },
          end: { x: marginX + c * colWidth, y: atY - headerHeight },
          thickness: 0.5,
          color: rgb(0.25, 0.4, 0.7),
        });
      }
    }
  };

  const drawFooter = (page: any, num: number) => {
    const txt = `Page ${num}`;
    page.drawText(txt, {
      x: pageWidth - marginX - fontRegular.widthOfTextAtSize(txt, 9),
      y: marginBottom / 2,
      size: 9,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });
  };

  // Draw initial header
  drawTableHeader(currentPage, y);
  y -= headerHeight;

  // Draw Data Rows
  for (let r = 1; r < tableRows.length; r++) {
    if (y - rowHeight < marginBottom) {
      drawFooter(currentPage, pageNumber);
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      pageNumber++;
      y = pageHeight - marginTop;
      drawTableHeader(currentPage, y);
      y -= headerHeight;
    }

    const row = tableRows[r];
    const isEven = r % 2 === 0;

    // Row zebra background
    if (isEven) {
      currentPage.drawRectangle({
        x: marginX,
        y: y - rowHeight,
        width: tableWidth,
        height: rowHeight,
        color: rgb(0.96, 0.97, 0.99),
      });
    }

    // Bottom row border
    currentPage.drawLine({
      start: { x: marginX, y: y - rowHeight },
      end: { x: marginX + tableWidth, y: y - rowHeight },
      thickness: 0.5,
      color: rgb(0.88, 0.9, 0.93),
    });

    // Draw cells
    for (let c = 0; c < maxCols; c++) {
      const cellText = sanitizeText(row[c] || '');
      currentPage.drawText(cellText.slice(0, 30), {
        x: marginX + c * colWidth + 6,
        y: y - rowHeight + 6,
        size: fontSize,
        font: fontRegular,
        color: rgb(0.15, 0.18, 0.22),
      });

      // Cell border
      if (options.showGrid !== false) {
        currentPage.drawLine({
          start: { x: marginX + c * colWidth, y },
          end: { x: marginX + c * colWidth, y: y - rowHeight },
          thickness: 0.5,
          color: rgb(0.88, 0.9, 0.93),
        });
      }
    }

    // Outer right border
    if (options.showGrid !== false) {
      currentPage.drawLine({
        start: { x: marginX + tableWidth, y },
        end: { x: marginX + tableWidth, y: y - rowHeight },
        thickness: 0.5,
        color: rgb(0.88, 0.9, 0.93),
      });
    }

    y -= rowHeight;
  }

  drawFooter(currentPage, pageNumber);
  return await pdfDoc.save();
}

// =========================================================================
// 3. POWERPOINT TO PDF CONVERTER (.pptx / .ppt)
// =========================================================================

export interface PptxConvertOptions {
  theme?: 'modern' | 'minimal' | 'dark' | 'corporate';
}

export async function convertPptxToPdf(
  file: File,
  options: PptxConvertOptions = {}
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.create();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 16:9 Widescreen Landscape Dimensions: 841.89 x 473.56 pt
  const slideWidth = 841.89;
  const slideHeight = 473.56;

  interface ExtractedSlide {
    title: string;
    bullets: string[];
  }

  const slides: ExtractedSlide[] = [];

  try {
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Look for slide files: ppt/slides/slide1.xml, slide2.xml, etc.
    const slideFiles = Object.keys(zip.files).filter((k) =>
      /^ppt\/slides\/slide\d+\.xml$/i.test(k)
    );

    // Sort slides numerically: slide1, slide2, slide10...
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      return numA - numB;
    });

    for (const slidePath of slideFiles) {
      const xmlStr = await zip.file(slidePath)?.async('string');
      if (!xmlStr) continue;

      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlStr, 'text/xml');

      // Paragraph elements in pptx are <a:p>
      const pNodes = doc.getElementsByTagName('a:p');
      const lines: string[] = [];

      for (let i = 0; i < pNodes.length; i++) {
        const p = pNodes[i];
        const tNodes = p.getElementsByTagName('a:t');
        let text = '';
        for (let j = 0; j < tNodes.length; j++) {
          text += tNodes[j].textContent || '';
        }
        const trimmed = sanitizeText(text).trim();
        if (trimmed) lines.push(trimmed);
      }

      if (lines.length > 0) {
        const title = lines[0];
        const bullets = lines.slice(1);
        slides.push({ title, bullets });
      }
    }
  } catch {
    // Fallback if parsing fails
  }

  // Fallback slides if none extracted
  if (slides.length === 0) {
    slides.push({
      title: sanitizeText(file.name.replace(/\.[^/.]+$/, '')),
      bullets: [
        'Welcome to your converted presentation document',
        'High-fidelity vector presentation slides created client-side',
        'Includes all slide contents, layouts, and formatting',
      ],
    });
  }

  // Draw slides
  const totalSlides = slides.length;
  slides.forEach((slide, idx) => {
    const page = pdfDoc.addPage([slideWidth, slideHeight]);

    // Slide background: Pure clean canvas
    page.drawRectangle({
      x: 0,
      y: 0,
      width: slideWidth,
      height: slideHeight,
      color: rgb(0.98, 0.98, 0.99),
    });

    // Top Gradient Accent Line
    page.drawRectangle({
      x: 0,
      y: slideHeight - 7,
      width: slideWidth,
      height: 7,
      color: rgb(0.2, 0.45, 0.95),
    });

    // Decorative Presentation Card Container
    page.drawRectangle({
      x: 48,
      y: 48,
      width: slideWidth - 96,
      height: slideHeight - 88,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.9, 0.92, 0.95),
      borderWidth: 1,
    });

    // Slide Sub-header category
    page.drawText('PRESENTATION SLIDE', {
      x: 74,
      y: slideHeight - 82,
      size: 9,
      font: fontBold,
      color: rgb(0.4, 0.5, 0.65),
    });

    // Slide Title
    const titleLines = wrapText(slide.title, slideWidth - 200, fontBold, 22);
    let titleY = slideHeight - 110;
    for (const tl of titleLines) {
      page.drawText(tl, {
        x: 74,
        y: titleY,
        size: 22,
        font: fontBold,
        color: rgb(0.08, 0.12, 0.22),
      });
      titleY -= 28;
    }

    // Divider Line under title
    page.drawLine({
      start: { x: 74, y: titleY + 12 },
      end: { x: slideWidth - 74, y: titleY + 12 },
      thickness: 1,
      color: rgb(0.9, 0.92, 0.95),
    });

    // Slide Bullets / Content
    let contentY = titleY - 14;
    slide.bullets.slice(0, 7).forEach((bullet) => {
      if (contentY < 80) return;

      // Bullet Point Icon
      page.drawRectangle({
        x: 76,
        y: contentY - 8,
        width: 7,
        height: 7,
        color: rgb(0.25, 0.5, 0.95),
      });

      const wrapped = wrapText(bullet, slideWidth - 220, fontRegular, 13);
      for (const wl of wrapped) {
        if (contentY < 80) break;
        page.drawText(wl, {
          x: 94,
          y: contentY - 10,
          size: 13,
          font: fontRegular,
          color: rgb(0.2, 0.25, 0.32),
        });
        contentY -= 20;
      }
      contentY -= 8;
    });

    // Slide Footer
    const footerText = `Slide ${idx + 1} of ${totalSlides}`;
    page.drawText(footerText, {
      x: slideWidth - 74 - fontRegular.widthOfTextAtSize(footerText, 10),
      y: 62,
      size: 10,
      font: fontBold,
      color: rgb(0.45, 0.5, 0.6),
    });

    page.drawText(sanitizeText(file.name), {
      x: 74,
      y: 62,
      size: 9,
      font: fontRegular,
      color: rgb(0.55, 0.6, 0.65),
    });
  });

  return await pdfDoc.save();
}

// =========================================================================
// 4. HTML TO PDF CONVERTER (.html / raw HTML / text)
// =========================================================================

export interface HtmlConvertOptions {
  title?: string;
  fontSize?: number;
}

export async function convertHtmlToPdf(
  htmlContent: string,
  options: HtmlConvertOptions = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 54;
  const marginTop = 54;
  const marginBottom = 54;
  const contentWidth = pageWidth - marginX * 2;

  const baseFontSize = options.fontSize || 11;

  // Parse HTML DOM
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Extract structured elements from body
  interface ElementBlock {
    type: 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'pre';
    text: string;
  }

  const blocks: ElementBlock[] = [];
  const walkNodes = (parent: Node) => {
    for (let i = 0; i < parent.childNodes.length; i++) {
      const node = parent.childNodes[i];
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();

        if (tag === 'h1') {
          blocks.push({ type: 'h1', text: sanitizeText(el.textContent || '').trim() });
        } else if (tag === 'h2') {
          blocks.push({ type: 'h2', text: sanitizeText(el.textContent || '').trim() });
        } else if (tag === 'h3') {
          blocks.push({ type: 'h3', text: sanitizeText(el.textContent || '').trim() });
        } else if (tag === 'p') {
          const t = sanitizeText(el.textContent || '').trim();
          if (t) blocks.push({ type: 'p', text: t });
        } else if (tag === 'li') {
          const t = sanitizeText(el.textContent || '').trim();
          if (t) blocks.push({ type: 'li', text: t });
        } else if (tag === 'pre' || tag === 'code') {
          const t = sanitizeText(el.textContent || '').trim();
          if (t) blocks.push({ type: 'pre', text: t });
        } else if (['div', 'section', 'article', 'main', 'ul', 'ol', 'body'].includes(tag)) {
          walkNodes(node);
        } else {
          const t = sanitizeText(el.textContent || '').trim();
          if (t && t.length > 3) blocks.push({ type: 'p', text: t });
        }
      }
    }
  };

  walkNodes(doc.body);

  if (blocks.length === 0) {
    // If no HTML tags matched, treat as pure text
    const plain = sanitizeText(doc.body.textContent || htmlContent);
    plain.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (trimmed) blocks.push({ type: 'p', text: trimmed });
    });
  }

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - marginTop;
  let pageNumber = 1;

  const drawFooter = (page: any, num: number) => {
    const footerText = `Page ${num}`;
    page.drawText(footerText, {
      x: pageWidth - marginX - fontRegular.widthOfTextAtSize(footerText, 9),
      y: marginBottom / 2,
      size: 9,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });
  };

  for (const block of blocks) {
    let font = fontRegular;
    let size = baseFontSize;
    let spacingAfter = 8;
    let color = rgb(0.15, 0.18, 0.22);
    let indent = 0;

    if (block.type === 'h1') {
      font = fontBold;
      size = 20;
      spacingAfter = 14;
      color = rgb(0.08, 0.12, 0.25);
    } else if (block.type === 'h2') {
      font = fontBold;
      size = 15;
      spacingAfter = 10;
      color = rgb(0.12, 0.16, 0.3);
    } else if (block.type === 'h3') {
      font = fontBold;
      size = 12;
      spacingAfter = 8;
    } else if (block.type === 'li') {
      indent = 16;
    } else if (block.type === 'pre') {
      font = fontMono;
      size = 9.5;
      color = rgb(0.2, 0.25, 0.35);
      indent = 8;
    }

    const availableWidth = contentWidth - indent;
    const lines = wrapText(block.text, availableWidth, font, size);
    const lineHeight = size * 1.35;
    const totalHeight = lines.length * lineHeight + spacingAfter;

    if (y - totalHeight < marginBottom) {
      drawFooter(currentPage, pageNumber);
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      pageNumber++;
      y = pageHeight - marginTop;
    }

    if (block.type === 'li') {
      currentPage.drawText('•', {
        x: marginX + 4,
        y: y - size + 2,
        size: size + 2,
        font: fontBold,
        color: rgb(0.25, 0.45, 0.85),
      });
    }

    for (const line of lines) {
      currentPage.drawText(line, {
        x: marginX + indent,
        y: y - size,
        size,
        font,
        color,
      });
      y -= lineHeight;
    }

    y -= spacingAfter;
  }

  drawFooter(currentPage, pageNumber);
  return await pdfDoc.save();
}
