import clsx from 'clsx';
import { Check } from 'lucide-react';

export default function RecommendedServiceSelector({
  services = [],
  selectedId,
  onSelect,
}) {
  const handleKeyDown = (e, id) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onSelect?.(id);
    }};
  if (!services || services.length === 0) {return null;}

  return (
    <div className="space-y-2.5">
      <h3 id="recommended-service-label" className="text-sm font-bold text-ink-900">Recommended Service</h3>

      <div role="radiogroup" aria-labelledby="recommended-service-label" className="flex flex-wrap items-center gap-3">
        {services.map((service) => {
          const isSelected = service.id === selectedId;

          return (
            <button
              key={service.id} role="radio" aria-checked={isSelected} tabIndex={0}
              onClick={() => onSelect?.(service.id)}
              onKeyDown={(e) => handleKeyDown(e, service.id)}
              type="button"
              className={clsx(
                'inline-flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                isSelected
                  ? 'border-emerald-500 bg-white text-ink-900 ring-1 ring-emerald-500/30'
                  : 'border-ink-200/80 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50/40'
              )} >
              <span>{service.title || service.name || service.id}</span>
              <div
                className={clsx(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors',
                  isSelected
                    ? 'bg-emerald-500 text-white'
                    : 'border border-ink-300 bg-transparent text-transparent'
                )} aria-hidden="true" >
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
