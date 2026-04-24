import { FitCardData } from "./fitCardCaption";
import { formatTemp } from "./format";

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, "#FFF3E0");
  bgGrad.addColorStop(1, "#FFB347");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  const radial = ctx.createRadialGradient(w, 0, 0, w, 0, 400);
  radial.addColorStop(0, "rgba(255,255,255,0.3)");
  radial.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, w, h);
}

function drawBottomBar(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const bottomGrad = ctx.createLinearGradient(0, h - 40, 0, h);
  bottomGrad.addColorStop(0, "rgba(249,115,22,0.8)");
  bottomGrad.addColorStop(1, "rgba(234,88,12,0.9)");
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, h - 40, w, 40);

  ctx.textAlign = "center";
  ctx.font = "bold 20px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText("FIT✔️", w / 2, h - 12);
}

async function drawLogoHeader(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.12)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x, y, 80, 80, 20);
  ctx.fill();
  ctx.restore();

  try {
    const logo = await loadImage("/logo.png");
    ctx.save();
    roundRect(ctx, x, y, 80, 80, 20);
    ctx.clip();
    ctx.drawImage(logo, x, y, 80, 80);
    ctx.restore();
  } catch {
    // skip logo if it fails
  }
}

export async function exportFitCard(data: FitCardData): Promise<Blob> {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d context");

  await drawBackground(ctx, W, H);

  if (data.userPhoto) {
    await drawSplitLayout(ctx, data, W, H);
  } else {
    await drawCenteredLayout(ctx, data, W, H);
  }

  drawBottomBar(ctx, W, H);

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export canvas"));
    }, "image/jpeg", 0.92);
  });
}

async function drawSplitLayout(ctx: CanvasRenderingContext2D, data: FitCardData, W: number, H: number) {
  const PHOTO_W = 460;
  const INFO_X = PHOTO_W + 40;
  const INFO_W = W - INFO_X - 48;

  // Draw user photo on left — fill the full left column
  try {
    const photo = await loadImage(data.userPhoto!);
    ctx.save();
    roundRect(ctx, 0, 0, PHOTO_W, H, 0);
    ctx.clip();
    // cover-fit: scale to fill, center crop
    const scale = Math.max(PHOTO_W / photo.width, H / photo.height);
    const sw = PHOTO_W / scale;
    const sh = H / scale;
    const sx = (photo.width - sw) / 2;
    const sy = (photo.height - sh) / 2;
    ctx.drawImage(photo, sx, sy, sw, sh, 0, 0, PHOTO_W, H);
    ctx.restore();

    // Fade edge from photo to info panel
    const fadeGrad = ctx.createLinearGradient(PHOTO_W - 120, 0, PHOTO_W + 40, 0);
    fadeGrad.addColorStop(0, "rgba(255,243,224,0)");
    fadeGrad.addColorStop(1, "#FFF3E0");
    ctx.fillStyle = fadeGrad;
    ctx.fillRect(PHOTO_W - 120, 0, 160, H);
  } catch {
    // If photo fails, draw placeholder
    ctx.fillStyle = "rgba(255,179,71,0.3)";
    ctx.fillRect(0, 0, PHOTO_W, H);
  }

  // Info panel — right side
  await drawLogoHeader(ctx, INFO_X, 48);

  // "FIT CARD" label
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.fillStyle = "rgba(140,80,20,0.7)";
  ctx.textAlign = "left";
  ctx.fillText("FIT CARD", INFO_X + 96, 74);

  ctx.font = "bold 42px system-ui, sans-serif";
  ctx.fillStyle = "#1a1a1a";
  ctx.fillText("FIT✔️", INFO_X + 96, 114);

  // Score badge
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  roundRect(ctx, INFO_X, 152, 160, 50, 25);
  ctx.fill();
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.fillStyle = "#888";
  ctx.fillText("SCORE", INFO_X + 20, 181);
  ctx.font = "bold 28px system-ui, sans-serif";
  if (data.fitScore >= 80) ctx.fillStyle = "#f59e0b";
  else if (data.fitScore >= 60) ctx.fillStyle = "#22c55e";
  else ctx.fillStyle = "#ef4444";
  ctx.fillText(String(data.fitScore), INFO_X + 95, 182);

  // Location dot + text
  ctx.fillStyle = "#FFB347";
  ctx.beginPath();
  ctx.arc(INFO_X + 8, 226, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "24px system-ui, sans-serif";
  ctx.fillStyle = "#5a3a10";
  ctx.fillText(data.location, INFO_X + 22, 232);
  ctx.font = "22px system-ui, sans-serif";
  ctx.fillStyle = "#888";
  ctx.fillText(data.date, INFO_X, 262);

  // Divider
  ctx.fillStyle = "rgba(180,100,20,0.15)";
  ctx.fillRect(INFO_X, 290, INFO_W, 1);

  // Temperature + weather
  ctx.textAlign = "center";
  const cx = INFO_X + INFO_W / 2;
  ctx.font = "bold 88px system-ui, sans-serif";
  ctx.fillStyle = "#1a1a1a";
  ctx.fillText(formatTemp(data.temperatureF, data.units), cx, 390);
  ctx.font = "28px system-ui, sans-serif";
  ctx.fillStyle = "#666";
  ctx.fillText(data.weatherLabel, cx, 430);

  // Divider
  ctx.fillStyle = "rgba(180,100,20,0.15)";
  ctx.fillRect(INFO_X, 460, INFO_W, 1);

  // Outfit
  ctx.textAlign = "left";
  ctx.font = "bold 20px system-ui, sans-serif";
  ctx.fillStyle = "#F97316";
  ctx.fillText("TODAY'S FIT", INFO_X, 506);
  ctx.font = "bold 32px system-ui, sans-serif";
  ctx.fillStyle = "#1a1a1a";
  let nextY = wrapText(ctx, data.mainOutfit, INFO_X, 548, INFO_W, 44);

  if (data.outerwear) {
    nextY += 16;
    ctx.font = "bold 18px system-ui, sans-serif";
    ctx.fillStyle = "#F97316";
    ctx.fillText("LAYER", INFO_X, nextY);
    nextY += 36;
    ctx.font = "bold 28px system-ui, sans-serif";
    ctx.fillStyle = "#1a1a1a";
    nextY = wrapText(ctx, data.outerwear, INFO_X, nextY, INFO_W, 40);
  }

  if (data.accessories.length > 0) {
    nextY += 16;
    let accX = INFO_X;
    ctx.font = "bold 20px system-ui, sans-serif";
    for (const acc of data.accessories) {
      const tw = ctx.measureText(acc).width + 32;
      if (accX + tw > INFO_X + INFO_W) { accX = INFO_X; nextY += 50; }
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      roundRect(ctx, accX, nextY - 28, tw, 38, 12);
      ctx.fill();
      ctx.fillStyle = "#5a3a10";
      ctx.fillText(acc, accX + 16, nextY);
      accX += tw + 12;
    }
    nextY += 24;
  }

  // Hashtags near bottom
  ctx.font = "19px system-ui, sans-serif";
  ctx.fillStyle = "rgba(140,80,20,0.6)";
  wrapText(ctx, data.hashtags.slice(0, 5).join(" "), INFO_X, 940, INFO_W, 26);
}

async function drawCenteredLayout(ctx: CanvasRenderingContext2D, data: FitCardData, W: number, H: number) {
  await drawLogoHeader(ctx, 48, 48);

  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillStyle = "rgba(140,80,20,0.7)";
  ctx.textAlign = "left";
  ctx.fillText("FIT CARD", 160, 80);

  ctx.font = "bold 52px system-ui, sans-serif";
  ctx.fillStyle = "#1a1a1a";
  ctx.fillText("FIT✔️", 160, 128);

  ctx.fillStyle = "#FFB347";
  ctx.beginPath();
  ctx.arc(53, 194, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "28px system-ui, sans-serif";
  ctx.fillStyle = "#5a3a10";
  ctx.fillText(data.location, 64, 200);
  ctx.font = "26px system-ui, sans-serif";
  ctx.fillStyle = "#888";
  ctx.fillText(data.date, 48, 234);

  ctx.fillStyle = "rgba(180,100,20,0.15)";
  ctx.fillRect(48, 260, 984, 1);

  ctx.textAlign = "center";
  ctx.font = "bold 96px system-ui, sans-serif";
  ctx.fillStyle = "#1a1a1a";
  ctx.fillText(formatTemp(data.temperatureF, data.units), 540, 360);
  ctx.font = "32px system-ui, sans-serif";
  ctx.fillStyle = "#666";
  ctx.fillText(data.weatherLabel, 540, 410);

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  roundRect(ctx, 892, 48, 140, 52, 26);
  ctx.fill();
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillStyle = "#888";
  ctx.fillText("SCORE", 910, 79);
  ctx.font = "bold 24px system-ui, sans-serif";
  if (data.fitScore >= 80) ctx.fillStyle = "#f59e0b";
  else if (data.fitScore >= 60) ctx.fillStyle = "#22c55e";
  else ctx.fillStyle = "#ef4444";
  ctx.fillText(String(data.fitScore), 975, 80);

  ctx.fillStyle = "rgba(180,100,20,0.15)";
  ctx.fillRect(48, 440, 984, 1);

  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.fillStyle = "#F97316";
  ctx.fillText("TODAY'S FIT", 48, 498);
  ctx.font = "bold 38px system-ui, sans-serif";
  ctx.fillStyle = "#1a1a1a";
  let nextY = wrapText(ctx, data.mainOutfit, 48, 548, 984, 50);

  if (data.outerwear) {
    ctx.font = "bold 22px system-ui, sans-serif";
    ctx.fillStyle = "#F97316";
    nextY += 20;
    ctx.fillText("LAYER", 48, nextY);
    ctx.font = "bold 38px system-ui, sans-serif";
    ctx.fillStyle = "#1a1a1a";
    nextY += 40;
    nextY = wrapText(ctx, data.outerwear, 48, nextY, 984, 50);
  }

  if (data.accessories.length > 0) {
    nextY += 20;
    let accX = 48;
    ctx.font = "bold 24px system-ui, sans-serif";
    for (const acc of data.accessories) {
      const tw = ctx.measureText(acc).width + 40;
      if (accX + tw > 1032) { accX = 48; nextY += 60; }
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      roundRect(ctx, accX, nextY, tw, 44, 16);
      ctx.fill();
      ctx.fillStyle = "#5a3a10";
      ctx.fillText(acc, accX + 20, nextY + 30);
      accX += tw + 16;
    }
  }

  ctx.font = "22px system-ui, sans-serif";
  ctx.fillStyle = "rgba(140,80,20,0.6)";
  wrapText(ctx, data.hashtags.slice(0, 6).join(" "), 48, 920, 984, 30);
}
