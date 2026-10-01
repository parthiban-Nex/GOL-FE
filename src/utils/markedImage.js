/**
 * Flattens a template image + its damage marks into one PNG, so the
 * marked vehicle diagram can be uploaded and shown later as a picture.
 *
 * Marks are { type, x, y } with x/y in percent of the image, the same
 * shape DamageMarkerCard produces. The PNG is drawn at the template's
 * natural resolution so the marks land on exactly the same spots.
 */

/** Same colours as the legend in DamageMarkerCard (Tailwind 500/900). */
export const MARK_HEX = Object.freeze({
  dent: "#ef4444",
  scratches: "#3b82f6",
  damages: "#1e3a8a",
});

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Needed for cloud-hosted templates - without it the canvas is
    // "tainted" and cannot be exported. The bucket must allow CORS.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't load the template image."));
    img.src = src;
  });
}

/** Returns a PNG Blob of the template with the marks drawn on it. */
export async function renderMarkedImage(templateSrc, marks = []) {
  const img = await loadImage(templateSrc);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Transparent templates would export with a black background in some
  // viewers - paint white first.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  // Dot size scales with the image so it reads the same as on screen.
  const radius = Math.max(6, Math.round(width * 0.012));
  const border = Math.max(2, Math.round(radius / 3));

  for (const mark of marks) {
    const cx = (mark.x / 100) * width;
    const cy = (mark.y / 100) * height;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = MARK_HEX[mark.type] ?? MARK_HEX.dent;
    ctx.fill();
    ctx.lineWidth = border;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
  }

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Couldn't create the marked image.");
  return blob;
}

/** Wraps the PNG as a File so it can go straight into FormData. */
export async function buildMarkedImageFile(templateSrc, marks, fileName) {
  const blob = await renderMarkedImage(templateSrc, marks);
  return new File([blob], fileName, { type: "image/png" });
}
