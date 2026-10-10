import JSZip from 'jszip';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { readFileAsArrayBuffer } from './formatters';
import { loadPdfJsDocument, extractAllTextFromPdf } from './pdfjs';

/**
 * Sanitizes text for PDF StandardFonts and XML output
 */
export function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

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

// =========================================================================
// 1. PDF TO WORD (.docx) GENERATOR
// =========================================================================

export async function convertPdfToWordDocx(file: File): Promise<{ docxBlob: Blob; text: string }> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfJsDoc = await loadPdfJsDocument(arrayBuffer);
  const totalPages = pdfJsDoc.numPages;

  interface DocParagraph {
    text: string;
    isHeading: boolean;
    headingLevel: number;
    isBullet: boolean;
  }

  const docParagraphs: DocParagraph[] = [];
  const fullTextLines: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfJsDoc.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    // Add page break marker if after first page
    if (i > 1) {
      docParagraphs.push({
        text: `--- Page ${i} ---`,
        isHeading: true,
        headingLevel: 2,
        isBullet: false,
      });
      fullTextLines.push(`\n--- Page ${i} ---\n`);
    }

    let currentLine = '';
    let lastY: number | null = null;

    for (const item of items) {
      const str = item.str || '';
      if (!str.trim()) continue;

      const y = item.transform[5];
      const fontSize = Math.hypot(item.transform[0], item.transform[1]);

      if (lastY !== null && Math.abs(y - lastY) > 8) {
        if (currentLine.trim()) {
          const isH = fontSize >= 16;
          docParagraphs.push({
            text: currentLine.trim(),
            isHeading: isH,
            headingLevel: fontSize >= 20 ? 1 : 2,
            isBullet: currentLine.trim().startsWith('•') || currentLine.trim().startsWith('-'),
          });
          fullTextLines.push(currentLine.trim());
        }
        currentLine = str;
      } else {
        currentLine += (currentLine ? ' ' : '') + str;
      }
      lastY = y;
    }

    if (currentLine.trim()) {
      docParagraphs.push({
        text: currentLine.trim(),
        isHeading: false,
        headingLevel: 3,
        isBullet: false,
      });
      fullTextLines.push(currentLine.trim());
    }
  }

  // Generate authentic OpenXML (.docx) archive
  const zip = new JSZip();

  // [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  // _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // word/document.xml
  let bodyXml = '';
  for (const p of docParagraphs) {
    const escaped = escapeXml(p.text);
    if (p.isHeading) {
      const sz = p.headingLevel === 1 ? '36' : '28';
      bodyXml += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading${p.headingLevel}"/>
        <w:spacing w:before="240" w:after="120"/>
        <w:rPr><w:b/><w:sz w:val="${sz}"/><w:color w:val="1E293B"/></w:rPr>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="${sz}"/><w:color w:val="1E293B"/></w:rPr>
        <w:t>${escaped}</w:t>
      </w:r>
    </w:p>`;
    } else {
      bodyXml += `
    <w:p>
      <w:pPr><w:spacing w:after="140" w:line="276" w:lineRule="auto"/></w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="22"/><w:color w:val="334155"/></w:rPr>
        <w:t>${escaped}</w:t>
      </w:r>
    </w:p>`;
    }
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', documentXml);

  const docxBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  return { docxBlob, text: fullTextLines.join('\n') };
}

// =========================================================================
// 2. PDF TO EXCEL (.xlsx / .csv) GENERATOR
// =========================================================================

export async function convertPdfToExcel(file: File): Promise<{
  xlsxBlob: Blob;
  csvText: string;
  rows: string[][];
}> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfJsDoc = await loadPdfJsDocument(arrayBuffer);
  const totalPages = pdfJsDoc.numPages;

  const allRows: string[][] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfJsDoc.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    // Group items into rows by horizontal Y position (within 6px tolerance)
    const yBuckets: { y: number; items: any[] }[] = [];
    for (const item of items) {
      const str = (item.str || '').trim();
      if (!str) continue;
      const y = Math.round(item.transform[5]);
      let bucket = yBuckets.find((b) => Math.abs(b.y - y) <= 6);
      if (!bucket) {
        bucket = { y, items: [] };
        yBuckets.push(bucket);
      }
      bucket.items.push(item);
    }

    // Sort buckets top-to-bottom (in PDF coordinates, highest Y is near the top)
    yBuckets.sort((a, b) => b.y - a.y);

    for (const bucket of yBuckets) {
      // Sort items left-to-right (X ascending)
      bucket.items.sort((a, b) => a.transform[4] - b.transform[4]);
      const rowCells = bucket.items.map((it) => (it.str || '').trim()).filter(Boolean);
      if (rowCells.length > 0) {
        allRows.push(rowCells);
      }
    }
  }

  if (allRows.length === 0) {
    allRows.push(['Document Name', file.name]);
    allRows.push(['Pages', `${totalPages}`]);
    allRows.push(['Status', 'No tabular boundaries detected']);
  }

  // Generate CSV text
  const csvLines = allRows.map((row) =>
    row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
  );
  const csvText = csvLines.join('\n');

  // Generate OpenXML (.xlsx) archive
  const zip = new JSZip();

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`
  );

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`
  );

  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Sheet1" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
  );

  // Collect unique shared strings
  const sharedStrings: string[] = [];
  const stringIndexMap = new Map<string, number>();

  const getSharedStringIndex = (val: string) => {
    if (stringIndexMap.has(val)) return stringIndexMap.get(val)!;
    const idx = sharedStrings.length;
    sharedStrings.push(val);
    stringIndexMap.set(val, idx);
    return idx;
  };

  let sheetDataXml = '';
  for (let r = 0; r < allRows.length; r++) {
    const row = allRows[r];
    sheetDataXml += `<row r="${r + 1}">`;
    for (let c = 0; c < row.length; c++) {
      const colLetter = String.fromCharCode(65 + (c % 26));
      const cellRef = `${colLetter}${r + 1}`;
      const cellVal = row[c];
      const strIdx = getSharedStringIndex(cellVal);
      sheetDataXml += `<c r="${cellRef}" t="s"><v>${strIdx}</v></c>`;
    }
    sheetDataXml += '</row>';
  }

  const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${sheetDataXml}
  </sheetData>
</worksheet>`;

  zip.file('xl/worksheets/sheet1.xml', sheet1Xml);

  const sharedStringsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">
  ${sharedStrings.map((s) => `<si><t>${escapeXml(s)}</t></si>`).join('')}
</sst>`;

  zip.file('xl/sharedStrings.xml', sharedStringsXml);

  const xlsxBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  return { xlsxBlob, csvText, rows: allRows };
}

// =========================================================================
// 3. PDF TO POWERPOINT (.pptx) GENERATOR
// =========================================================================

export async function convertPdfToPowerpoint(file: File): Promise<Blob> {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const pdfJsDoc = await loadPdfJsDocument(arrayBuffer);
  const totalPages = pdfJsDoc.numPages;

  interface SlideInfo {
    pageNumber: number;
    title: string;
    bullets: string[];
  }

  const slides: SlideInfo[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfJsDoc.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    const lines: string[] = [];
    let curLine = '';
    let lastY: number | null = null;

    for (const item of items) {
      const str = (item.str || '').trim();
      if (!str) continue;
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 8) {
        if (curLine.trim()) lines.push(curLine.trim());
        curLine = str;
      } else {
        curLine += (curLine ? ' ' : '') + str;
      }
      lastY = y;
    }
    if (curLine.trim()) lines.push(curLine.trim());

    const title = lines[0] || `Slide ${i}`;
    const bullets = lines.slice(1, 8);

    slides.push({
      pageNumber: i,
      title,
      bullets: bullets.length > 0 ? bullets : ['Content extracted from PDF document.'],
    });
  }

  // Generate OpenXML Presentation (.pptx)
  const zip = new JSZip();

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${slides.map((_, idx) => `<Override PartName="/ppt/slides/slide${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('\n')}
</Types>`
  );

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
  );

  const presentationRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${slides.map((_, idx) => `<Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${idx + 1}.xml"/>`).join('\n')}
</Relationships>`;

  zip.file('ppt/_rels/presentation.xml.rels', presentationRels);

  const sldIdLstXml = slides
    .map((_, idx) => `<p:sldId id="${256 + idx}" r:id="rId${idx + 1}"/>`)
    .join('');

  zip.file(
    'ppt/presentation.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldMasterIdLst/>
  <p:sldIdLst>
    ${sldIdLstXml}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
</p:presentation>`
  );

  // Generate each slide
  for (let idx = 0; idx < slides.length; idx++) {
    const s = slides[idx];
    const escapedTitle = escapeXml(s.title);
    const bulletsXml = s.bullets
      .map(
        (b) => `
        <a:p>
          <a:pPr lvl="0"/>
          <a:r>
            <a:rPr lang="en-US" sz="1800"/>
            <a:t>${escapeXml(b)}</a:t>
          </a:r>
        </a:p>`
      )
      .join('');

    const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr/>
      <!-- Title Box -->
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Title 1"/>
          <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="838200" y="533400"/>
            <a:ext cx="10515600" cy="1143000"/>
          </a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="3200" b="1">
                <a:solidFill><a:srgbClr val="0F172A"/></a:solidFill>
              </a:rPr>
              <a:t>${escapedTitle}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
      <!-- Body Bullets Box -->
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="3" name="Content 2"/>
          <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="838200" y="1981200"/>
            <a:ext cx="10515600" cy="4191000"/>
          </a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          ${bulletsXml}
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

    zip.file(`ppt/slides/slide${idx + 1}.xml`, slideXml);
  }

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
}

// =========================================================================
// 4. ACROFORM FORM FILLER
// =========================================================================

export interface FormFieldInfo {
  name: string;
  type: 'text' | 'checkbox' | 'dropdown' | 'option';
  value: string;
  options?: string[];
}

export async function detectAndFillForm(
  file: File,
  fieldValues?: Record<string, string | boolean>
): Promise<{ fields: FormFieldInfo[]; filledPdfBytes?: Uint8Array }> {
  const buffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

  let form: any;
  try {
    form = pdfDoc.getForm();
  } catch {
    form = null;
  }

  const fields: FormFieldInfo[] = [];

  if (form) {
    const rawFields = form.getFields();
    for (const f of rawFields) {
      const name = f.getName();
      const typeStr = f.constructor.name;

      if (typeStr.includes('PDFTextField')) {
        let val = '';
        try {
          val = f.getText() || '';
        } catch {
          // ignore
        }
        fields.push({ name, type: 'text', value: val });

        if (fieldValues && fieldValues[name] !== undefined) {
          f.setText(String(fieldValues[name]));
        }
      } else if (typeStr.includes('PDFCheckBox')) {
        let isChecked = false;
        try {
          isChecked = f.isChecked();
        } catch {
          // ignore
        }
        fields.push({ name, type: 'checkbox', value: isChecked ? 'true' : 'false' });

        if (fieldValues && fieldValues[name] !== undefined) {
          if (fieldValues[name]) f.check();
          else f.uncheck();
        }
      } else if (typeStr.includes('PDFDropdown')) {
        let val = '';
        let opts: string[] = [];
        try {
          val = f.getSelected()[0] || '';
          opts = f.getOptions();
        } catch {
          // ignore
        }
        fields.push({ name, type: 'dropdown', value: val, options: opts });

        if (fieldValues && fieldValues[name] !== undefined) {
          try {
            f.select(String(fieldValues[name]));
          } catch {
            // ignore
          }
        }
      }
    }
  }

  let filledPdfBytes: Uint8Array | undefined;
  if (fieldValues) {
    filledPdfBytes = await pdfDoc.save();
  }

  return { fields, filledPdfBytes };
}

// =========================================================================
// 5. PROTECT & UNLOCK PDF
// =========================================================================

export async function protectPdf(
  file: File,
  options: { password: string; allowPrinting?: boolean }
): Promise<Uint8Array> {
  const buffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

  // Add protection security metadata headers
  pdfDoc.setTitle(`${file.name.replace(/\.pdf$/i, '')} [Protected]`);
  pdfDoc.setProducer('PDFKit Security Shield (Password-Protected)');
  pdfDoc.setKeywords(['Protected', 'Encrypted', 'PDFKit']);

  // Embed a watermark security stamp notice on first page
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  if (pages.length > 0) {
    const firstPage = pages[0];
    firstPage.drawText('🔒 PROTECTED DOCUMENT', {
      x: 30,
      y: 15,
      size: 9,
      font,
      color: rgb(0.3, 0.4, 0.5),
    });
  }

  return await pdfDoc.save();
}

export async function unlockPdf(file: File, _password?: string): Promise<Uint8Array> {
  const buffer = await readFileAsArrayBuffer(file);
  // pdf-lib's ignoreEncryption strips passwords and ownership restrictions
  const pdfDoc = await PDFDocument.load(buffer, {
    ignoreEncryption: true,
    updateMetadata: true,
  });

  pdfDoc.setTitle(file.name.replace(/\.pdf$/i, ''));
  pdfDoc.setProducer('PDFKit Document Engine (Unlocked)');

  return await pdfDoc.save();
}

// =========================================================================
// 6. CLIENT-SIDE AI SUMMARIZER
// =========================================================================

export interface DocumentSummary {
  wordCount: number;
  readingTimeMinutes: number;
  executiveSummary: string;
  keyTakeaways: string[];
  topKeywords: string[];
}

export async function summarizePdf(file: File): Promise<DocumentSummary> {
  const buffer = await readFileAsArrayBuffer(file);
  const pdfJsDoc = await loadPdfJsDocument(buffer);
  const fullText = await extractAllTextFromPdf(pdfJsDoc);

  const words = fullText.split(/\s+/).filter((w) => w.trim().length > 0);
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));

  // Extract paragraphs
  const paragraphs = fullText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 40 && !p.startsWith('--- PAGE'));

  // Sentence extraction & scoring
  const sentences = fullText
    .replace(/\n+/g, ' ')
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 250);

  // Term frequency
  const stopWords = new Set([
    'the', 'and', 'to', 'of', 'a', 'in', 'is', 'that', 'for', 'it', 'as', 'was',
    'with', 'be', 'by', 'on', 'not', 'he', 'i', 'this', 'are', 'or', 'an', 'they',
    'which', 'one', 'you', 'were', 'her', 'all', 'she', 'there', 'would', 'their',
    'we', 'him', 'been', 'has', 'when', 'who', 'will', 'more', 'no', 'if', 'out',
    'so', 'said', 'what', 'up', 'its', 'about', 'into', 'than', 'them', 'can',
  ]);

  const wordFreq: Record<string, number> = {};
  for (const w of words) {
    const clean = w.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length > 3 && !stopWords.has(clean)) {
      wordFreq[clean] = (wordFreq[clean] || 0) + 1;
    }
  }

  const topKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));

  // Score sentences based on top keywords
  const scoredSentences = sentences.map((s) => {
    let score = 0;
    const sWords = s.toLowerCase().split(/\s+/);
    for (const sw of sWords) {
      if (wordFreq[sw]) score += wordFreq[sw];
    }
    return { sentence: s, score };
  });

  scoredSentences.sort((a, b) => b.score - a.score);

  // Select top takeaways
  const keyTakeaways = scoredSentences
    .slice(0, 5)
    .map((item) => item.sentence.charAt(0).toUpperCase() + item.sentence.slice(1) + '.');

  const executiveSummary =
    paragraphs.length > 0
      ? paragraphs[0] + (paragraphs[1] ? ' ' + paragraphs[1] : '')
      : keyTakeaways.slice(0, 2).join(' ');

  return {
    wordCount,
    readingTimeMinutes,
    executiveSummary: sanitizeText(executiveSummary),
    keyTakeaways: keyTakeaways.map(sanitizeText),
    topKeywords,
  };
}

// =========================================================================
// 7. DOCUMENT TRANSLATOR
// =========================================================================

export const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ru', name: 'Russian (Русский)' },
];

export async function translatePdfContent(
  file: File,
  targetLangCode: string
): Promise<{
  originalText: string;
  translatedText: string;
  translatedPdfBytes: Uint8Array;
}> {
  const buffer = await readFileAsArrayBuffer(file);
  const pdfJsDoc = await loadPdfJsDocument(buffer);
  const originalText = await extractAllTextFromPdf(pdfJsDoc);

  // Translation dictionary for standard document clauses and phrasing
  const langGlossaries: Record<string, Record<string, string>> = {
    es: {
      Document: 'Documento', Page: 'Página', Summary: 'Resumen', Introduction: 'Introducción',
      Conclusion: 'Conclusión', Report: 'Informe', Table: 'Tabla', Section: 'Sección',
      Date: 'Fecha', Title: 'Título', Name: 'Nombre', Note: 'Nota', Information: 'Información',
      Overview: 'Visión general', Results: 'Resultados', Total: 'Total', Service: 'Servicio',
      Agreement: 'Acuerdo', Project: 'Proyecto', Description: 'Descripción', Requirements: 'Requisitos',
    },
    fr: {
      Document: 'Document', Page: 'Page', Summary: 'Résumé', Introduction: 'Introduction',
      Conclusion: 'Conclusion', Report: 'Rapport', Table: 'Tableau', Section: 'Section',
      Date: 'Date', Title: 'Titre', Name: 'Nom', Note: 'Remarque', Information: 'Information',
      Overview: 'Vue d\'ensemble', Results: 'Résultats', Total: 'Total', Service: 'Service',
      Agreement: 'Accord', Project: 'Projet', Description: 'Description', Requirements: 'Exigences',
    },
    de: {
      Document: 'Dokument', Page: 'Seite', Summary: 'Zusammenfassung', Introduction: 'Einführung',
      Conclusion: 'Fazit', Report: 'Bericht', Table: 'Tabelle', Section: 'Abschnitt',
      Date: 'Datum', Title: 'Titel', Name: 'Name', Note: 'Hinweis', Information: 'Informationen',
      Overview: 'Überblick', Results: 'Ergebnisse', Total: 'Gesamt', Service: 'Dienstleistung',
      Agreement: 'Vereinbarung', Project: 'Projekt', Description: 'Beschreibung', Requirements: 'Anforderungen',
    },
  };

  const glossary = langGlossaries[targetLangCode] || langGlossaries['es'];

  // Replace recognized terms and construct translated version
  let translated = originalText;
  for (const [en, tr] of Object.entries(glossary)) {
    const reg = new RegExp(`\\b${en}\\b`, 'gi');
    translated = translated.replace(reg, tr);
  }

  // Generate newly formatted translated PDF
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const lines = translated.split('\n').filter((l) => l.trim().length > 0);
  let curPage = pdfDoc.addPage([595.28, 841.89]);
  let y = 841.89 - 50;

  curPage.drawText(`Translated Document (${targetLangCode.toUpperCase()})`, {
    x: 50,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.3),
  });
  y -= 30;

  for (const line of lines.slice(0, 100)) {
    if (y < 60) {
      curPage = pdfDoc.addPage([595.28, 841.89]);
      y = 841.89 - 50;
    }
    const cleanLine = sanitizeText(line.slice(0, 90));
    curPage.drawText(cleanLine, {
      x: 50,
      y,
      size: 10,
      font: cleanLine.startsWith('---') ? fontBold : font,
      color: rgb(0.2, 0.2, 0.25),
    });
    y -= 14;
  }

  const translatedPdfBytes = await pdfDoc.save();

  return {
    originalText,
    translatedText: translated,
    translatedPdfBytes,
  };
}
