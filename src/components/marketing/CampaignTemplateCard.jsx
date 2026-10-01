import clsx from "clsx";
import { Pencil, Trash2, Check } from "lucide-react";
import IconAction from "@/components/ui/IconAction";

export default function CampaignTemplateCard({
  template,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}) {
  if (!template) return null;

  return (
    <div
      onClick={() => onSelect?.(template.id)}
      className={clsx(
        "group relative flex flex-col justify-between rounded-xl border bg-white p-4.5 transition-all duration-200 cursor-pointer shadow-xs",
        isSelected
          ? "border-emerald-500 ring-1 ring-emerald-500/40 shadow-sm"
          : "border-ink-200/80 hover:border-ink-300 hover:shadow-md",
      )}
    >
      {/* Header bar: Title, Pencil Edit button, Checkmark Selection */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-ink-100/60">
        <h4 className="text-sm font-bold tracking-tight text-ink-900">
          {template.title}
        </h4>

        <div className="flex items-center gap-2">
          {/* Edit button - hidden unless the page grants Update permission */}
          {canEdit && (
            <div onClick={(e) => e.stopPropagation()}>
              <IconAction
                icon={Pencil}
                label="Edit Template"
                tone="edit"
                onClick={() => onEdit?.(template)}
              />
            </div>
          )}
          {/* Delete */}
          {canDelete && (
            <div onClick={(e) => e.stopPropagation()}>
              <IconAction
                icon={Trash2}
                label="Delete Template"
                tone="danger"
                onClick={() => onDelete?.(template)}
              />
            </div>
          )}
          {/* Radio indicator */}
          <div
            className={clsx(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors",
              isSelected
                ? "bg-emerald-500 text-white"
                : "border border-ink-300 bg-transparent text-transparent",
            )}
          >
            <Check className="h-3 w-3 stroke-[3]" />
          </div>
        </div>
      </div>

      {/* Template Message Content */}
      <div className="py-3.5 space-y-2.5 text-xs text-ink-700 leading-relaxed">
        {template.warning && (
          <p className="font-medium text-ink-800 whitespace-pre-line">
            {template.warning}
          </p>
        )}

        {template.offer && (
          <p className="font-bold text-ink-900 bg-ink-50/60 p-2 rounded-lg border border-ink-100/60">
            {template.offer}
          </p>
        )}

        {template.callToAction && (
          <p className="font-normal text-ink-600">{template.callToAction}</p>
        )}
      </div>

      {/* Footer brand signature */}
      <div className="pt-2 border-t border-ink-100/60">
        <span className="text-xs font-bold tracking-wide text-brand-700">
          {template.footer || "myTVS - Tried. Tested. Trusted"}
        </span>
      </div>
    </div>
  );
}
