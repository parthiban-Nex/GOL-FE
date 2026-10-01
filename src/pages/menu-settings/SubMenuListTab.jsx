import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Search } from "lucide-react";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useServerTable } from "@/hooks/useServerTable";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { menuApi } from "@/services";
import AddSubMenuForm from "./AddSubMenuForm";

const SEARCH_DEBOUNCE_MS = 400;

const columns = [
  { key: "title", header: "Title" },
  { key: "path", header: "Path" },
];

/** SubMenu master - independent records, attached to a parent Menu (and
 * to a role's button permissions) in "Role Menu Setting", matching the
 * reference backend's model. */
export default function SubMenuListTab() {
  const { canCreate, canUpdate } = usePagePermissions();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const searchTimerRef = useRef(null);

  const list = useCallback((body) => menuApi.listSubMenus(body), []);
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
    refetch,
  } = useServerTable(list, menuApi.subMenuListKey);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      search(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchInput, search]);

  // No delete column - the underlying api never defines remove(), same as
  // the original MasterCrudPage usage (canDelete && api.remove gated it
  // out there too).
  const tableColumns = [
    ...columns,
    ...(canUpdate
      ? [
          {
            key: "action",
            header: "Action",
            render: (row) => (
              <div className="flex items-center gap-3">
                <button
                  className="cursor-pointer text-brand-500 hover:text-brand-700"
                  aria-label={`Edit ${row.title}`}
                  onClick={() => setEditTarget(row)}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-ink-800">SubMenus</h1>
        </div>
        {canCreate && (
          <Button icon={Plus} onClick={() => setIsAddOpen(true)}>
            Add SubMenu
          </Button>
        )}
      </div>

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
          columns={tableColumns}
          data={rows}
          isLoading={isLoading}
          getRowId={(row) => row.id}
          emptyTitle="No submenus found"
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

      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add SubMenu"
      >
        <AddSubMenuForm
          onCancel={() => setIsAddOpen(false)}
          onCreated={() => {
            setIsAddOpen(false);
            refetch();
          }}
        />
      </Modal>

      <Modal
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Edit SubMenu"
      >
        <AddSubMenuForm
          subMenu={editTarget}
          onCancel={() => setEditTarget(null)}
          onCreated={() => {
            setEditTarget(null);
            refetch();
          }}
        />
      </Modal>
    </div>
  );
}
