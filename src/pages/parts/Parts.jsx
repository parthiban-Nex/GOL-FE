import { useSearchParams } from "react-router-dom";
import SpareIssue from "./spare-issue/SpareIssue";
import PurchaseOrder from "./purchase-order/PurchaseOrder";
import GrnDirect from "./grn-direct/GrnDirect";
import AutoGrn from "./auto-grn/AutoGrn";
import clsx from "clsx";

const TABS = [
  { key: "spare-issue", label: "Spare Issue & Return" },
  { key: "purchase-order", label: "Purchase Order" },
  { key: "grn-direct", label: "GRN Direct" },
  { key: "auto-grn", label: "Auto GRN" },
];

export default function Parts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "spare-issue";

  function setTab(tabKey) {
    setSearchParams({ tab: tabKey });
  }

  return (
    <div className="space-y-4">
      <div className="flex border-b border-ink-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={clsx(
              "px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer",
              activeTab === tab.key
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-ink-500 hover:text-ink-800",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "purchase-order" && <PurchaseOrder />}
      {activeTab === "grn-direct" && <GrnDirect />}
      {activeTab === "auto-grn" && <AutoGrn />}
      {activeTab === "spare-issue" && <SpareIssue />}
    </div>
  );
}
