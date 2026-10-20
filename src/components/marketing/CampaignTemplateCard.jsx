import clsx from 'clsx';
import { Pencil, Trash2, Check } from 'lucide-react';
import IconAction from '@/components/ui/IconAction';

export default function CampaignTemplateCard({
  template,
  isSelected = false,
  previewData = null,
  isPreviewLoading = false,
  previewError = null,
  onSelect,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}) {
  if (!template) return null;

  const hasPreviewError = Boolean(isSelected && previewError);
  const hasStructuredParts = Boolean(
    !previewData &&
    !template.content &&
    !template.body &&
    (template.warning || template.offer || template.callToAction)
  );

  const displayTitle =
    (isSelected && !hasPreviewError && previewData?.title) ||
    template.title ||
    '(Untitled Template)';
  const displayContent = hasPreviewError
    ? 'Preview unavailable'
    : (isSelected && previewData?.content) ||
      template.content ||
      template.body ||
      template.message ||
      [template.warning, template.offer, template.callToAction].filter(Boolean).join('\n\n') ||
      '(No message content available)';
  const displayFooter =
    (isSelected && !hasPreviewError && previewData?.footer) ||
    template.footer ||
    'myTVS - Tried. Tested. Trusted';

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onSelect?.(template.id);
    }
  };

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onClick={() => onSelect?.(template.id)}
      onKeyDown={handleKeyDown}
      className={clsx(
        'group relative flex flex-col justify-between rounded-xl border bg-white p-4.5 transition-all duration-200 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        isSelected
          ? 'border-emerald-500 ring-1 ring-emerald-500/40 shadow-sm'
          : 'border-ink-200/80 hover:border-ink-300 hover:shadow-md'
      )}
    >
      {/* Header bar: Title, Edit, Delete, Selection Indicator */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-ink-100/60">
        <div className="flex items-center gap-2 overflow-hidden">
          <h4 className="text-sm font-bold tracking-tight text-ink-900 truncate">
            {displayTitle}
          </h4>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
          <div
            className={clsx(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors',
              isSelected
                ? 'bg-emerald-500 text-white'
                : 'border border-ink-300 bg-transparent text-transparent'
            )}
            aria-hidden="true"
          >
            <Check className="h-3 w-3 stroke-[3]" />
          </div>
        </div>
      </div>

      <div className="py-3.5 space-y-2 text-xs text-ink-700 leading-relaxed min-h-[90px]">
        {isSelected && isPreviewLoading ? (
          <div className="flex items-center justify-center py-6 text-xs text-ink-400">
            Loading…
          </div>
        ) : hasPreviewError ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-amber-700 bg-amber-50/60 rounded-lg p-3">
            <span className="font-semibold">Preview unavailable</span>
            <span className="text-[11px] text-amber-600 mt-0.5">
              Please select another service or template
            </span>
          </div>
        ) : hasStructuredParts ? (
          <div className="space-y-2.5 text-xs text-ink-700 leading-relaxed">
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
        ) : (
          <div className="whitespace-pre-wrap break-words font-normal">
            {displayContent}
          </div>
        )}
      </div>

      {/* Footer */}
      {displayFooter ? (
        <div className="pt-2 border-t border-ink-100/60">
          <span className="text-xs font-medium tracking-wide text-ink-600 whitespace-pre-wrap">
            {displayFooter}
          </span>
        </div>
      ) : null}
    </div>
  );
}
