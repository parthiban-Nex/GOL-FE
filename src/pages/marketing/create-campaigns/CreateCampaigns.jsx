import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { ConfirmModal } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import RecommendedServiceSelector from "@/components/marketing/RecommendedServiceSelector";
import CampaignTemplateCard from "@/components/marketing/CampaignTemplateCard";
import CreateTemplateModal from "@/components/marketing/CreateTemplateModal";
import { usePagination } from "@/hooks/usePagination";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { showToast } from "@/utils/toast";

import {
  mockCustomersList,
  recommendedServices,
  initialCampaignTemplates,
} from "../mockMarketing";

export default function CreateCampaigns() {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();

  const [expandedCustomerId, setExpandedCustomerId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [templates, setTemplates] = useState(initialCampaignTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Pagination hook
  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    pageItems,
  } = usePagination(mockCustomersList, 5);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTemplateTarget, setEditTemplateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreateModal = () => {
    setEditTemplateTarget(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (template) => {
    setEditTemplateTarget(template);
    setIsModalOpen(true);
  };

  const handleSaveTemplate = (savedTemplate) => {
    if (editTemplateTarget) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === savedTemplate.id ? savedTemplate : t)),
      );
      showToast.success("Campaign template updated successfully.");
    } else {
      setTemplates((prev) => [savedTemplate, ...prev]);
      setSelectedTemplateId(savedTemplate.id);
      showToast.success("New campaign template created.");
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    setSelectedTemplateId((prev) => (prev === deleteTarget.id ? "" : prev));
    showToast.success("Campaign template deleted.");
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const handleSendMessage = (customer) => {
    // 1. Check if a Recommended Service is selected
    if (!selectedServiceId) {
      showToast.error("Please select a Recommended Service category first.");
      return;
    }

    // 2. Check if a Template is selected
    if (!selectedTemplateId) {
      showToast.error("Please select a Campaign Template before sending.");
      return;
    }

    // 3. Success Toast
    showToast.success(
      `Campaign message dispatched to ${customer.customerName} (${customer.vehicleNo})!`,
    );
  };

  const toggleExpandCustomer = (id) => {
    setExpandedCustomerId((prev) => (prev === id ? null : id));
  };

  const handleToggleTemplate = (id) => {
    setSelectedTemplateId((prev) => (prev === id ? "" : id));
  };

  const handleToggleService = (id) => {
    setSelectedServiceId((prev) => (prev === id ? "" : id));
  };

  const activeService =
    recommendedServices.find((s) => s.id === selectedServiceId) ||
    recommendedServices[0];

  return (
    <div className="space-y-6 pb-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Create Campaigns
        </h1>
      </div>

      {/* Customer List Table Container */}
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
            <tbody className="divide-y divide-ink-100/70">
              {pageItems.map((customer) => {
                const isExpanded = expandedCustomerId === customer.id;

                return (
                  <tr key={customer.id} className="group">
                    <td colSpan={6} className="p-0">
                      {/* Parent Customer Line Item Row */}
                      <div
                        onClick={() => toggleExpandCustomer(customer.id)}
                        className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-colors ${
                          isExpanded
                            ? "bg-brand-50/30 font-semibold"
                            : "hover:bg-ink-50/40"
                        }`}
                      >
                        <div className="grid grid-cols-6 w-full items-center text-xs">
                          <div className="font-bold text-ink-900 pr-4">
                            {customer.customerName}
                          </div>
                          <div className="font-semibold text-ink-800 tracking-wide pr-4">
                            {customer.vehicleNo}
                          </div>
                          <div className="font-medium text-ink-700 pr-4">
                            {customer.serviceDates}
                          </div>
                          <div className="font-medium text-ink-700 pr-4">
                            {customer.productType}
                          </div>
                          <div className="font-normal text-ink-600 max-w-xs pr-4 leading-relaxed">
                            {customer.recommended}
                          </div>
                          <div className="flex justify-center text-ink-600">
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-ink-100 transition-colors cursor-pointer"
                              aria-label="Toggle campaign selection"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 stroke-[2.5]" />
                              ) : (
                                <ChevronDown className="h-4 w-4 stroke-[2.5]" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Section: Recommended Services + Templates Grid */}
                      {isExpanded && (
                        <div className="relative border-t border-b border-brand-100 bg-ink-50/30 p-6 space-y-6 animate-in fade-in-50 duration-200">
                          {/* Recommended Service Pills */}
                          <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-2xs space-y-4">
                            <RecommendedServiceSelector
                              services={recommendedServices}
                              selectedId={selectedServiceId}
                              onSelect={handleToggleService}
                            />
                          </div>

                          {/* Created Templates Header & Grid */}
                          <div className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <h3 className="text-base font-bold text-ink-900">
                                  Created {activeService.title} Templates
                                </h3>
                                <p className="text-xs text-ink-500">
                                  Select template to share it to customer
                                </p>
                              </div>

                              {canCreate && (
                                <Button
                                  onClick={handleOpenCreateModal}
                                  type="button"
                                  variant="primaryDark"
                                >
                                  Create Templates
                                </Button>
                              )}
                            </div>

                            {/* Templates Grid (3 Columns) */}
                            <div className="grid grid-cols-1 gap-4.5 md:grid-cols-2 lg:grid-cols-3">
                              {templates.map((tpl) => (
                                <CampaignTemplateCard
                                  key={tpl.id}
                                  template={tpl}
                                  isSelected={tpl.id === selectedTemplateId}
                                  onSelect={handleToggleTemplate}
                                  onEdit={handleOpenEditModal}
                                  onDelete={setDeleteTarget}
                                  canEdit={canUpdate}
                                  canDelete={canDelete}
                                />
                              ))}
                            </div>

                            {/* Send Message Button */}
                            {canCreate && (
                              <div className="flex justify-end pt-2">
                                <Button
                                  onClick={() => handleSendMessage(customer)}
                                  type="button"
                                >
                                  Send Message
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Create / Edit Template Panel Anchored Inside Expanded Section */}
                          <CreateTemplateModal
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            onSave={handleSaveTemplate}
                            editTemplate={editTemplateTarget}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete template"
        description={`Are you sure you want to delete "${deleteTarget?.title ?? "this template"}"? This can't be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
