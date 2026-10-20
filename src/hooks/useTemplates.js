import { useState, useEffect, useCallback, useRef } from 'react';
import { campaignApi } from '@/services/api/campaignApi';

export function useTemplates(page = 1, limit = 3) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 3, total: 0, totalPages: 1, hasNext: false, hasPrev: false,});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeControllerRef = useRef(null);

  const fetchTemplates = useCallback(
    (targetPage = page, targetLimit = limit) => {
      // Abort previous in-flight request so stale response never overwrites newer
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
      const controller = new AbortController();
      activeControllerRef.current = controller;

      setLoading(true);
      setError(null);

      campaignApi
        .getTemplates(
          { page: targetPage, limit: targetLimit },
          { signal: controller.signal }
        )
        .then((response) => {
          setItems(response.data || []);
          if (response.pagination) {
            setPagination(response.pagination);
          }
          setLoading(false);
          setError(null);
        })
        .catch((err) => {
          if ( err.code === 'ERR_CANCELED' || err.name === 'CanceledError' || err.name === 'AbortError'  ) {
            return; 
          }
          setLoading(false);
          setError(err.message || 'Failed to load templates.');
        });
    },
    [page, limit]
  );

  useEffect(() => {
    fetchTemplates(page, limit);
    return () => {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
    };
  }, [fetchTemplates, page, limit]);

  const handleCreated = useCallback(
    (savedTemplate, { currentSelectedId, onSelect, setPage }) => {
      if (!savedTemplate) return;

      if (page !== 1) {
        setPage(1);
      } else {
        setItems((prev) => {
          const filtered = prev.filter((t) => String(t.id) !== String(savedTemplate.id));
          return [savedTemplate, ...filtered].slice(0, limit);
        });
        setPagination((prev) => {
          const newTotal = prev.total + 1;
          const newTotalPages = Math.ceil(newTotal / limit) || 1;
          return {
            ...prev,
            total: newTotal,
            totalPages: newTotalPages,
            hasNext: page < newTotalPages,
          };
        });
      }

      if (!currentSelectedId && onSelect) {
        onSelect(savedTemplate.id);
      }
    },
    [page, limit]
  );

  const handleUpdated = useCallback((updatedTemplate) => {
    if (!updatedTemplate) return;
    setItems((prev) =>
      prev.map((t) =>
        String(t.id) === String(updatedTemplate.id) ? { ...t, ...updatedTemplate } : t
      )
    );
  }, []);

  const handleDeleted = useCallback(
    (deletedId, { currentSelectedId, onClearSelection, setPage } = {}) => {
      if (!deletedId) return;

      if (String(currentSelectedId) === String(deletedId) && onClearSelection) {
        onClearSelection();
      }

      setItems((prev) => prev.filter((t) => String(t.id) !== String(deletedId)));

      const newTotal = Math.max(0, pagination.total - 1);
      const newTotalPages = Math.ceil(newTotal / limit) || 1;

      setPagination((prev) => ({
        ...prev,
        total: newTotal,
        totalPages: newTotalPages,
      }));

      const remainingCount = items.filter((t) => String(t.id) !== String(deletedId)).length;
      if (remainingCount === 0 && page > 1 && setPage) {
        setPage(page - 1);
      } else {
        fetchTemplates(page, limit);
      }
    },
    [fetchTemplates, items, limit, page, pagination.total]
  );

  return {
    data: items,
    items,
    pagination,
    loading,
    error,
    refetch: () => fetchTemplates(page, limit),
    handleCreated,
    handleUpdated,
    handleDeleted,
  };
}
