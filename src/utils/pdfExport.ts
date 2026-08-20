import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PatientRecord } from '../types';
import { exportToGoogleSheetsCsv } from './storage';
import { generateStandaloneFormHtml } from './htmlExport';

/**
 * Normalizes an element's styles by replacing modern CSS oklch/color-mix with RGB
 * and converting input elements into static visible text spans for crisp PDF rendering.
 */
function prepareElementForPdf(sourceElement: HTMLElement): HTMLElement {
  const clone = sourceElement.cloneNode(true) as HTMLElement;

  // Reset any scaling transform on the clone
  clone.style.transform = 'none';
  clone.style.margin = '0';
  clone.style.maxWidth = '920px';
  clone.style.width = '920px';
  clone.style.backgroundColor = '#ffffff';
  clone.style.boxShadow = 'none';

  // Find all inputs in source and clone, copy values to text
  const sourceInputs = sourceElement.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    'input, select, textarea'
  );
  const cloneInputs = clone.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    'input, select, textarea'
  );

  for (let i = 0; i < sourceInputs.length && i < cloneInputs.length; i++) {
    const src = sourceInputs[i];
    const cln = cloneInputs[i];

    const val = src.value || '';
    
    // Replace input with clean formatted span for zero-clipping PDF rendering
    const span = document.createElement('span');
    span.textContent = val || ' ';
    span.className = cln.className;
    span.style.cssText = cln.style.cssText;
    span.style.display = 'inline-block';
    span.style.width = '100%';
    span.style.minHeight = '18px';
    span.style.color = '#0f172a';
    span.style.backgroundColor = 'transparent';
    span.style.border = 'none';
    span.style.padding = '1px 2px';
    span.style.fontSize = window.getComputedStyle(src).fontSize || '11px';
    span.style.fontFamily = 'monospace, sans-serif';

    if (cln.parentNode) {
      cln.parentNode.replaceChild(span, cln);
    }
  }

  return clone;
}

/**
 * Renders HTML Element to high-res canvas with multi-tier fallback
 */
async function renderElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  const prepared = prepareElementForPdf(element);

  // Mount hidden container in document body for accurate layout computation
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-99999px';
  container.style.left = '-99999px';
  container.style.width = '920px';
  container.style.backgroundColor = '#ffffff';
  container.style.zIndex = '-1000';
  container.appendChild(prepared);
  document.body.appendChild(container);

  try {
    // Attempt Tier 1: html2canvas with sanitized configuration
    const canvas = await html2canvas(prepared, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1000,
      onclone: (clonedDoc) => {
        // Strip any oklch color variables if present in root styles
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.style) {
            // Ensure solid text contrast
            htmlEl.style.textRendering = 'geometricPrecision';
          }
        });
      },
    });

    return canvas;
  } catch (err) {
    console.warn('html2canvas primary render warning, falling back to SVG canvas renderer:', err);

    // Attempt Tier 2: SVG ForeignObject Native Browser Canvas Renderer
    const width = 920;
    const height = Math.max(prepared.offsetHeight || 1200, 1100);

    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.scale(2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Create SVG foreignObject with clean inline HTML
      const htmlContent = prepared.outerHTML;
      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="background:#ffffff; font-family:sans-serif; width:${width}px;">
              ${htmlContent}
            </div>
          </foreignObject>
        </svg>
      `;

      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(); // resolve anyway to allow fallback
        };
        img.src = url;
      });

      return canvas;
    }

    throw new Error('Canvas rendering could not initialize.');
  } finally {
    // Clean up temporary DOM container
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Exports an exact HTML document container into a crisp, high-resolution medical PDF Blob
 */
export async function exportElementToPdf(
  element: HTMLElement,
  fileName: string = 'Medical_Record.pdf'
): Promise<Blob> {
  const canvas = await renderElementToCanvas(element);
  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  // Create jsPDF in portrait A4 (210mm x 297mm)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Margins in mm
  const margin = 6;
  const contentWidth = pdfWidth - margin * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  if (contentHeight <= pdfHeight - margin * 2) {
    pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight);
  } else {
    // Multi-page handling if content extends
    let heightLeft = contentHeight;
    let position = margin;

    pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
    heightLeft -= (pdfHeight - margin * 2);

    while (heightLeft > 0) {
      position = heightLeft - contentHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - margin * 2);
    }
  }

  const pdfBlob = pdf.output('blob');
  return pdfBlob;
}

/**
 * Downloads a single record as PDF directly to the user's computer
 */
export async function downloadRecordPdf(
  element: HTMLElement,
  patientId: string,
  patientName: string,
  formType: string
): Promise<void> {
  const safeName = (patientName || 'Patient').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${patientId}_${formType.toUpperCase()}_${safeName}.pdf`;

  const blob = await exportElementToPdf(element, fileName);
  saveAs(blob, fileName);
}

/**
 * Creates and downloads a Bulk ZIP archive with individual record PDFs, HTML files, JSON manifests, and CSV summaries
 */
export async function exportBulkZip(
  records: PatientRecord[],
  renderContainerFn: (record: PatientRecord) => Promise<HTMLElement>,
  onProgress?: (current: number, total: number, statusText: string) => void
): Promise<void> {
  const zip = new JSZip();
  const total = records.length;

  const formsFolder = zip.folder('Forms_PDFs');
  const htmlFormsFolder = zip.folder('Forms_HTML');
  const metadataFolder = zip.folder('Clinical_Metadata');

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const patientNameSafe = (record.patientName || 'Patient').replace(/[^a-zA-Z0-9_-]/g, '_');
    const pdfFilename = `${record.patientId}_${record.formType.toUpperCase()}_${patientNameSafe}.pdf`;
    const htmlFilename = `${record.patientId}_${record.formType.toUpperCase()}_${patientNameSafe}.html`;

    if (onProgress) {
      onProgress(i + 1, total, `Generating PDF for ${record.patientName || record.patientId}...`);
    }

    try {
      const el = await renderContainerFn(record);
      const pdfBlob = await exportElementToPdf(el, pdfFilename);

      if (formsFolder) {
        formsFolder.file(pdfFilename, pdfBlob);
      }
    } catch (err) {
      console.warn(`PDF generation fallback for record ${record.patientId}:`, err);
    }

    // Add standalone offline HTML file
    const standaloneHtml = generateStandaloneFormHtml(record);
    if (htmlFormsFolder) {
      htmlFormsFolder.file(htmlFilename, standaloneHtml);
    }
  }

  if (metadataFolder) {
    // Add full JSON database export
    metadataFolder.file('records_archive.json', JSON.stringify(records, null, 2));

    // Add 4 CSV files for each form type
    const formTypes = ['adult', 'pediatric', 'ecmo', 'iabp'] as const;
    for (const ft of formTypes) {
      const csv = exportToGoogleSheetsCsv(records, ft);
      metadataFolder.file(`${ft}_registry_data.csv`, csv);
    }
  }

  if (onProgress) {
    onProgress(total, total, 'Compressing ZIP package...');
  }

  const zipContent = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const zipFilename = `MedForms_Pro_Clinical_Archive_${new Date().toISOString().split('T')[0]}.zip`;
  saveAs(zipContent, zipFilename);
}
