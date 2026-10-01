import { useState, useRef } from "react";
import clsx from "clsx";
import { Upload, X } from "lucide-react";
import { CarLayout } from "@/assets/images";
import Modal from "@/components/ui/Modal";

const MARKERS = [
  { key: "dent", label: "Dent", color: "bg-red-500" },
  { key: "scratches", label: "Scratches", color: "bg-blue-500" },
  { key: "damages", label: "Damages", color: "bg-blue-900" },
  { key: "eraser", label: "Eraser", color: "bg-ink-200" },
];

const ERASER = "eraser";

/** Mark type -> dot colour on the template (same as the legend). */
const MARK_COLOR = Object.fromEntries(
  MARKERS.filter((m) => m.key !== ERASER).map((m) => [m.key, m.color]),
);

function newMarkId() {
  return `mark-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Percent (0-100), 2 decimals - positions are stored relative to the
 * template image, so they stay put at any rendered size. */
function toPercent(offset, size) {
  const pct = (offset / size) * 100;
  return Math.round(Math.min(100, Math.max(0, pct)) * 100) / 100;
}

export default function DamageMarkerCard({
  jobcardId,
  timestamp,
  statusLabel = "In Progress",
  title = "Mark Dent, Scratches and Damages",
  imagesLabel = "Vehicle Images (Existing)",
  images = [],
  onImagesSelected, // optional callback: (files: File[]) => void
  // Template marking. `marks` is [{ id, type, x, y }] with x/y in percent
  // of the template image. Controlled when onMarksChange is passed.
  templateImage = CarLayout,
  marks = [],
  onMarksChange,
  readOnly = false,
  // Marked images saved on this vehicle's earlier jobcards:
  // [{ url, label }] - label is optional (e.g. jobcard no / date).
  previousMarkedImages = [],
}) {
  const [tool, setTool] = useState("dent");
  const [previewImage, setPreviewImage] = useState(null);
  const canMark = !readOnly && typeof onMarksChange === "function";

  function handleTemplateClick(e) {
    if (!canMark || tool === ERASER) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return; // image not laid out yet
    onMarksChange([
      ...marks,
      {
        id: newMarkId(),
        type: tool,
        x: toPercent(e.clientX - rect.left, rect.width),
        y: toPercent(e.clientY - rect.top, rect.height),
      },
    ]);
  }

  function handleMarkClick(e, markId) {
    // Never let a click on a mark fall through and add another one.
    e.stopPropagation();
    if (!canMark || tool !== ERASER) return;
    onMarksChange(marks.filter((m) => m.id !== markId));
  }
  const [newImages, setNewImages] = useState([]); // { file, url }
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesChosen = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const valid = files.filter(
      (f) => f.type.startsWith("image/") && f.size <= MAX_SIZE,
    );

    const withPreviews = valid.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setNewImages((prev) => [...prev, ...withPreviews]);
    onImagesSelected?.(valid);

    // reset input so selecting the same file again still fires onChange
    e.target.value = "";
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].url);
      next.splice(index, 1);
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-800">
            {jobcardId}
          </p>
          {timestamp && (
            <p className="mt-0.5 text-xs text-ink-500">{timestamp}</p>
          )}
        </div>
        <span className="shrink-0 rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
          {statusLabel}
        </span>
      </div>

      <h3 className="mb-3 text-sm font-semibold text-ink-800">{title}</h3>

      <div className="mb-3 rounded-lg border border-dashed border-ink-200 p-4">
        <TemplateMarker
          src={templateImage}
          marks={marks}
          tool={tool}
          canMark={canMark}
          onTemplateClick={handleTemplateClick}
          onMarkClick={handleMarkClick}
        />
      </div>

      <div className="mb-4 flex justify-around border-b border-ink-100 pb-3">
        {MARKERS.map((m) => {
          const active = tool === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setTool(m.key)}
              disabled={!canMark}
              className="flex flex-col items-center gap-1 text-xs cursor-pointer disabled:cursor-default"
              aria-pressed={active}
            >
              <span
                className={clsx("h-4 w-4 rounded-full", m.color)}
                aria-hidden="true"
              />
              <span
                className={clsx(
                  active ? "font-semibold text-ink-800" : "text-ink-500",
                )}
              >
                {m.label}
              </span>
              {active && (
                <span
                  className="h-0.5 w-full bg-brand-500"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {previousMarkedImages.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-ink-700">
            Previous Jobcard Markings
          </p>
          <div className="grid grid-cols-4 gap-2">
            {previousMarkedImages.map((img, i) => (
              <button
                key={img.url ?? i}
                type="button"
                onClick={() => setPreviewImage(img)}
                className="group flex flex-col gap-1 text-left cursor-pointer"
                title={img.label}
              >
                <span className="aspect-square overflow-hidden rounded-md border border-ink-100 bg-white">
                  <img
                    src={img.url}
                    alt={img.label || "Previous marked image"}
                    className="h-full w-full object-contain group-hover:opacity-80"
                  />
                </span>
                {img.label && (
                  <span className="truncate text-[11px] text-ink-500">
                    {img.label}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        title={previewImage?.label || "Previous Jobcard Marking"}
        size="lg"
      >
        {previewImage && (
          <img
            src={previewImage.url}
            alt={previewImage.label || "Previous marked image"}
            className="mx-auto block h-auto max-h-[70vh] max-w-full"
          />
        )}
      </Modal>

      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-ink-700">{imagesLabel}</p>
        <button
          type="button"
          className="text-xs font-semibold text-brand-700 hover:text-brand-800"
        >
          View All
        </button>
      </div>
      <div className="mb-3 grid grid-cols-4 gap-2">
        {images.slice(0, 4).map((src, i) => (
          <div
            key={`existing-${i}`}
            className="aspect-square overflow-hidden rounded-md bg-ink-100"
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
        {Array.from({ length: Math.max(0, 4 - images.length) }).map((_, i) => (
          <div
            key={`ph-${i}`}
            className="aspect-square rounded-md bg-ink-100"
          />
        ))}
      </div>

      {/* Newly uploaded images preview strip */}
      {newImages.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-sm font-medium text-ink-700">New Uploads</p>
          <div className="grid grid-cols-4 gap-2">
            {newImages.map((img, i) => (
              <div
                key={i}
                className="group relative aspect-square overflow-hidden rounded-md bg-ink-100"
              >
                <img
                  src={img.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(i)}
                  className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white group-hover:flex"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg"
        multiple
        className="hidden"
        onChange={handleFilesChosen}
      />

      <button
        type="button"
        onClick={handleUploadClick}
        className="flex w-full items-center cursor-pointer justify-center gap-2 rounded-lg border border-dashed border-brand-300 bg-brand-50/50 px-3 py-3 text-sm font-medium text-brand-700 hover:bg-brand-50"
      >
        <Upload className="h-4 w-4" /> Upload New Images
      </button>
      <p className="mt-1.5 text-center text-[11px] text-ink-400">
        PNG, JPG up to 5MB each
      </p>
    </div>
  );
}

/**
 * Template image with the marks drawn over it. The overlay box is exactly
 * the rendered image (no object-cover cropping), so a mark's percent
 * position always lands on the same spot of the template.
 */
function TemplateMarker({
  src,
  marks,
  tool,
  canMark,
  onTemplateClick,
  onMarkClick,
}) {
  const isErasing = tool === ERASER;

  return (
    <div
      className={clsx(
        "relative mx-auto w-fit select-none",
        canMark && !isErasing && "cursor-crosshair",
      )}
      onClick={onTemplateClick}
    >
      <img
        src={src}
        alt="Car layout diagram"
        draggable={false}
        className="block h-auto max-w-full lg:max-h-[400px]"
      />
      {marks.map((mark) => (
        <button
          key={mark.id}
          type="button"
          onClick={(e) => onMarkClick(e, mark.id)}
          title={canMark && isErasing ? "Click to erase" : undefined}
          aria-label={`${mark.type} mark${canMark && isErasing ? " - click to erase" : ""}`}
          className={clsx(
            "absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow",
            MARK_COLOR[mark.type] ?? "bg-red-500",
            canMark && isErasing
              ? "cursor-pointer hover:ring-2 hover:ring-red-400"
              : "cursor-default",
          )}
          style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
        />
      ))}
    </div>
  );
}
