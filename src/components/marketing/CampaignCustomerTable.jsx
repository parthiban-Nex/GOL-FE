import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function CampaignCustomerTable({ customer }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!customer) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-ink-100/70 bg-ink-50/40 text-[11px] font-bold tracking-wider text-ink-700 uppercase">
              <th scope="col" className="px-5 py-3.5 font-bold">
                Customer Name
              </th>
              <th scope="col" className="px-5 py-3.5 font-bold">
                Vehicle No
              </th>
              <th scope="col" className="px-5 py-3.5 font-bold">
                Last/Next Service Date
              </th>
              <th scope="col" className="px-5 py-3.5 font-bold">
                Product Type
              </th>
              <th scope="col" className="px-5 py-3.5 font-bold">
                Recommended
              </th>
              <th scope="col" className="px-5 py-3.5 font-bold text-center">
                Select Template
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-ink-50/30 transition-colors">
              <td className="whitespace-nowrap px-5 py-4 font-bold text-ink-900">
                {customer.customerName}
              </td>
              <td className="whitespace-nowrap px-5 py-4 font-semibold text-ink-800 tracking-wide">
                {customer.vehicleNo}
              </td>
              <td className="whitespace-nowrap px-5 py-4 font-medium text-ink-700">
                {customer.serviceDates}
              </td>
              <td className="whitespace-nowrap px-5 py-4 font-medium text-ink-700">
                {customer.productType}
              </td>
              <td className="px-5 py-4 font-normal text-ink-600 max-w-xs leading-relaxed">
                {customer.recommended}
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-center">
                <button
                  onClick={() => setIsExpanded((v) => !v)}
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 transition-colors cursor-pointer"
                  aria-label="Toggle details"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 stroke-[2.5]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 stroke-[2.5]" />
                  )}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
