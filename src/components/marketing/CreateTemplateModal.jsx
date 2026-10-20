import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { campaignApi } from '@/services/api/campaignApi';
import { showToast } from '@/utils/toast';

export default function CreateTemplateModal({
  isOpen,
  onClose,
  onSave,
  editTemplate = null,
  triggerRef = null,
  allowedPlaceholders = [],
  limits = { title: 100, content: 1024, footer: 60 },
  apiDriven = true,
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [footer, setFooter] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValuesRef = useRef({ title: '', content: '', footer: '' });

  const lastFocusedFieldRef = useRef('content');
  const titleInputRef = useRef(null);
  const contentTextareaRef = useRef(null);
  const footerInputRef = useRef(null);
  const prevTriggerRef = useRef(null);

  const titleLimit = limits?.title || 100;
  const contentLimit = limits?.content || 1024;
  const footerLimit = limits?.footer || 60;

  useEffect(() => {
    if (isOpen) {
      prevTriggerRef.current = triggerRef?.current || document.activeElement;
      const initial = {
        title: editTemplate?.title || '',
        content: editTemplate?.content || editTemplate?.body || '',
        footer: editTemplate?.footer || '',
      };
      initialValuesRef.current = initial;
      setTitle(initial.title);
      setContent(initial.content);
      setFooter(initial.footer);
      setFieldErrors({});

      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    } else {
      if (prevTriggerRef.current && typeof prevTriggerRef.current.focus === 'function') {
        prevTriggerRef.current.focus();
      }
    }
  }, [isOpen, editTemplate, triggerRef]);

  if (!isOpen) return null;

  const isDirty =
    title !== initialValuesRef.current.title ||
    content !== initialValuesRef.current.content ||
    footer !== initialValuesRef.current.footer;

  const handleClose = () => {
    if (isDirty) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (!confirmDiscard) return;
    }
    onClose?.();
  };

  const validateForm = () => {
    const errors = {};
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const trimmedFooter = footer.trim();

    if (!trimmedTitle) {
      errors.title = 'Title is required';
    } else if (trimmedTitle.length > titleLimit) {
      errors.title = `Title must not exceed ${titleLimit} characters`;
    }

    if (!trimmedContent) {
      errors.content = 'Content is required';
    } else if (trimmedContent.length > contentLimit) {
      errors.content = `Content must not exceed ${contentLimit} characters`;
    }

    if (trimmedFooter.length > footerLimit) {
      errors.footer = `Footer must not exceed ${footerLimit} characters`;
    }

    const checkTokens = (text, fieldName) => {
      const tokenRegex = /\{\{([^{}]*)\}\}/g;
      let match;
      const invalid = [];
      while ((match = tokenRegex.exec(text)) !== null) {
        const t = match[1].trim();
        if (allowedPlaceholders.length > 0 && !allowedPlaceholders.includes(t)) {
          invalid.push(t || 'empty');
        }
      }
      if (invalid.length > 0) {
        errors[fieldName] = `Unknown token(s): ${invalid.map((t) => `{{${t}}}`).join(', ')}`;
      }
      const openBraces = (text.match(/\{\{/g) || []).length;
      const closeBraces = (text.match(/\}\}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors[fieldName] = 'Malformed placeholder braces (unclosed or mismatched).';
      }
    };

    if (trimmedTitle) checkTokens(trimmedTitle, 'title');
    if (trimmedContent) checkTokens(trimmedContent, 'content');
    if (trimmedFooter) checkTokens(trimmedFooter, 'footer');

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInsertPlaceholder = (placeholder) => {
    const token = `{{${placeholder}}}`;
    const target =
      lastFocusedFieldRef.current === 'title'
        ? titleInputRef.current
        : contentTextareaRef.current;

    if (!target) return;

    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    const currentValue = target.value;
    const nextValue =
      currentValue.substring(0, start) + token + currentValue.substring(end);

    if (lastFocusedFieldRef.current === 'title') {
      setTitle(nextValue);
    } else {
      setContent(nextValue);
    }

    setTimeout(() => {
      target.focus();
      const nextPos = start + token.length;
      target.setSelectionRange(nextPos, nextPos);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);

    const payload = {
      title: title.trim(),
      content: content.trim(),
      footer: footer.trim() || null,
    };

    if (!apiDriven) {
      const result = {
        ...editTemplate,
        id: editTemplate?.id || `tpl-${Date.now()}`,
        ...payload,
      };
      showToast.success(editTemplate ? 'Template updated successfully.' : 'New template created successfully.');
      onSave?.(result);
      setIsSubmitting(false);
      onClose?.();
      return;
    }

    try {
      if (editTemplate) {
        const updated = await campaignApi.updateTemplate(editTemplate.id, payload);
        showToast.success('Template updated successfully.');
        onSave?.(updated);
      } else {
        const created = await campaignApi.createTemplate(payload);
        showToast.success('New template created successfully.');
        onSave?.(created);
      }
      onClose?.();
    } catch (err) {
      const status = err.status;
      const serverMessage = err.message || 'Failed to save template.';
      setGeneralError(serverMessage);

      if (status === 409) {
        setFieldErrors((prev) => ({
          ...prev,
          title: serverMessage,
        }));
      } else if (status === 400 && err.raw?.response?.data?.validationErrors) {
        const sErrors = err.raw.response.data.validationErrors;
        if (typeof sErrors === 'object') {
          setFieldErrors(sErrors);
        }
      }
      showToast.error(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-panel-title"
      className="absolute right-6 top-24 z-30 w-[380px] sm:w-[460px] rounded-2xl border border-ink-100 bg-white p-5 shadow-2xl animate-in slide-in-from-right-5 duration-200"
    >
      <div className="flex items-center justify-between pb-3 border-b border-ink-100">
        <h3 id="template-panel-title" className="text-sm font-bold text-ink-900">
          {editTemplate ? 'Edit Template' : 'Create Template'}
        </h3>
        <button
          onClick={handleClose}
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-colors cursor-pointer"
          aria-label="Close template panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {generalError && (
        <div role="alert" className="mt-3 rounded-xl border border-danger-200 bg-danger-50/60 p-2.5 text-xs text-danger-700 font-medium">
          {generalError}
        </div>
      )}

      {allowedPlaceholders.length > 0 && (
        <div className="pt-3 pb-2 border-b border-ink-100/60">
          <span className="block text-[11px] font-semibold text-ink-500 mb-1.5 uppercase tracking-wider">
            Insert Placeholders
          </span>
          <div className="flex flex-wrap gap-1.5">
            {allowedPlaceholders.map((token) => (
              <button
                key={token}
                type="button"
                onClick={() => handleInsertPlaceholder(token)}
                className="inline-flex items-center rounded-md border border-ink-200 bg-ink-50 px-2 py-1 text-[11px] font-medium text-ink-700 hover:bg-ink-100 transition-colors cursor-pointer"
              >
                +{token}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="pt-3.5 space-y-3.5">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="template-title"
              className="block text-xs font-semibold text-ink-700">
              Title <span className="text-red-500">*</span>
            </label>
            <span
              className={`text-[10px] ${
                title.length > titleLimit ? 'text-red-500 font-bold' : 'text-ink-400'
              }`} >
              {title.length} / {titleLimit}
            </span>
          </div>
          <input
            ref={titleInputRef}
            id="template-title"
            type="text"
            value={title}
            maxLength={titleLimit}
            onFocus={() => {
              lastFocusedFieldRef.current = 'title';
            }}
            onChange={(e) => {
              setTitle(e.target.value);
              if (fieldErrors.title) {
                setFieldErrors((prev) => ({ ...prev, title: undefined }));
              }
            }}
            placeholder="Title for the message template..."
            className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-xs text-ink-800 placeholder-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
            required />
          {fieldErrors.title && (
            <p
              role="alert"
              aria-live="polite"
              className="mt-1 text-[11px] text-danger-500" >
              {fieldErrors.title}
            </p>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="template-content"
              className="block text-xs font-semibold text-ink-700" >
              SMS Message Text <span className="text-red-500">*</span>
            </label>
            <span
              className={`text-[10px] ${
                content.length > contentLimit ? 'text-red-500 font-bold' : 'text-ink-400'
              }`} >
              {content.length} / {contentLimit}
            </span>
          </div>
          <textarea
            ref={contentTextareaRef}
            id="template-content"
            rows={6}
            value={content}
            maxLength={contentLimit}
            onFocus={() => {
              lastFocusedFieldRef.current = 'content';
            }}
            onChange={(e) => {
              setContent(e.target.value);
              if (fieldErrors.content) {
                setFieldErrors((prev) => ({ ...prev, content: undefined }));
              }
            }}
            placeholder="Please enter message content here..."
            className="w-full resize-none rounded-xl border border-ink-200 bg-white p-3.5 text-xs text-ink-800 placeholder-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 leading-relaxed transition-colors font-normal"
            required />
          {fieldErrors.content && (
            <p
              role="alert"
              aria-live="polite"
              className="mt-1 text-[11px] text-danger-500">
              {fieldErrors.content}
            </p>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="template-footer"
              className="block text-xs font-semibold text-ink-700" >
              Footer <span className="text-ink-400 font-normal">(optional)</span>
            </label>
            <span
              className={`text-[10px] ${
                footer.length > footerLimit ? 'text-red-500 font-bold' : 'text-ink-400'
              }`} >
              {footer.length} / {footerLimit}
            </span>
          </div>
          <input
            ref={footerInputRef}
            id="template-footer"
            type="text"
            value={footer}
            maxLength={footerLimit}
            onFocus={() => {
              lastFocusedFieldRef.current = 'footer';
            }}
            onChange={(e) => {
              setFooter(e.target.value);
              if (fieldErrors.footer) {
                setFieldErrors((prev) => ({ ...prev, footer: undefined }));
              }
            }}
            placeholder="Footer note..."
            className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-xs text-ink-800 placeholder-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"/>
          {fieldErrors.footer && (
            <p
              role="alert"
              aria-live="polite"
              className="mt-1 text-[11px] text-danger-500" >
              {fieldErrors.footer}
            </p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-100">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting} >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primaryDark"
            isLoading={isSubmitting}
            disabled={isSubmitting} >
            {editTemplate ? 'Save Changes' : 'Create Template'}
          </Button>
        </div>
      </form>
    </div>
  );
}
