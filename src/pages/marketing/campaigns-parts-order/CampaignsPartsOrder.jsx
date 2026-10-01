import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { ConfirmModal } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import PartsCategorySelector from "@/components/marketing/PartsCategorySelector";
import CampaignTemplateCard from "@/components/marketing/CampaignTemplateCard";
import CreateTemplateModal from "@/components/marketing/CreateTemplateModal";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { showToast } from "@/utils/toast";

import {
  initialCategories,
  initialSubCategories,
  initialPartsCampaignTemplates,
} from "../mockPartsOrder";

export default function CampaignsPartsOrder() {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();

  const [isPartsExpanded, setIsPartsExpanded] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState([]);

  const [templates, setTemplates] = useState(initialPartsCampaignTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Modal / Panel State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTemplateTarget, setEditTemplateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleCategory = (catId) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId],
    );
  };

  const handleToggleSubCategory = (subId) => {
    setSelectedSubCategoryIds((prev) =>
      prev.includes(subId)
        ? prev.filter((id) => id !== subId)
        : [...prev, subId],
    );
  };

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
      showToast.success("Parts order template updated successfully.");
    } else {
      setTemplates((prev) => [savedTemplate, ...prev]);
      setSelectedTemplateId(savedTemplate.id);
      showToast.success("New parts order template created.");
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    setSelectedTemplateId((prev) => (prev === deleteTarget.id ? "" : prev));
    showToast.success("Parts order template deleted.");
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const handleSendMessage = () => {
    if (
      selectedCategoryIds.length === 0 &&
      selectedSubCategoryIds.length === 0
    ) {
      showToast.error("Please select at least one Category or Sub-Category.");
      return;
    }
    if (!selectedTemplateId) {
      showToast.error("Please select a Parts Order Template before sending.");
      return;
    }

    showToast.success("Parts order campaign message dispatched successfully!");
  };

  const handleToggleTemplate = (id) => {
    setSelectedTemplateId((prev) => (prev === id ? "" : id));
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Create Campaigns - Parts Order
        </h1>
      </div>

      {/* Recommended Parts Container */}
      <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-ink-100/60">
          <h2 className="text-sm font-bold text-ink-900">Recommended Parts</h2>

          <button
            onClick={() => setIsPartsExpanded((v) => !v)}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <span>{isPartsExpanded ? "View Less" : "View All"}</span>
            {isPartsExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 stroke-[2.5]" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 stroke-[2.5]" />
            )}
          </button>
        </div>

        {isPartsExpanded && (
          <div className="pt-2 animate-in fade-in-50 duration-200">
            <PartsCategorySelector
              categories={initialCategories}
              selectedCategoryIds={selectedCategoryIds}
              onToggleCategory={handleToggleCategory}
              subCategories={initialSubCategories}
              selectedSubCategoryIds={selectedSubCategoryIds}
              onToggleSubCategory={handleToggleSubCategory}
            />
          </div>
        )}
      </div>

      {/* Created Parts Order Campaign Section */}
      <div className="relative space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-ink-900">
              Created Parts Order Campaign
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

        {/* Create / Edit Template Panel Anchored Inside Section */}
        <CreateTemplateModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTemplate}
          editTemplate={editTemplateTarget}
        />
      </div>
      {canCreate && (
        <div className="flex justify-end pt-2">
          <Button onClick={handleSendMessage} type="button">
            Send Message
          </Button>
        </div>
      )}

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
