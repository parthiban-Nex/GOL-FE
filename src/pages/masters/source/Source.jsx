import { useSearchParams } from "react-router-dom";
import clsx from "clsx";
import SourceTab from "./SourceTab";
import SourceTypeTab from "./SourceTypeTab";


const tabs = [
  { key: "source", label: "Source", component: SourceTab },
  { key: "source-type", label: "SourceType", component: SourceTypeTab },
];

export default function Source() {
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedTab = searchParams.get("tab");
  const activeTab = tabs.some((t) => t.key === requestedTab)
    ? requestedTab
    : tabs[0].key;

  function switchTab(next) {
    setSearchParams(next === tabs[0].key ? {} : { tab: next }, {
      replace: false,
    });
  }

  const ActiveComponent = tabs.find((t) => t.key === activeTab)?.component;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink-800">Source</h1>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => switchTab(t.key)}
            className={clsx(
              "cursor-pointer rounded-md px-4 py-1.5 text-sm font-semibold transition-colors",
              activeTab === t.key
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-ink-300 text-white",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {ActiveComponent && <ActiveComponent />}
    </div>
  );
}
