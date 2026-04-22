import { FitCardData } from "./fitCardCaption";
import { formatTemp } from "./format";

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
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

export async function exportFitCard(data: FitCardData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d context");

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
  bgGrad.addColorStop(0, "#FFF3E0");
  bgGrad.addColorStop(1, "#FFB347");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1080);

  // Radial glow
  const radial = ctx.createRadialGradient(1080, 0, 0, 1080, 0, 400);
  radial.addColorStop(0, "rgba(255,255,255,0.3)");
  radial.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, 1080, 1080);

  // Logo shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.12)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 48, 48, 96, 96, 24);
  ctx.fill();
  ctx.restore();

  // Load logo
  await new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.save();
      roundRect(ctx, 48, 48, 96, 96, 24);
      ctx.clip();
      ctx.drawImage(img, 48, 48, 96, 96);
      ctx.restore();
      resolve();
    };
    img.onerror = () => resolve(); // continue even if logo fails
    img.src = "/logo.png";
  });

  // Header text
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillStyle = "rgba(140,80,20,0.7)";
  ctx.fillText("FIT CARD", 160, 80);

  ctx.font = "bold 52px system-ui, sans-serif";
  ctx.fillStyle = "#1a1a1a";
  ctx.fillText("Fit Check", 160, 128);

  // Location & Date
  ctx.fillStyle = "#FFB347"; // amber
  ctx.beginPath();
  ctx.arc(53, 194, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "28px system-ui, sans-serif";
  ctx.fillStyle = "#5a3a10";
  ctx.fillText(data.location, 64, 200);

  ctx.font = "26px system-ui, sans-serif";
  ctx.fillStyle = "#888888";
  ctx.fillText(data.date, 48, 234);

  // Divider
  ctx.fillStyle = "rgba(180,100,20,0.15)";
  ctx.fillRect(48, 260, 984, 1);

  // Temperature
  ctx.textAlign = "center";
  const tempText = formatTemp(data.temperatureF, data.units);
  
  ctx.font = "bold 96px system-ui, sans-serif";
  ctx.fillStyle = "#1a1a1a";
  ctx.fillText(tempText, 540, 360);

  ctx.font = "32px system-ui, sans-serif";
  ctx.fillStyle = "#666666";
  ctx.fillText(data.weatherLabel, 540, 410);

  // Fit score badge
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 892, 48, 140, 52, 26);
  ctx.fill();
  
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillStyle = "#888888";
  ctx.fillText("SCORE", 910, 79);

  ctx.font = "bold 24px system-ui, sans-serif";
  if (data.fitScore >= 80) ctx.fillStyle = "#f59e0b"; // amber
  else if (data.fitScore >= 60) ctx.fillStyle = "#22c55e"; // green
  else ctx.fillStyle = "#ef4444"; // red
  ctx.fillText(data.fitScore.toString(), 975, 80);

  // Divider
  ctx.fillStyle = "rgba(180,100,20,0.15)";
  ctx.fillRect(48, 440, 984, 1);

  // Outfit section
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

  // Accessories
  if (data.accessories && data.accessories.length > 0) {
    nextY += 20;
    let accX = 48;
    ctx.font = "bold 24px system-ui, sans-serif";
    
    data.accessories.forEach(acc => {
      const metrics = ctx.measureText(acc);
      const w = metrics.width + 40;
      if (accX + w > 1032) {
        accX = 48;
        nextY += 60;
      }
      
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      roundRect(ctx, accX, nextY, w, 44, 16);
      ctx.fill();
      
      ctx.fillStyle = "#5a3a10";
      ctx.fillText(acc, accX + 20, nextY + 30);
      
      accX += w + 16;
    });
  }

  // Hashtags
  ctx.font = "22px system-ui, sans-serif";
  ctx.fillStyle = "rgba(140,80,20,0.6)";
  wrapText(ctx, data.hashtags.slice(0, 6).join(" "), 48, 920, 984, 30);

  // Bottom bar
  const bottomGrad = ctx.createLinearGradient(0, 1040, 0, 1080);
  bottomGrad.addColorStop(0, "rgba(249,115,22,0.8)");
  bottomGrad.addColorStop(1, "rgba(234,88,12,0.9)");
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, 1040, 1080, 40);

  ctx.textAlign = "center";
  ctx.font = "bold 20px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText("fitcheck.app", 540, 1068);

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export canvas"));
    }, "image/jpeg", 0.92);
  });
}
