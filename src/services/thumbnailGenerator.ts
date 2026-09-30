/**
 * Service to automatically generate rich, high-definition 16:9 thumbnails
 * from uploaded content files (Images, PDFs, and Study Documents).
 */

export interface ThumbnailMeta {
  title?: string;
  grade?: string;
  topic?: string;
  format?: string;
  tier?: 'free' | 'pro';
}

/**
 * Generates an automatic thumbnail Data URL for any uploaded file.
 */
export async function generateContentThumbnail(
  file: File,
  meta?: ThumbnailMeta
): Promise<string> {
  // 1. If it's an image file, create a crisp downscaled canvas thumbnail
  if (file.type.startsWith('image/')) {
    return generateImageFileThumbnail(file);
  }

  // 2. If it's a PDF or other document, generate an authentic academic cover thumbnail
  return generateDocumentCoverThumbnail(file.name, meta);
}

/**
 * Resizes and renders an image file to a standard 16:9 canvas thumbnail.
 */
function generateImageFileThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetWidth = 800;
        const targetHeight = 450; // 16:9 aspect ratio
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Background fill
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Calculate aspect fill
        const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (targetWidth - w) / 2;
        const y = (targetHeight - h) / 2;

        ctx.drawImage(img, x, y, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Generates an authentic academic study material cover thumbnail on Canvas
 * with dark chalkboard / blueprint grid styling, math watermark equations,
 * and high-contrast typography.
 */
export function generateDocumentCoverThumbnail(
  fileName: string,
  meta?: ThumbnailMeta
): string {
  const canvas = document.createElement('canvas');
  const width = 800;
  const height = 450; // 16:9
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const gradeText = (meta?.grade || 'Class 10').toUpperCase();
  const topicText = (meta?.topic || 'Mathematics').toUpperCase();
  const formatText = (meta?.format || 'Handcrafted Notes (PDF)').toUpperCase();
  const isPro = meta?.tier === 'pro';

  // 1. Dynamic background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  if (isPro) {
    bgGrad.addColorStop(0, '#1c1300');
    bgGrad.addColorStop(0.5, '#2e1c02');
    bgGrad.addColorStop(1, '#0b0800');
  } else {
    bgGrad.addColorStop(0, '#001e4d');
    bgGrad.addColorStop(0.4, '#003380');
    bgGrad.addColorStop(1, '#081121');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Subtle Blueprint / Graph Paper Grid
  ctx.strokeStyle = isPro ? 'rgba(251, 191, 36, 0.08)' : 'rgba(96, 165, 250, 0.08)';
  ctx.lineWidth = 1;
  const gridSize = 25;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 3. Mathematical Background Watermarks
  ctx.fillStyle = isPro ? 'rgba(251, 191, 36, 0.07)' : 'rgba(255, 255, 255, 0.06)';
  ctx.font = 'italic bold 56px "Times New Roman", serif';
  ctx.fillText('∫ f(x)dx', 40, 110);
  ctx.fillText('∑ xᵢ = μ', 600, 120);
  ctx.fillText('sin²θ + cos²θ = 1', 480, 400);
  ctx.fillText('x = (-b ± √D) / 2a', 60, 390);

  // Geometry diagram watermark (Right circle and triangle)
  ctx.strokeStyle = isPro ? 'rgba(251, 191, 36, 0.12)' : 'rgba(96, 165, 250, 0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(680, 220, 90, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(680, 130);
  ctx.lineTo(760, 290);
  ctx.lineTo(600, 290);
  ctx.closePath();
  ctx.stroke();

  // 4. Top Header Banner Strip
  ctx.fillStyle = isPro ? '#f59e0b' : '#38bdf8';
  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${gradeText} • ${topicText}`, 50, 60);

  // Tier Badge
  const badgeText = isPro ? '★ PRO MASTERCLASS' : '✓ VERIFIED NCERT KIT';
  const badgeWidth = ctx.measureText(badgeText).width + 24;
  ctx.fillStyle = isPro ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.2)';
  ctx.roundRect?.(width - badgeWidth - 45, 40, badgeWidth, 32, 8);
  ctx.fill?.();
  ctx.fillStyle = isPro ? '#fbbf24' : '#7dd3fc';
  ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(badgeText, width - badgeWidth - 33, 61);

  // 5. Main Title (Word wrapped)
  const displayTitle = meta?.title || fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 32px "Plus Jakarta Sans", sans-serif';

  // Simple text wrapping (up to 3 lines)
  const words = displayTitle.split(' ');
  let line = '';
  let y = 145;
  const maxLineLength = 580;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxLineLength && i > 0) {
      ctx.fillText(line.trim(), 50, y);
      line = words[i] + ' ';
      y += 42;
      if (y > 240) {
        line += '...';
        break;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), 50, y);

  // 6. Format Pill & Feature Tags
  const pillY = Math.max(y + 40, 260);
  ctx.fillStyle = isPro ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.15)';
  ctx.roundRect?.(50, pillY, 260, 36, 10);
  ctx.fill?.();
  ctx.fillStyle = isPro ? '#fef3c7' : '#e0e7ff';
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`📄 ${formatText}`, 65, pillY + 23);

  // 7. Footer Branding Bar
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(0, height - 52, width, 52);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Maths at Your Fingertips • Official Handcrafted Learning Kit', 50, height - 20);

  ctx.fillStyle = isPro ? '#fbbf24' : '#38bdf8';
  ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('100% EXAM READY PDF', width - 210, height - 20);

  return canvas.toDataURL('image/jpeg', 0.88);
}
