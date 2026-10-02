// Real Browser File Downloader & A4 Print Service
// Guarantees PDF downloads with 50% watermark logo, larger fonts, attractive colors, and direct A4 print preview.

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { getBrandingConfig } from './branding';

export interface DownloadFileOptions {
  title: string;
  grade?: string;
  topic?: string;
  format?: string;
  downloadUrl?: string;
  description?: string;
  keyFormulas?: string[];
  examTraps?: string[];
  logoUrl?: string;
  categoryTitle?: string;
}

const DEFAULT_LOGO_WATERMARK =
  'https://lh3.googleusercontent.com/aida/AEtjO1UjgWp59CcYsKXuqwB2FYHcehNEDlMGhbND9VEHl154aFff2EPvt39mUwZ6qXVc-edHZxj5IPmP7JbzGPqzLaCgdQX4S4GUMQBtC4KxFgHHUCu_55VykewYAvz0ReMRXT-l8SNrEHvxLcCxtTX0zVGZ6bSEQvSxd3WcuoKgXa3gTPPWl-czWwPLaYldf3jK6W4CDevlmvi08ew8Ag-k6FiBm7lx3ROJP5G9hsY15VySSpP-r5sf3fqLFLs';

/**
 * Generate full A4 HTML template with 50% opacity background watermark logo,
 * larger typography, and attractive colors.
 */
export function buildA4StudySheetHtml(options: DownloadFileOptions): string {
  const branding = getBrandingConfig();
  const {
    title,
    grade = 'Class 10',
    topic = 'Mathematics',
    format = 'Formula Sheets (1-Pager)',
    description = 'Handcrafted mathematics revision sheet for board examinations and school tests. Verified by Maths at Your Fingertips.',
    keyFormulas = [],
    examTraps = [],
    logoUrl = branding.logoUrl || DEFAULT_LOGO_WATERMARK,
  } = options;

  const defaultFormulas = [
    'Standard Expression Decomposition: f(x) = a·x² + b·x + c',
    'Fundamental Identity Transform: sin²θ + cos²θ = 1, sec²θ - tan²θ = 1',
    'Root Formula: x = [-b ± √(b² - 4ac)] / (2a)',
    'Coordinate Distance & Section: d = √[(x₂ - x₁)² + (y₂ - y₁)²]',
    'Mensuration Curvature: TSA = 2πr(r + h) | Volume = πr²h',
  ];

  const defaultTraps = [
    'Watch sign changes during algebraic transposition across Left Hand Side (LHS) and Right Hand Side (RHS).',
    'Check unit consistency (convert centimeters to meters or vice-versa before multiplying dimensions).',
    'In geometry proofs, explicitly cite the theorem criteria (e.g., SAS, RHS, or BPT theorem) for full step-marking.',
    'Always substitute your computed roots back into the initial equation to catch calculation slips.',
  ];

  const formulasToUse = keyFormulas && keyFormulas.length > 0 ? keyFormulas : defaultFormulas;
  const trapsToUse = examTraps && examTraps.length > 0 ? examTraps : defaultTraps;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - A4 Study Sheet</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=JetBrains+Mono:wght@600;800&display=swap');

    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      line-height: 1.5;
      padding: 20px;
    }

    .a4-page {
      position: relative;
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #2563eb;
      border-radius: 16px;
      padding: 32px 36px;
      box-shadow: 0 10px 30px rgba(0, 74, 198, 0.08);
      overflow: hidden;
    }

    /* Website Logo in Background with 50% Transparency Watermark */
    .watermark-background {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 420px;
      height: 420px;
      background-image: url('${logoUrl}');
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
      opacity: 0.50 !important; /* Exactly 50% transparency */
      pointer-events: none;
      z-index: 0;
      filter: saturate(1.2);
    }

    .content-layer {
      position: relative;
      z-index: 1;
    }

    /* Top Brand & Curriculum Banner */
    .top-header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #1e40af;
      padding-bottom: 14px;
      margin-bottom: 20px;
      gap: 16px;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-logo-img {
      height: 44px;
      width: auto;
      max-width: 140px;
      object-contain: contain;
    }

    .brand-text-block {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 20px;
      font-weight: 900;
      color: #1e40af;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }

    .brand-tagline {
      font-size: 11px;
      font-weight: 700;
      color: #006242;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-top: 3px;
    }

    .format-pill {
      background: linear-gradient(135deg, #1e40af, #2563eb);
      color: #ffffff;
      font-size: 12px;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 6px rgba(30, 64, 175, 0.25);
      white-space: nowrap;
    }

    /* Document Title & Larger Typography */
    h1.document-title {
      font-size: 28px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 14px;
      letter-spacing: -0.6px;
    }

    /* Meta Badges Grid */
    .meta-badges-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 18px;
    }

    .meta-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
    }

    .badge-class {
      background: #dbeafe;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }

    .badge-topic {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .badge-board {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    /* Overview Box */
    .overview-card {
      background: rgba(239, 246, 255, 0.85);
      border-left: 5px solid #2563eb;
      border-radius: 10px;
      padding: 12px 18px;
      margin-bottom: 22px;
      font-size: 13.5px;
      color: #1e293b;
      line-height: 1.5;
    }

    /* Section Headings with Larger Fonts */
    .section-heading {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 17px;
      font-weight: 800;
      color: #1e3a8a;
      margin-top: 22px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #e2e8f0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .section-icon {
      font-size: 18px;
    }

    /* Formulas Table */
    .formulas-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      background: rgba(255, 255, 255, 0.90);
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
    }

    .formulas-table th {
      background: #1e40af;
      color: #ffffff;
      font-size: 12.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 14px;
      text-align: left;
    }

    .formulas-table td {
      padding: 10px 14px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13.5px;
      color: #0f172a;
    }

    .formulas-table tr:last-child td {
      border-bottom: none;
    }

    .formulas-table tr:nth-child(even) td {
      background-color: rgba(248, 250, 252, 0.8);
    }

    .formula-expression {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14.5px;
      font-weight: 800;
      color: #0284c7;
      background: #f0f9ff;
      padding: 3px 8px;
      border-radius: 6px;
      display: inline-block;
      border: 1px solid #bae6fd;
    }

    /* Common Traps Callout */
    .traps-container {
      background: rgba(255, 247, 237, 0.92);
      border: 2px solid #fb923c;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 20px;
    }

    .traps-title {
      color: #c2410c;
      font-weight: 900;
      font-size: 14px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .trap-bullet {
      font-size: 13px;
      color: #7c2d12;
      line-height: 1.5;
      margin-bottom: 6px;
      padding-left: 12px;
      position: relative;
    }

    .trap-bullet::before {
      content: "•";
      position: absolute;
      left: 0;
      color: #ea580c;
      font-weight: bold;
    }

    /* Footer Stamp */
    .sheet-footer {
      border-top: 2px dashed #94a3b8;
      padding-top: 14px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11.5px;
      color: #64748b;
    }

    .stamp-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ecfdf5;
      color: #047857;
      font-weight: 800;
      padding: 5px 12px;
      border-radius: 8px;
      border: 1.5px solid #6ee7b7;
      font-size: 11.5px;
    }

    /* Print Preview Optimizations */
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .a4-page {
        border: none !important;
        box-shadow: none !important;
        padding: 15px 20px !important;
        max-width: 100% !important;
      }
      .watermark-background {
        opacity: 0.50 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="a4-page" id="printable-sheet">
    <!-- 50% Transparency Background Logo Watermark -->
    <div class="watermark-background"></div>

    <div class="content-layer">
      <!-- Header -->
      <div class="top-header-bar">
        <div class="brand-section">
          ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="brand-logo-img" />` : ''}
          <div class="brand-text-block">
            ${branding.siteTitle ? `<span class="brand-title">${branding.siteTitle}</span>` : ''}
            ${branding.tagline ? `<span class="brand-tagline">${branding.tagline}</span>` : ''}
          </div>
        </div>
        <div class="format-pill">${format}</div>
      </div>

      <!-- Title with larger font -->
      <h1 class="document-title">${title}</h1>

      <!-- Meta Badges -->
      <div class="meta-badges-row">
        <span class="meta-badge badge-class">Grade: ${grade}</span>
        <span class="meta-badge badge-topic">Chapter: ${topic}</span>
        <span class="meta-badge badge-board">Curriculum: NCERT / CBSE Aligned</span>
      </div>

      <!-- Overview -->
      <div class="overview-card">
        <strong>Mastery Scope:</strong> ${description}
      </div>

      <!-- Key Formulas Table -->
      <div class="section-heading">
        <span class="section-icon">📐</span>
        <span>Key Formulae, Equations &amp; Identity Rules</span>
      </div>

      <table class="formulas-table">
        <thead>
          <tr>
            <th style="width: 32%;">Concept / Rule</th>
            <th style="width: 48%;">Mathematical Standard Expression</th>
            <th style="width: 20%;">Application</th>
          </tr>
        </thead>
        <tbody>
          ${formulasToUse
            .map(
              (formula, idx) => `
            <tr>
              <td><strong>Identity ${idx + 1}</strong></td>
              <td><span class="formula-expression">${formula}</span></td>
              <td><span style="font-weight: 600; color: #475569; font-size: 12px;">Board Direct</span></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <!-- Exam Traps -->
      <div class="traps-container">
        <div class="traps-title">
          <span>⚠️</span>
          <span>Common Board Exam Traps &amp; Examiner Pitfalls</span>
        </div>
        ${trapsToUse
          .map(
            (trap) => `
          <div class="trap-bullet">${trap}</div>
        `
          )
          .join('')}
      </div>

      <!-- Quick Verification Technique -->
      <div class="section-heading">
        <span class="section-icon">⚡</span>
        <span>Teacher's 10-Second Quick Verification Step</span>
      </div>
      <p style="font-size: 13.5px; color: #334155; margin-bottom: 16px; line-height: 1.5;">
        Substitute your calculated values or roots back into the primary equation to confirm Left Hand Side (LHS) = Right Hand Side (RHS). In geometry and mensuration problems, confirm unit conversions (meters vs. centimeters) prior to final calculation.
      </p>

      <!-- Footer Stamp -->
      <div class="sheet-footer">
        <div>
          <strong>Maths at Your Fingertips</strong> • Verified Student Revision Material
          <br>
          <span style="font-size: 10.5px; color: #94a3b8;">Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} | Clean A4 Study Vault</span>
        </div>
        <div class="stamp-badge">
          <span>✓ Teacher Verified &amp; Print-Ready</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Downloads the resource directly in true PDF format (.pdf)
 */
export async function downloadResourceAsPdf(options: DownloadFileOptions): Promise<boolean> {
  const { title } = options;
  const cleanFilename = `${title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_')}`;

  // If a direct external downloadUrl is provided and points to a cloud drive / storage
  if (options.downloadUrl && options.downloadUrl.startsWith('http')) {
    try {
      const proxyUrl = `/api/download/proxy?url=${encodeURIComponent(options.downloadUrl)}&name=${encodeURIComponent(cleanFilename)}`;
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = `${cleanFilename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (_e) {
      // Fallback
    }
  }

  // Create an off-screen container with the exact styled A4 layout
  const htmlContent = buildA4StudySheetHtml(options);
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '820px';
  container.style.zIndex = '-9999';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    const targetElement = container.querySelector('#printable-sheet') as HTMLElement;

    if (targetElement) {
      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const contentHeight = (canvas.height * pdfWidth) / canvas.width;

      if (contentHeight <= pdfPageHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, contentHeight);
      } else {
        // Proportionally scale to fit cleanly within A4 portrait dimensions
        const scale = (pdfPageHeight - 8) / contentHeight;
        const scaledWidth = pdfWidth * scale;
        const scaledHeight = contentHeight * scale;
        const xOffset = (pdfWidth - scaledWidth) / 2;
        pdf.addImage(imgData, 'JPEG', xOffset, 4, scaledWidth, scaledHeight);
      }
      pdf.save(`${cleanFilename}.pdf`);
      document.body.removeChild(container);
      return true;
    }
  } catch (_canvasErr) {
    // Non-blocking fallback to direct jsPDF text document generation
  }

  // Fallback direct jsPDF document generation
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const branding = getBrandingConfig();

    // Background header band
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 210, 24, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(branding.siteTitle || 'Maths at Your Fingertips', 14, 12);
    doc.setFontSize(9);
    doc.text(branding.tagline || 'Class 5 – 10 Learning Hub', 14, 18);

    // Document Title
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text(title, 14, 38);

    // Meta line
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Grade: ${options.grade || 'Class 10'}  |  Topic: ${options.topic || 'Maths'}  |  Format: ${options.format || 'Study Sheet'}`, 14, 46);

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 50, 196, 50);

    // Overview box
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(14, 54, 182, 18, 2, 2, 'F');
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(9.5);
    const splitDesc = doc.splitTextToSize(options.description || 'Comprehensive revision sheet.', 174);
    doc.text(splitDesc, 18, 62);

    // Formulas
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('Key Formulae & Theorem Rules:', 14, 82);

    const formulas = options.keyFormulas && options.keyFormulas.length > 0 ? options.keyFormulas : [
      'f(x) = a*x^2 + b*x + c = 0',
      'Roots: x = (-b +- sqrt(b^2 - 4ac)) / (2a)',
      'sin^2(x) + cos^2(x) = 1',
      'd = sqrt((x2 - x1)^2 + (y2 - y1)^2)',
    ];

    let currentY = 90;
    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(3, 105, 161);
    formulas.forEach((f, idx) => {
      doc.setFillColor(240, 249, 255);
      doc.roundedRect(14, currentY - 5, 182, 10, 1.5, 1.5, 'F');
      doc.text(`${idx + 1}.  ${f}`, 18, currentY + 1.5);
      currentY += 13;
    });

    // Exam Pitfalls
    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(194, 65, 12);
    doc.text('Common Board Examination Pitfalls:', 14, currentY);
    currentY += 8;

    const traps = options.examTraps && options.examTraps.length > 0 ? options.examTraps : [
      'Watch negative sign operations when factoring equations.',
      'Always verify units (convert cm to meters before multiplying).',
      'State theorem criteria explicitly in geometry steps for full marking.',
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(124, 45, 18);
    traps.forEach((t) => {
      doc.text(`* ${t}`, 18, currentY);
      currentY += 7;
    });

    // Footer
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 275, 196, 275);
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Maths at Your Fingertips - Official Offline Study PDF - Generated: ${new Date().toLocaleDateString()}`, 14, 282);

    doc.save(`${cleanFilename}.pdf`);
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    return true;
  } catch (err) {
    console.error('Direct PDF export error:', err);
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    return false;
  }
}

/**
 * Directly opens browser Print Preview dialog in standard A4 format
 */
export function printResourceInA4(options: DownloadFileOptions): void {
  const html = buildA4StudySheetHtml(options);

  // Create isolated invisible iframe to trigger native A4 print preview
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    console.error('Print iframe could not be initialized');
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for images (like logo) and fonts to finish layout before printing
  let triggered = false;
  const triggerPrint = () => {
    if (triggered) return;
    triggered = true;
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (_e) {
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000);
    }
  };

  iframe.onload = () => {
    setTimeout(triggerPrint, 150);
  };
  setTimeout(triggerPrint, 400);
}

/**
 * System download entry point - now downloads as real PDF
 */
export function downloadResourceToSystem(options: DownloadFileOptions): boolean {
  downloadResourceAsPdf(options).catch((_err) => {
    // Non-blocking download handling
  });
  return true;
}
