import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { purchaseReturnApi } from "@/services";
import { showToast } from "@/utils/toast";
import CreatePurchaseReturnModal from "./CreatePurchaseReturnModal";

const SEARCH_DEBOUNCE_MS = 400;

// "id" -> hidden; "grn_no" -> "GRN NO"; "purchaseReturnDate" -> "PURCHASE RETURN DATE"
const toHeader = (key) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toUpperCase();

export default function PurchaseReturn() {
  const { canCreate } = usePagePermissions();

  const [data, setData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Server-side pagination (limit + offset)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce the search box.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await purchaseReturnApi.list({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        searchKey: searchQuery,
      });
      if (res?.requestSuccessful) {
        setData(res?.data ?? []);
        setTotalItems(res?.count ?? 0);
      } else {
        setData([]);
        setTotalItems(0);
      }
    } catch {
      showToast.error("Failed to load purchase returns");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // The old screen built its columns from the response keys; keep doing that
  // so the list works without knowing the exact field names.
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0])
      .filter((key) => key !== "id")
      .map((key) => ({ key, header: toHeader(key) }));
  }, [data]);

  async function handleCreate({
    grnNo,
    grnId,
    vendorCode,
    vendorName,
    vendorId,
    items,
  }) {
    const d = new Date();
    const purchase_return_date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

    const purchaseReturnData = {
      grn_no: grnNo,
      grn_id: grnId,
      vendor_code: vendorCode,
      vendor_name: vendorName,
      purchase_return_date,
      vendor_id: vendorId,
    };

    const purchaseReturnPartsData = items.map((it) => ({
      id: it.id,
      item_code: it["Parts Code"],
      item_description: it.Description,
      quantity: it.returnQty,
      cost: parseFloat(it.Cost),
      cgst: it.CGST,
      sgst: it.SGST,
      igst: it.IGST,
      total: parseFloat(it.totalAmount),
      discount: it.Discount,
      item_id: it.item_id,
    }));

    setIsSubmitting(true);
    try {
      await purchaseReturnApi.quickAdd({
        purchaseReturnData,
        purchaseReturnPartsData,
      });
      showToast.success("Purchase return created successfully");
      setIsCreateOpen(false);
      if (page === 1) loadData();
      else setPage(1); // the effect reloads page 1
    } catch (err) {
      showToast.error(err.message || "Failed to create purchase return");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-ink-800">Purchase Return</h1>
        {canCreate && (
          <Button icon={Plus} onClick={() => setIsCreateOpen(true)}>
            Create Purchase Return
          </Button>
        )}
      </div>

      <Card padded={false}>
        <div className="flex items-center gap-2 px-5 py-3">
          <div className="max-w-sm flex-1">
            <Input
              icon={Search}
              placeholder="Search purchase return"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={data}
          isLoading={isLoading}
          getRowId={(row) => row.id}
          emptyTitle="No purchase returns found"
          emptyDescription="Try a different search."
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </Card>

      <CreatePurchaseReturnModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}