import { useState } from "react";
import {
  MessageCircle,
  Mail,
  MessageSquare,
  MoreVertical,
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { showToast } from "@/utils/toast";

export default function ShareActions({ customer, expanded = false }) {
  const [isOpen, setIsOpen] = useState(false);

  const isShowingButtons = expanded || isOpen;

  const handleSendWhatsApp = (e) => {
    e?.stopPropagation();
    showToast.success(
      `WhatsApp reminder sent to ${customer.customer || "customer"} (${customer.phone || "mobile"})`,
    );
  };

  const handleSendEmail = (e) => {
    e?.stopPropagation();
    showToast.success(
      `Email notification sent to ${customer.customer || "customer"}`,
    );
  };

  const handleSendSMS = (e) => {
    e?.stopPropagation();
    showToast.success(
      `SMS alert dispatched to ${customer.phone || "customer"}`,
    );
  };

  if (isShowingButtons) {
    return (
      <div className="inline-flex items-center gap-1.5 animate-in fade-in-50 duration-200">
        <Button
          onClick={handleSendWhatsApp}
          variant="plain"
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
          title="Send WhatsApp Message"
        >
          <MessageCircle className="h-3.5 w-3.5 fill-emerald-500/20 text-emerald-600 stroke-[2.2]" />
          <span>WhatsApp</span>
        </Button>

        <Button
          onClick={handleSendEmail}
          variant="plain"
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs"
          title="Send Email Notification"
        >
          <Mail className="h-3.5 w-3.5 text-blue-600 stroke-[2.2]" />
          <span>Email</span>
        </Button>

        <Button
          onClick={handleSendSMS}
          variant="plain"
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
          title="Send SMS Alert"
        >
          <MessageSquare className="h-3.5 w-3.5 text-amber-600 stroke-[2.2]" />
          <span>SMS</span>
        </Button>

        {!expanded && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            variant="plain"
            className="flex h-6 w-6 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-600 transition-colors cursor-pointer"
            title="Collapse share actions"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Button
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(true);
      }}
      variant="plain"
      className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-colors cursor-pointer"
      aria-label="More share actions"
      title="Click to show share actions"
    >
      <MoreVertical className="h-4 w-4" />
    </Button>
  );
}
