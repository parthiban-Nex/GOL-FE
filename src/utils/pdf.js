
const LINK_KEYS = ["url", "pdfUrl", "pdfLink", "link", "fileUrl", "data"];

function findLink(json) {
  for (const key of LINK_KEYS) {
    const v = json?.[key];
    if (typeof v === "string" && /^https?:\/\//i.test(v)) return v;
    if (v && typeof v === "object") {
      const nested = findLink(v);
      if (nested) return nested;
    }
  }
  return null;
}

function openOrDownload(href, fileName) {
  // No "noopener" feature here - with it window.open always returns null,
  // so a blocked pop-up couldn't be told apart from an opened one.
  const win = window.open(href, "_blank");
  if (win) {
    win.opener = null;
    return;
  }
  const a = document.createElement("a");
  a.href = href;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function openPdfResponse(blob, fileName = "document.pdf") {
  if (!(blob instanceof Blob)) throw new Error("No PDF was returned.");

  if (blob.type.includes("json") || blob.type.startsWith("text/")) {
    const text = await blob.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* plain text */
    }
    const link = findLink(json);
    if (link) {
      openOrDownload(link, fileName);
      return;
    }
    throw new Error(json?.message || "Couldn't generate the PDF.");
  }

  const url = URL.createObjectURL(
    blob.type ? blob : new Blob([blob], { type: "application/pdf" }),
  );
  openOrDownload(url, fileName);
  // Give the new tab time to load before releasing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
