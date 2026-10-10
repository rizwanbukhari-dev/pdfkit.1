import * as pdfjsLib from 'pdfjs-dist';

// Point worker to local public/pdf.worker.min.js for fast, offline, privacy-preserving client-side rendering
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

export async function loadPdfJsDocument(data: ArrayBuffer): Promise<pdfjsLib.PDFDocumentProxy> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(data),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
  });
  return await loadingTask.promise;
}

export async function renderPageToCanvas(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number = 1.5
): Promise<HTMLCanvasElement> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas 2d context');

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  return canvas;
}

export async function getPageThumbnail(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  targetWidth: number = 240
): Promise<string> {
  const page = await pdfDoc.getPage(pageNumber);
  const unscaledViewport = page.getViewport({ scale: 1.0 });
  const scale = targetWidth / unscaledViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas 2d context');

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  return canvas.toDataURL('image/jpeg', 0.85);
}

export async function extractAllTextFromPdf(pdfDoc: pdfjsLib.PDFDocumentProxy): Promise<string> {
  const totalPages = pdfDoc.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const strings = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .filter((s: string) => s.trim().length > 0);

    pageTexts.push(`--- PAGE ${i} ---\n\n` + strings.join(' '));
  }

  return pageTexts.join('\n\n');
}

export async function extractMarkdownFromPdf(pdfDoc: pdfjsLib.PDFDocumentProxy): Promise<string> {
  const totalPages = pdfDoc.numPages;
  const mdSections: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    let pageMd = `## Page ${i}\n\n`;
    let currentParagraph: string[] = [];

    for (const item of items) {
      const str = item.str?.trim();
      if (!str) continue;

      // Simple heuristic: large text (> 16 font size) is likely a header
      const fontSize = Math.hypot(item.transform[0], item.transform[1]);
      if (fontSize >= 18) {
        if (currentParagraph.length > 0) {
          pageMd += currentParagraph.join(' ') + '\n\n';
          currentParagraph = [];
        }
        pageMd += `### ${str}\n\n`;
      } else {
        currentParagraph.push(str);
      }
    }

    if (currentParagraph.length > 0) {
      pageMd += currentParagraph.join(' ') + '\n\n';
    }

    mdSections.push(pageMd);
  }

  return mdSections.join('\n---\n\n');
}
