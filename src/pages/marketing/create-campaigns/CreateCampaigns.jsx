import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronUp, ChevronDown, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import RecommendedServiceSelector from '@/components/marketing/RecommendedServiceSelector';
import CampaignTemplateCard from '@/components/marketing/CampaignTemplateCard';
import CreateTemplateModal from '@/components/marketing/CreateTemplateModal';
import { useTemplates } from '@/hooks/useTemplates';
import { usePagePermissions } from '@/hooks/usePagePermissions';
import { campaignApi } from '@/services/api/campaignApi';
import { showToast } from '@/utils/toast';

function TemplatePagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const delta = 1;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      pages.push(i);
    }
  }

  const withDots = [];
  let previous;
  for (const p of pages) {
    if (previous !== undefined) {
      if (p - previous === 2) {
        withDots.push(previous + 1);
      } else if (p - previous > 1) {
        withDots.push('…');
      }
    }
    withDots.push(p);
    previous = p;
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-3 border-t border-ink-100">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        aria-label="Previous template page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {withDots.map((n, i) =>
        n === '…' ? (
          <span key={`dots-${i}`} className="px-1.5 text-sm text-ink-400">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onPageChange(n)}
            disabled={n === page}
            aria-current={n === page ? 'page' : undefined}
            className={`flex h-8 min-w-8 items-center justify-center cursor-pointer rounded-md px-2 text-sm font-medium transition-colors disabled:cursor-default ${
              n === page ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'
            }`}
          >
            {n}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="flex h-8 w-8 items-center cursor-pointer justify-center rounded-md text-ink-500 hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next template page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function mapCustomerRow(row) {
  const customerName =
    row.customerName?.trim() ||
    row.name?.trim() ||
    [row.firstName, row.lastName].filter(Boolean).join(' ').trim() ||
    '';

  return {
    id: row.id ?? row.customerId,
    customerId: row.customerId ?? row.id,
    name: customerName,
    customerName,
    firstName: row.firstName || '',
    lastName: row.lastName || '',
    mobileNumber: row.mobileNumber || '',
    customerCode: row.customerCode || '',
    outletId: row.outletId ?? null,
    vehicleNo: row.vehicleNo || null,
    last_service_date: row.last_service_date || null,
    next_service_date: row.next_service_date || null,
    productType: row.productType || null,
    recommended: row.recommended || null,
  };
}

export default function CreateCampaigns() {
  const { canCreate = true, canUpdate = true, canDelete = true } = usePagePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  const [constants, setConstants] = useState({
    services: [],
    ALLOWED_PLACEHOLDERS: [],
    LIMITS: { title: 100, content: 1024, footer: 60 },
  });

  useEffect(() => {
    campaignApi
      .getConstants()
      .then((data) => {
        if (data) {
          setConstants(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load campaign constants:', err);
      });
  }, []);


  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  const initialPage = !isNaN(urlPage) && urlPage >= 1 ? urlPage : 1;

  const urlLimit = parseInt(searchParams.get('limit') || '10', 10);
  const initialLimit = !isNaN(urlLimit) && urlLimit >= 1 && urlLimit <= 100 ? urlLimit : 10;

  const initialSearch = searchParams.get('search') || '';
  const initialExpandedId = searchParams.get('cid') || '';
  const urlService = searchParams.get('service') || '';
  const urlTplId = searchParams.get('tid') || '';
  const urlTplPage = parseInt(searchParams.get('tpage') || '1', 10);
  const initialTplPage = !isNaN(urlTplPage) && urlTplPage >= 1 ? urlTplPage : 1;

  const [customerPage, setCustomerPage] = useState(initialPage);
  const [customerLimit, setCustomerLimit] = useState(initialLimit);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeSearch, setActiveSearch] = useState(initialSearch);
  const searchTimerRef = useRef(null);

  const [expandedCustomerId, setExpandedCustomerId] = useState(initialExpandedId);
  const [selectedServiceId, setSelectedServiceId] = useState(urlService);
  const [selectedTemplateId, setSelectedTemplateId] = useState(urlTplId);

  useEffect(() => {
    if (!selectedServiceId && constants.services?.length > 0) {
      setSelectedServiceId(constants.services[0].id);
    }
  }, [constants.services, selectedServiceId]);

  const [tplPage, setTplPage] = useState(initialTplPage);
  const tplLimit = 3;

  const [customers, setCustomers] = useState([]);
  const [customersTotal, setCustomersTotal] = useState(0);
  const [customersTotalPages, setCustomersTotalPages] = useState(1);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [customerError, setCustomerError] = useState(null);

  const {
    items: templates,
    pagination: tplPagination,
    loading: isLoadingTemplates,
    error: templateError,
    refetch: refetchTemplates,
    handleCreated,
    handleUpdated,
    handleDeleted,
  } = useTemplates(tplPage, tplLimit);

  const [previewData, setPreviewData] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [previewError, setPreviewError] = useState(null);
  const previewReqIdRef = useRef(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTemplateTarget, setEditTemplateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);
  const createButtonRef = useRef(null);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setActiveSearch(searchQuery.trim());
      setCustomerPage(1);
    }, 400);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  const updateUrlParams = useCallback(() => {
    const nextParams = new URLSearchParams();
    if (customerPage > 1) nextParams.set('page', String(customerPage));
    if (customerLimit !== 10) nextParams.set('limit', String(customerLimit));
    if (activeSearch) nextParams.set('search', activeSearch);
    if (expandedCustomerId) nextParams.set('cid', expandedCustomerId);
    if (selectedServiceId) nextParams.set('service', selectedServiceId);
    if (selectedTemplateId) nextParams.set('tid', selectedTemplateId);
    if (tplPage > 1) nextParams.set('tpage', String(tplPage));

    setSearchParams(nextParams, { replace: true });
  }, [
    customerPage,
    customerLimit,
    activeSearch,
    expandedCustomerId,
    selectedServiceId,
    selectedTemplateId,
    tplPage,
    setSearchParams,
  ]);

  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

  const loadCustomers = useCallback(async (term = '') => {
    setIsLoadingCustomers(true);
    setCustomerError(null);
    try {
      // Old API call (Customer Master V1):
      const response = await campaignApi.getCustomers({
        page: customerPage,
        limit: customerLimit,
        search: term,
      });


      const rawRows = response?.data || [];
      const rows = rawRows.map(mapCustomerRow);
      const total = response?.pagination?.total ?? rows.length;
      const totalPages = response?.pagination?.totalPages ?? (Math.ceil(total / customerLimit) || 1);
      setCustomers(rows);
      setCustomersTotal(total);
      setCustomersTotalPages(totalPages);
    } catch (err) {
      setCustomerError(err?.message || 'Failed to load customers.');
      setCustomers([]);
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [customerPage, customerLimit]);

  useEffect(() => {
    loadCustomers(activeSearch);
  }, [activeSearch, loadCustomers]);

  useEffect(() => {
    if (!expandedCustomerId || !selectedTemplateId || !selectedServiceId) {
      setPreviewData(null);
      setPreviewError(null);
      setIsPreviewLoading(false);
      return;
    }

    const currentReqId = ++previewReqIdRef.current;
    setIsPreviewLoading(true);
    setPreviewError(null);

    campaignApi
      .previewTemplate(selectedTemplateId, {
        customerId: expandedCustomerId,
        serviceType: selectedServiceId,
      })
      .then((data) => {
        if (previewReqIdRef.current !== currentReqId) return;
        setPreviewData(data);
        setPreviewError(null);
        setIsPreviewLoading(false);
      })
      .catch((err) => {
        if (previewReqIdRef.current !== currentReqId) return;
        setIsPreviewLoading(false);
        setPreviewData(null);
        setPreviewError(err?.message || 'Failed to generate message preview.');
        if (err.status === 404) {
          setSelectedTemplateId('');
          showToast.error('Selected template or customer is no longer available.');
        } else {
          showToast.error(err?.message || 'Failed to generate template preview.');
        }
      });
  }, [
    expandedCustomerId,
    selectedTemplateId,
    selectedServiceId,
    previewVersion,
  ]);

  useEffect(() => {
    if (selectedTemplateId && !isLoadingTemplates && templates.length > 0) {
      const existsInCurrent = templates.some((t) => String(t.id) === String(selectedTemplateId));
      if (!existsInCurrent && tplPage === 1) {
        campaignApi
          .getTemplateById(selectedTemplateId)
          .catch((err) => {
            if (err.status === 404) {
              setSelectedTemplateId('');
              setPreviewData(null);
              showToast.info('Selected template is no longer available.');
            }
          });
      }
    }
  }, [selectedTemplateId, isLoadingTemplates, templates, tplPage]);

  const toggleExpandCustomer = (id) => {
    setExpandedCustomerId((prev) => (String(prev) === String(id) ? '' : String(id)));
  };

  const handleToggleService = (id) => {
    setSelectedServiceId(id);
  };

  const handleToggleTemplate = (id) => {
    setSelectedTemplateId((prev) => (String(prev) === String(id) ? '' : String(id)));
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
      handleUpdated(savedTemplate);
      setPreviewVersion((v) => v + 1);
    } else {
      handleCreated(savedTemplate, {
        currentSelectedId: selectedTemplateId,
        onSelect: setSelectedTemplateId,
        setPage: setTplPage,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || isDeleting) return;
    const targetId = deleteTarget.id;
    setIsDeleting(true);
    try {
      await campaignApi.deleteTemplate(targetId);
      showToast.success('Template deleted successfully.');
      handleDeleted(targetId, {
        currentSelectedId: selectedTemplateId,
        onClearSelection: () => {
          setSelectedTemplateId('');
          setPreviewData(null);
        },
        setPage: setTplPage,
      });
      setDeleteTarget(null);
    } catch (err) {
      showToast.error(err.message || 'Failed to delete template.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendMessage = async (customer) => {
    if (isSending || isSendingRef.current) return;

    if (previewError) {
      showToast.error('Cannot send message when preview is unavailable.');
      return;
    }

    if (!customer?.id && !customer?.customerId) {
      showToast.error('Please select a customer first.');
      return;
    }

    if (!selectedServiceId) {
      showToast.error('Please select a service category first.');
      return;
    }

    if (!selectedTemplateId) {
      showToast.error('Please select a campaign template before sending.');
      return;
    }

    const cId = customer.id || customer.customerId;

    isSendingRef.current = true;
    setIsSending(true);
    try {
      await campaignApi.sendCampaign({
        customerId: cId,
        templateId: selectedTemplateId,
        serviceType: selectedServiceId,
      });
      showToast.success(
        `Campaign message saved as pending for ${customer.name || customer.customerName || 'customer'}.`
      );
    } catch (err) {
      if (err.status === 409) {
        showToast.error('A duplicate campaign message was recently queued for this customer and template.');
      } else {
        showToast.error(err.message || 'Failed to save campaign message.');
      }
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  const activeServiceOption =
    constants.services?.find((s) => s.id === selectedServiceId) ||
    constants.services?.[0] || { title: '' };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Create Campaigns
          </h1>
          <p className="mt-0.5 text-xs text-ink-500">
            Select a customer and campaign template to share service updates.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, mobile or customer code..."
            aria-label="Search customers"
            className="w-full rounded-xl border border-ink-200 bg-white py-2 pl-9 pr-3 text-xs text-ink-800 placeholder-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-2xs">
        {isLoadingCustomers ? (
          <div className="flex flex-col items-center justify-center py-20 text-ink-500 space-y-2">
            <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
            <span className="text-xs">Loading customers…</span>
          </div>
        ) : customerError ? (
          <ErrorState
            title="Failed to load customers"
            description={customerError}
            onRetry={() => loadCustomers(activeSearch)}
          />
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description={
              activeSearch
                ? `No results match "${activeSearch}". Try another search term.`
                : 'No customers available for campaigns at this time.'
            }
          />
        ) : (
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
                {customers.map((customer, index) => {
                  const cId = customer.id || customer.customerId || `cust-${index}`;
                  const isExpanded = String(expandedCustomerId) === String(cId);

                  return (
                    <tr key={cId} className="group">
                      <td colSpan={6} className="p-0">
                        <div
                          onClick={() => toggleExpandCustomer(cId)}
                          className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-colors ${isExpanded
                              ? 'bg-brand-50/30 font-semibold'
                              : 'hover:bg-ink-50/40'
                            }`} >
                          <div className="grid grid-cols-6 w-full items-center text-xs">
                            <div className="font-bold text-ink-900 pr-4">
                              {customer.name || customer.customerName || '-'}
                            </div>
                            <div className="font-semibold text-ink-800 tracking-wide pr-4">
                              {customer.vehicleNo || '-'}
                            </div>
                            <div className="font-medium text-ink-700 pr-4">
                              {customer.last_service_date || customer.next_service_date
                                ? `${customer.last_service_date || '-'} / ${customer.next_service_date || '-'}`
                                : '-'}
                            </div>
                            <div className="font-medium text-ink-700 pr-4">
                              {customer.productType || '-'}
                            </div>
                            <div className="font-normal text-ink-600 max-w-xs pr-4 leading-relaxed">
                              {customer.recommended || '-'}
                            </div>
                            <div className="flex justify-center text-ink-600">
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-ink-100 transition-colors cursor-pointer"
                                aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
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

                        {isExpanded && (
                          <div className="relative border-t border-b border-brand-100 bg-ink-50/30 p-6 space-y-6 animate-in fade-in-50 duration-200">
                            {constants.services?.length > 0 && (
                              <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-2xs space-y-4">
                                <RecommendedServiceSelector
                                  services={constants.services}
                                  selectedId={selectedServiceId}
                                  onSelect={handleToggleService}
                                />
                              </div>
                            )}

                            <div className="space-y-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <h3 className="text-base font-bold text-ink-900">
                                    Templates {activeServiceOption.title ? `(${activeServiceOption.title})` : ''}
                                  </h3>
                                  <p className="text-xs text-ink-500">
                                    Select a template to preview personalized details and dispatch to customer
                                  </p>
                                </div>

                                {canCreate && (
                                  <Button
                                    ref={createButtonRef}
                                    onClick={handleOpenCreateModal}
                                    type="button"
                                    variant="primaryDark"
                                  >
                                    Create Template
                                  </Button>
                                )}
                              </div>

                              {isLoadingTemplates ? (
                                <div className="flex flex-col items-center justify-center py-12 text-ink-400 space-y-2">
                                  <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
                                  <span className="text-xs">Loading templates…</span>
                                </div>
                              ) : templateError ? (
                                <ErrorState
                                  title="Failed to load templates"
                                  description={templateError}
                                  onRetry={refetchTemplates}
                                />
                              ) : templates.length === 0 ? (
                                <EmptyState
                                  title="No templates available"
                                  description="Create your first campaign template using the button above."
                                />
                              ) : (
                                <>
                                  <div
                                    role="radiogroup"
                                    aria-label="Campaign Templates"
                                    className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                                  >
                                    {templates.map((tpl) => (
                                      <CampaignTemplateCard
                                        key={tpl.id}
                                        template={tpl}
                                        isSelected={String(tpl.id) === String(selectedTemplateId)}
                                        previewData={
                                          String(tpl.id) === String(selectedTemplateId)
                                            ? previewData
                                            : null
                                        }
                                        isPreviewLoading={
                                          String(tpl.id) === String(selectedTemplateId) &&
                                          isPreviewLoading
                                        }
                                        previewError={
                                          String(tpl.id) === String(selectedTemplateId)
                                            ? previewError
                                            : null
                                        }
                                        onSelect={handleToggleTemplate}
                                        onEdit={handleOpenEditModal}
                                        onDelete={setDeleteTarget}
                                        canEdit={canUpdate}
                                        canDelete={canDelete}
                                      />
                                    ))}
                                  </div>

                                  {previewError && selectedTemplateId && (
                                    <div role="alert" className="mt-2 rounded-xl border border-danger-200 bg-danger-50/70 p-3 text-xs text-danger-700">
                                      <span className="font-semibold">Preview Notice:</span> {previewError}
                                    </div>
                                  )}

                                  {tplPagination.totalPages > 1 && (
                                    <TemplatePagination
                                      page={tplPagination.page}
                                      totalPages={tplPagination.totalPages}
                                      onPageChange={setTplPage}
                                    />
                                  )}
                                </>
                              )}

                              {canCreate && (
                                <div className="flex justify-end pt-3">
                                  <Button
                                    onClick={() => handleSendMessage(customer)}
                                    type="button"
                                    disabled={!selectedTemplateId || isSending || isPreviewLoading || Boolean(previewError)}
                                    isLoading={isSending}
                                    variant="primary"
                                  >
                                    Send Message
                                  </Button>
                                </div>
                              )}
                            </div>

                            <CreateTemplateModal
                              isOpen={isModalOpen}
                              onClose={() => setIsModalOpen(false)}
                              onSave={handleSaveTemplate}
                              editTemplate={editTemplateTarget}
                              triggerRef={createButtonRef}
                              allowedPlaceholders={constants.ALLOWED_PLACEHOLDERS || []}
                              limits={constants.LIMITS || { title: 100, content: 1024, footer: 60 }}
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
        )}

        {!isLoadingCustomers && !customerError && customersTotal > 0 && (
          <Pagination
            page={customerPage}
            totalPages={customersTotalPages}
            totalItems={customersTotal}
            pageSize={customerLimit}
            onPageChange={setCustomerPage}
            onPageSizeChange={(newLimit) => {
              setCustomerLimit(newLimit);
              setCustomerPage(1);
            }}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete template"
        description={`Are you sure you want to delete this template?`}
        isLoading={isDeleting}
      />
    </div>
  );
}
