import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SingleSelect from "@/components/ui/SingleSelect";
import { useServerTable } from "@/hooks/useServerTable";
import { auditLogApi, AUDIT_ACTIONS, ACCESS_CHANNELS } from "@/services";

const SEARCH_DEBOUNCE_MS = 400;

const actionOptions = AUDIT_ACTIONS.map((a) => ({ value: a, label: a }));
const accessOptions = ACCESS_CHANNELS.map((a) => ({ value: a, label: a }));

const columns = [
  { key: "createdAt", header: "Activity Time" },
  { key: "username", header: "User Name" },
  { key: "action", header: "Action" },
  {
    key: "submenu_name",
    header: "Action Details",
    render: (row) => row.submenu_name || row.menu_name || "-",
  },
  { key: "message", header: "Message" },
  { key: "access", header: "Access" },
  { key: "result", header: "Result" },
];

export default function AuditLog() {
  // Draft values live in the toolbar; `filters` is what's actually been
  // submitted, so editing a date/action/access field doesn't refetch
  // until Submit. Text search is separate - it debounces like every
  // other grid's search box instead of waiting on Submit.
  const [draft, setDraft] = useState({
    startDate: "",
    endDate: "",
    action: "",
    access: "",
  });
  const [filters, setFilters] = useState(draft);
  const [searchInput, setSearchInput] = useState("");
  const searchTimerRef = useRef(null);

  const list = useCallback((body) => auditLogApi.list(body), []);
  const extraParams = useMemo(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
      action: filters.action,
      access: filters.access,
    }),
    [filters],
  );

  const {
    rows,
    totalItems,
    totalPages,
    isLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
  } = useServerTable(list, auditLogApi.listKey, { extraParams });

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      search(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchInput, search]);

  function updateDraft(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setFilters(draft);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink-800">Audit Log</h1>
      </div>

      <Card>
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-end gap-4"
        >
          <div className="w-40">
            <Input
              label="Start date"
              type="date"
              variant="underline"
              value={draft.startDate}
              onChange={(e) => updateDraft("startDate", e.target.value)}
            />
          </div>
          <div className="w-40">
            <Input
              label="End date"
              type="date"
              variant="underline"
              value={draft.endDate}
              onChange={(e) => updateDraft("endDate", e.target.value)}
            />
          </div>
          <div className="w-44">
            <SingleSelect
              label="Action"
              placeholder="All actions"
              value={draft.action}
              onChange={(value) => updateDraft("action", value ?? "")}
              options={actionOptions}
            />
          </div>
          <div className="w-44">
            <SingleSelect
              label="Access"
              placeholder="All access"
              value={draft.access}
              onChange={(value) => updateDraft("access", value ?? "")}
              options={accessOptions}
            />
          </div>
          <Button type="submit">Submit</Button>
        </form>
      </Card>

      <Card padded={false}>
        <div className="max-w-sm px-5 py-3">
          <Input
            icon={Search}
            placeholder="Search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Table
          columns={columns}
          data={rows}
          isLoading={isLoading}
          getRowId={(row) => row.id}
          emptyTitle="No audit entries found"
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </div>
  );
}
