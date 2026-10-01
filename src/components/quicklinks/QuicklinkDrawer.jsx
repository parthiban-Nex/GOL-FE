import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  Calendar,
  FileText,
  X,
  Paperclip,
  Send,
  ChevronRight,
} from "lucide-react";
import { useLayout } from "@/context/LayoutContext";
import { ROUTES } from "@/constants/routes";
import { showToast } from "@/utils/toast";
import { QuicklinkCreateCustomer } from "./QuicklinkCreateCustomer";
import { QuicklinkCreateBooking } from "./QuicklinkCreateBooking";
import { QuicklinkCreateEstimate } from "./QuicklinkCreateEstimate";
import { BotAvatar } from "@/components/quicklinks/ChatPieces";
import "./QuicklinkDrawer.css";

export const QuickLinksDrawer = ({ onNavigate }) => {
  const { isQuickLinksOpen, closeQuickLinks } = useLayout();
  const navigate = useNavigate();

  const [currentView, setCurrentView] = useState("MAIN");
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isQuickLinksOpen) {
      if (currentView === "MAIN") {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 150);
      }
    } else {
      setMessage("");
      setCurrentView("MAIN");
    }
  }, [isQuickLinksOpen, currentView]);

  if (!isQuickLinksOpen) return null;

  const handleNavigate = (path) => {
    closeQuickLinks();
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const handleMainMessageSubmit = (e) => {
    e?.preventDefault();
    const query = message.trim().toLowerCase();
    if (!query) return;

    if (query.includes("estim") || query.includes("quote")) {
      setCurrentView("NEW_ESTIMATE");
      setMessage("");
    } else if (query.includes("book") || query.includes("appoint")) {
      setCurrentView("CREATE_BOOKING");
      setMessage("");
    } else if (
      query.includes("cust") ||
      query.includes("user") ||
      /^\d{6,10}$/.test(query)
    ) {
      setCurrentView("CREATE_CUSTOMER");
      setMessage("");
    } else if (
      query.includes("job") ||
      query.includes("repair") ||
      query.includes("card")
    ) {
      handleNavigate(ROUTES.SERVICE_JOB_CARD);
      showToast.success("Navigating to Job Cards & Repair...");
    } else if (
      query.includes("part") ||
      query.includes("cat") ||
      query.includes("spares")
    ) {
      handleNavigate(ROUTES.CATALOGUE);
      showToast.success("Navigating to Catalogue & Parts...");
    } else {
      setCurrentView("CREATE_CUSTOMER");
      setMessage("");
    }
  };

  return (
    <div
      className="quicklinks-backdrop"
      onClick={closeQuickLinks}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="quicklinks-side-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <BotAvatar />
            <h2 className="text-lg font-bold text-ink-800">Quick Links</h2>
          </div>

          <button
            type="button"
            onClick={closeQuickLinks}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentView === "MAIN" && (
          <div className="flex-1 flex flex-col py-2 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 py-2">
              <div
                onClick={() => setCurrentView("CREATE_CUSTOMER")}
                className="quicklink-card group flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div>
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 group-hover:scale-105 group-hover:bg-blue-100 transition-all">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    1. Create Customer
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Search existing customers or add a customer &amp; vehicle
                  </p>
                </div>

                <div className="mt-3.5 w-full py-2 px-3.5 bg-blue-50 text-blue-600 group-hover:bg-blue-100/90 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-colors">
                  <span>Add / Search</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div
                onClick={() => setCurrentView("CREATE_BOOKING")}
                className="quicklink-card group flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div>
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5 group-hover:scale-105 group-hover:bg-emerald-100 transition-all">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    2. Create Booking
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Book appointment for customer &amp; vehicle at your garage.
                  </p>
                </div>

                <div className="mt-3.5 w-full py-2 px-3.5 bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100/90 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-colors">
                  <span>Create Booking</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div
                onClick={() => setCurrentView("NEW_ESTIMATE")}
                className="quicklink-card group flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-amber-300 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div>
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5 group-hover:scale-105 group-hover:bg-amber-100 transition-all">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    3. New Estimate
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Create estimation for customer with parts, labour &amp;
                    others.
                  </p>
                </div>

                <div className="mt-3.5 w-full py-2 px-3.5 bg-[#fffbeb] border border-amber-200/80 text-amber-700 group-hover:bg-amber-100/80 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-colors">
                  <span>Create Estimate</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            <form onSubmit={handleMainMessageSubmit} className="pt-3 mt-auto">
              <div className="flex items-center gap-2 border border-slate-200 rounded-2xl px-4 py-2 bg-white shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-slate-800 placeholder-slate-400 py-1"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => showToast.success("File attachment feature")}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Attach File"
                >
                  <Paperclip className="w-4 h-4 rotate-45" />
                </button>

                <button
                  type="submit"
                  className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-center shadow-sm hover:shadow transition-all cursor-pointer"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {currentView === "CREATE_CUSTOMER" && (
          <QuicklinkCreateCustomer
            onBack={() => setCurrentView("MAIN")}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === "CREATE_BOOKING" && (
          <QuicklinkCreateBooking
            onBack={() => setCurrentView("MAIN")}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === "NEW_ESTIMATE" && (
          <QuicklinkCreateEstimate
            onBack={() => setCurrentView("MAIN")}
            onNavigate={handleNavigate}
          />
        )}
      </div>
    </div>
  );
};
