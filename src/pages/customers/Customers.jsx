import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Trash2, Eye } from "lucide-react";
import IconAction from "@/components/ui/IconAction";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import { ConfirmModal } from "@/components/ui/Modal";
import CustomerSearchBar from "@/components/customers/CustomerSearchBar";
import CustomerQuickAddForm, {
  emptyQuickAddForm,
} from "@/components/customers/CustomerQuickAddForm";
import CustomerDetailsModal from "@/components/customers/CustomerDetailsModal";
import { usePagination } from "@/hooks/usePagination";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { customerApi } from "@/services";
import { extractList, responseMessage } from "@/utils/apiResponse";
import { truncate } from "@/utils/formatters";
import { showToast } from "@/utils/toast";
import { DEFAULT_FUEL_TYPE } from "@/constants/vehicleEnums";
import CustomerVehiclesModal from "@/components/customers/CustomerVehiclesModal";

const SEARCH_DEBOUNCE_MS = 400;
const PAGE_LIMIT = 25;

function mapCustomerRow(row) {
  return {
    id: row.customerId,
    vehicleId: row.vehicleId,
    name: row.name ?? "",
    mobile: row.mobileNumber ?? "",
    email: row.emailId ?? "",
    customerCode: row.customerCode ?? "",
    customerType: row.customerType ?? "",
    pincode: row.pinCode ?? "",
    address: row.address1 ?? "",
    profileCategory: row.customerCategory ?? "",
    state: row.state ?? "",
    city: row.city ?? "",
    regNo: row.registrationNumber ?? "",
    makeId: row.makeId ?? null,
    make: row.makeName ?? "",
    modelId: row.modelId ?? null,
    model: row.modelName ?? "",
    fuel: row.fuelType ?? "",
    chassisNo: row.chassisNumber ?? "",
    engineNo: row.engineNumber ?? "",
    manufacturerYear: row.manufacturingYear ?? "",
    // Nested blocks, flattened for the details modal's field names.
    insLocation: row.insurance?.location ?? "",
    insInsurerName: row.insurance?.insuranceName ?? "",
    insAreaName: row.insurance?.areaName ?? "",
    insPincode: row.insurance?.pincode ?? "",
    insCity: row.insurance?.city ?? "",
    insClaimNo: row.insurance?.claimNo ?? "",
    insGstin: row.insurance?.gstinNumber ?? "",
    insPolicyNo: row.insurance?.policyNo ?? "",
    insExpiryDate: row.insurance?.expiryDate ?? "",
    permitDue: row.otherDetails?.permitDue ?? "",
    taxDue: row.otherDetails?.taxDue ?? "",
    contranceFlag: row.otherDetails?.contranceFlag ?? "",
    fcRenewalDate: row.otherDetails?.fcRenewalDate ?? "",
    hyplotication: row.otherDetails?.hypothecationAmount ?? "",
  };
}

export default function Customers() {
  const {
    canCreate,
    canUpdate: canEdit,
    canDelete,
    canRead,
  } = usePagePermissions();

  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");

  const [activeTerm, setActiveTerm] = useState("");
  const [searchState, setSearchState] = useState("idle");
  const [isSearching, setIsSearching] = useState(false);
  const [quickAddValue, setQuickAddValue] = useState(emptyQuickAddForm);
  const [matchedId, setMatchedId] = useState(null);
  const searchTimerRef = useRef(null);

  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const [detailsTarget, setDetailsTarget] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const loadCustomers = useCallback(async (term = "") => {
    setIsLoading(true);
    if (term) setIsSearching(true);
    try {
      const response = await customerApi.list({
        limit: PAGE_LIMIT,
        offset: 0,
        searchKey: term,
      });
      const rows = extractList(response, customerApi.listKey).map(
        mapCustomerRow,
      );
      setCustomers(rows);

      if (!term) {
        setSearchState("idle");
        setQuickAddValue(emptyQuickAddForm);
        setMatchedId(null);
        return;
      }

      const found = rows[0];
      if (found) {
        setQuickAddValue({
          name: found.name,
          mobile: found.mobile,
          pincode: found.pincode,
          address: found.address,
          regNo: found.regNo,
          make: found.make,
          model: found.model,
          fuel: found.fuel || DEFAULT_FUEL_TYPE,
        });
        setMatchedId(found.id);
        setSearchState("found");
      } else {
        // Nothing matched - prefill only the mobile if they typed one.
        setQuickAddValue({
          ...emptyQuickAddForm,
          mobile: /^\d+$/.test(term) ? term : "",
        });
        setMatchedId(null);
        setSearchState("not-found");
      }
    } catch {
      showToast.error(term ? "Search failed." : "Failed to load customers.");
      setCustomers([]);
      if (term) setSearchState("not-found");
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, []);

  function openView(row) {
    setViewTarget(row);
    setIsViewOpen(true);
  }
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setActiveTerm(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  // The single fetch: once on mount with "", then on each settled term.
  useEffect(() => {
    loadCustomers(activeTerm);
  }, [activeTerm, loadCustomers]);

  const sorted = useMemo(() => {
    if (!sortKey) return customers;
    return [...customers].sort((a, b) => {
      const result = String(a[sortKey] ?? "").localeCompare(
        String(b[sortKey] ?? ""),
      );
      return sortDir === "asc" ? result : -result;
    });
  }, [customers, sortKey, sortDir]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    pageItems,
  } = usePagination(sorted);

  function handleSortChange(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function resetQuickAdd() {
    setSearchQuery("");
    setActiveTerm("");
    setSearchState("idle");
    setQuickAddValue(emptyQuickAddForm);
    setMatchedId(null);
  }

  async function handleQuickAddSubmit(values, matched) {
    const existing = matched ?? (matchedId ? { customerId: matchedId } : null);
    try {
      let response;
      if (existing?.customerId) {
        response = await customerApi.updateDetails({
          customerId: existing.customerId,
          vehicleId: existing.vehicleId,
          name: values.name,
          mobileNumber: values.mobile,
          pinCode: values.pincode,
          address1: values.address,
          customerCategory: "",
          state: "",
          city: "",
          registrationNumber: values.regNo,
          makeId: values.makeId,
          modelId: values.modelId,
          fuelType: values.fuel,
          chassisNumber: "",
          engineNumber: "",
          manufacturingYear: "",
          insurance: {},
          otherDetails: {},
        });
        showToast.success(
          responseMessage(response, "Customer updated successfully."),
        );
      } else {
        await customerApi.quickAdd({
          name: values.name,
          mobileNumber: values.mobile,
          pinCode: values.pincode,
          address1: values.address,
          registrationNumber: values.regNo,
          makeId: values.makeId,
          modelId: values.modelId,
          fuelType: values.fuel,
        });
        showToast.success(
          responseMessage(response, "Customer added successfully."),
        );
      }
      resetQuickAdd();
      loadCustomers("");
    } catch (err) {
      showToast.error(
        err.message ||
          (existing?.customerId
            ? "Couldn't update customer."
            : "Couldn't add customer."),
      );
    }
  }

  function openDetails(customer) {
    setDetailsTarget(customer);
    setIsDetailsOpen(true);
  }

  function handleDetailsSubmit() {
    setIsDetailsOpen(false);
    loadCustomers(activeTerm);
  }

  async function handleDeleteConfirm() {
    try {
      const response = await customerApi.remove({
        customerId: deleteTarget.id,
      });
      showToast.success(responseMessage(response, "Customer deleted."));
      setDeleteTarget(null);
      loadCustomers(activeTerm);
    } catch (err) {
      showToast.error(err.message || "Couldn't delete customer.");
    }
  }

  const columns = [
    { key: "name", header: "Name", sortable: true },
    {
      key: "mobile",
      header: "Mobile",
      sortable: true,
      render: (row) => (row.mobile ? row.mobile : "-"),
    },
    { key: "pincode", header: "Pincode", sortable: true },
    {
      key: "address",
      header: "Address",
      render: (row) => (
        <span title={row.address}>{truncate(row.address, 32) || "-"}</span>
      ),
    },
    { key: "regNo", header: "Reg.No.", sortable: true },
    { key: "make", header: "Make", sortable: true },
    { key: "model", header: "Model", sortable: true },
    { key: "fuel", header: "Fuel", sortable: true },
    ...(canEdit || canDelete
      ? [
          {
            key: "action",
            header: "Action",
            render: (row) => (
              <div className="flex items-center ">
                {canRead && (
                  <IconAction
                    icon={Eye}
                    label={`View ${row.name}`}
                    onClick={() => openView(row)}
                    tone="brand"
                  />
                )}

                {canEdit && (
                  <IconAction
                    icon={Pencil}
                    label={`Edit ${row.name}`}
                    onClick={() => openDetails(row)}
                    tone="edit"
                  />
                )}

                {canDelete && (
                  <IconAction
                    icon={Trash2}
                    label={`Delete ${row.name}`}
                    onClick={() => setDeleteTarget(row)}
                    tone="danger"
                  />
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink-800">
          Customer &amp; Vehicle Details
        </h1>
      </div>

      <Card className="space-y-4">
        <CustomerSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={() => setActiveTerm(searchQuery.trim())}
          isSearching={isSearching}
        />

        {searchState !== "idle" && (
          <p
            className={
              searchState === "found"
                ? "text-sm font-semibold text-brand-700"
                : "text-sm font-semibold text-danger-500"
            }
          >
            {searchState === "found"
              ? "Search Results"
              : "Search Results not found enter manually"}
          </p>
        )}

        {canCreate && (
          <CustomerQuickAddForm
            value={quickAddValue}
            onSubmit={handleQuickAddSubmit}
          />
        )}
      </Card>

      <Card padded={false}>
        <Table
          columns={columns}
          data={pageItems}
          isLoading={isLoading}
          sortKey={sortKey}
          sortDirection={sortDir}
          onSortChange={handleSortChange}
          emptyTitle="No customers found"
          emptyDescription="Search by mobile or reg. no. above, or add your first customer."
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

      <CustomerDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onSubmit={handleDetailsSubmit}
        customer={detailsTarget}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete customer"
        description={`Are you sure you want to delete ${deleteTarget?.name}? This can't be undone.`}
      />
      <CustomerVehiclesModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        customer={viewTarget}
      />
    </div>
  );
}
