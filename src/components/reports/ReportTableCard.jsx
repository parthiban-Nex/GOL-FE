import { Download, Search } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";

/**
 * A report screen that is "search, see a table, Download" - My Customers
 * and Inventory. Owns only layout; the page supplies data and paging, so
 * it works equally with server-side paging (useServerTable) and
 * client-side paging (usePagination).
 */
export default function ReportTableCard({
  title,
  searchPlaceholder = "Search",
  searchValue,
  onSearchChange,
  onSearch,
  onDownload,
  canDownload = true,
  columns,
  rows,
  isLoading,
  getRowId,
  emptyTitle,
  emptyDescription,
  pagination,
}) {
  return (
    <Card padded={false}>
      <div className="space-y-4 px-5 pt-5">
        <h1 className="text-lg font-semibold text-ink-800">{title}</h1>

        <div className="flex flex-wrap items-center gap-2">
          <form
            className="flex w-full max-w-md items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onSearch?.();
            }}
          >
            <div className="flex-1">
              <Input
                icon={Search}
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {canDownload && (
            <Button icon={Download} onClick={onDownload} className="ml-auto">
              Download
            </Button>
          )}
        </div>
      </div>

      <div className="pt-4">
        <Table
          columns={columns}
          data={rows}
          isLoading={isLoading}
          getRowId={getRowId}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </div>

      {pagination && <Pagination {...pagination} />}
    </Card>
  );
}
