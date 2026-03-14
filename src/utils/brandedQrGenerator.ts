import QRCode from 'qrcode';

const TYPE_LABELS: Record<string, string> = {
  reading_room: 'Reading Room',
  hostel: 'Hostel',
  mess: 'Mess',
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export const generateBrandedQrPng = async (
  propertyId: string,
  propertyType: string,
  propertyName: string,
): Promise<string> => {
  const W = 480;
  const H = 640;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 20);
  ctx.fill();

  // Header gradient bar
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#1e3a5f');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, 140, [20, 20, 0, 0]);
  ctx.fill();

  // Logo
  try {
    const logo = await loadImage('/splash-logo.png');
    const logoSize = 56;
    ctx.drawImage(logo, (W - logoSize) / 2, 20, logoSize, logoSize);
  } catch { /* skip logo */ }

  // Brand text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('InhaleStays.com', W / 2, 110);

  // QR code
  const qrData = JSON.stringify({ propertyId, type: propertyType });
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, qrData, { width: 260, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } });
  const qrX = (W - 260) / 2;
  const qrY = 165;

  // QR border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(qrX - 15, qrY - 15, 290, 290, 12);
  ctx.stroke();

  ctx.drawImage(qrCanvas, qrX, qrY, 260, 260);

  // Divider
  const divY = 470;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, divY);
  ctx.lineTo(W - 60, divY);
  ctx.stroke();

  // Property name
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const displayName = propertyName.length > 28 ? propertyName.slice(0, 26) + '…' : propertyName;
  ctx.fillText(displayName, W / 2, 510);

  // Type label
  ctx.fillStyle = '#64748b';
  ctx.font = '16px system-ui, sans-serif';
  const label = TYPE_LABELS[propertyType] || propertyType;
  ctx.fillText(`── ${label} ──`, W / 2, 545);

  // Scan instruction
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Scan to mark attendance', W / 2, 590);

  // Border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(1, 1, W - 2, H - 2, 20);
  ctx.stroke();

  return canvas.toDataURL('image/png');
};
