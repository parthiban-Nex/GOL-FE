import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import SingleSelect from "@/components/ui/SingleSelect";
import { useServerTable } from "@/hooks/useServerTable";
import { userLogApi, ACCESS_CHANNELS } from "@/services";
import Input from "@/components/ui/Input";

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

const columns = [
  { key: "username", header: "User Name" },
  {
    key: "login_time",
    header: "Login Time",
    render: (row) => formatDateTime(row.login_time) || "-",
  },
  {
    key: "logout_time",
    header: "Logout Time",
    render: (row) => formatDateTime(row.logout_time) || "-",
  },
  {
    key: "time_duration",
    header: "Duration(Sec)",
    render: (row) => row.time_duration ?? "-",
  },
  { key: "access", header: "Access" },
];

const accessOptions = ACCESS_CHANNELS.map((a) => ({ value: a, label: a }));

const SEARCH_DEBOUNCE_MS = 400;

export default function UserLog() {
  // Draft values live in the toolbar; `filters` is what's actually been
  // submitted, so editing a date/access field doesn't refetch until
  // Submit - same pattern as Audit Log. Text search stays separate and
  // debounces on every keystroke.
  const [draft, setDraft] = useState({
    startDate: "",
    endDate: "",
    access: "",
  });
  const [filters, setFilters] = useState(draft);

  const [searchInput, setSearchInput] = useState("");
  const searchTimerRef = useRef(null);

  const list = useCallback((body) => userLogApi.list(body), []);
  const extraParams = useMemo(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
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
  } = useServerTable(list, userLogApi.listKey, { extraParams });

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
        <h1 className="text-lg font-semibold text-ink-800">User Log</h1>
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
          emptyTitle="No user sessions found"
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