import { useEffect } from "react";

const DEFAULT_FAVICON = "/favicon.svg";
const APP_TITLE = "Focus Workspace";

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function createPendingFavicon(pendingCount: number) {
  const canvas = document.createElement("canvas");
  const size = 64;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) return DEFAULT_FAVICON;

  context.fillStyle = "#173B73";
  context.beginPath();
  context.arc(29, 29, 27, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#FFFFFF";
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(15, 29);
  context.lineTo(25, 39);
  context.lineTo(43, 20);
  context.stroke();

  const label = String(Math.min(pendingCount, 99));
  const badgeWidth = label.length === 1 ? 25 : 34;
  const badgeX = size - badgeWidth;

  context.fillStyle = "#E5484D";
  drawRoundedRect(context, badgeX, 37, badgeWidth, 27, 13.5);
  context.strokeStyle = "#FFFFFF";
  context.lineWidth = 3;
  context.stroke();

  context.fillStyle = "#FFFFFF";
  context.font = "700 19px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, badgeX + badgeWidth / 2, 51);

  return canvas.toDataURL("image/png");
}

export function usePendingFavicon(pendingCount: number, enabled: boolean) {
  useEffect(() => {
    const favicon = document.querySelector<HTMLLinkElement>("#app-favicon");
    if (!favicon) return undefined;

    const visibleCount = enabled ? pendingCount : 0;
    favicon.href = visibleCount > 0 ? createPendingFavicon(visibleCount) : DEFAULT_FAVICON;
    favicon.type = visibleCount > 0 ? "image/png" : "image/svg+xml";
    document.title = visibleCount > 0 ? `(${Math.min(visibleCount, 99)}) ${APP_TITLE}` : APP_TITLE;

    return () => {
      favicon.href = DEFAULT_FAVICON;
      favicon.type = "image/svg+xml";
      document.title = APP_TITLE;
    };
  }, [enabled, pendingCount]);
}
