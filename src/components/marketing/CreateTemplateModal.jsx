import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";

export default function CreateTemplateModal({
  isOpen,
  onClose,
  onSave,
  editTemplate = null,
}) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (editTemplate) {
      if (editTemplate.message) {
        setMessage(editTemplate.message);
      } else {
        const parts = [
          editTemplate.warning,
          editTemplate.offer,
          editTemplate.callToAction,
        ].filter(Boolean);
        setMessage(parts.join("\n\n"));
      }
    } else {
      setMessage("");
    }
  }, [editTemplate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSave?.({
      ...editTemplate,
      id: editTemplate?.id || `tpl-${Date.now()}`,
      title: editTemplate?.title || "*Dear Customer*",
      message: message.trim(),
      warning: message.trim(),
      offer:
        editTemplate?.offer ||
        "🎉 Get ₹250 OFF on your Periodic Maintenance - Limited time offer!",
      callToAction:
        editTemplate?.callToAction ||
        "Hurry! Give a missed call *9582344294 *to book your service now.",
      footer: editTemplate?.footer || "myTVS - Tried. Tested. Trusted",
    });
    onClose?.();
  };

  return (
    <div className="absolute right-6 top-24 z-30 w-[380px] sm:w-[420px] rounded-2xl border border-ink-100 bg-white p-5 shadow-2xl animate-in slide-in-from-right-5 duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-ink-100">
        <h3 className="text-sm font-bold text-ink-900">
          Create or edit template
        </h3>
        <button
          onClick={onClose}
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-colors cursor-pointer"
          aria-label="Close template panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Message input container anchored inside expanded customer section */}
      <form onSubmit={handleSubmit} className="pt-4">
        <div className="relative rounded-2xl border border-ink-200 bg-white p-4 shadow-2xs">
          <textarea
            rows={11}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a message to create template"
            className="w-full resize-none bg-transparent text-xs text-ink-800 placeholder-ink-400 focus:outline-none leading-relaxed"
            required
          />

          <div className="flex justify-end pt-3">
            <Button type="submit" variant="primaryDark">
              Create Template
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
