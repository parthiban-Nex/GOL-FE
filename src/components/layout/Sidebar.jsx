import { useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import clsx from "clsx";
import { normalizeApiMenu } from "@/menu/buildMenuFromApi";
import { isMenuItemActive } from "@/menu/menuPermissions";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/utils/formatters";

export default function Sidebar({ isCollapsed, isMobileOpen, onCloseMobile }) {
  const { user } = useAuth();
  const location = useLocation();
  const visibleMenu = useMemo(() => normalizeApiMenu(user?.menu), [user?.menu]);

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink-900/50 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-[76px] flex-col bg-brand-900 text-brand-100 transition-transform duration-200",
          "lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <Logo isCollapsed={isCollapsed} />
          {/* <button
            className="rounded-md p-1 text-brand-200 hover:bg-white/10 lg:hidden"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button> */}
        </div>

        <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {visibleMenu.map((item) => (
            <MenuNode
              key={item.key}
              item={item}
              isCollapsed={isCollapsed}
              location={location}
            />
          ))}
        </nav>

        <div className="flex items-center gap-3 border-t border-white/10 px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-500 text-sm font-semibold text-white">
            {initials(user?.name) || "U"}
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user?.name ?? "User"}
              </p>
              <p className="truncate text-xs text-brand-300">
                {user?.email ?? ""}
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function Logo({ isCollapsed }) {
  return (
    <div className="flex items-center gap-1.5 overflow-hidden">
      <span className="shrink-0 rounded-sm bg-accent-500 py-1 px-0.5 text-xs font-bold text-white">
        myTVS
      </span>
      {!isCollapsed && (
        <span className="whitespace-nowrap text-sm font-bold tracking-tight text-white">
          GARAGE<span className="text-accent-400">ONE</span> LITE
        </span>
      )}
    </div>
  );
}

function useAnchoredHover(enabled) {
  const anchorRef = useRef(null);
  const [rect, setRect] = useState(null);
  const timeoutRef = useRef(null);

  const show = () => {
    if (!enabled || !anchorRef.current) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setRect(anchorRef.current.getBoundingClientRect());
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setRect(null), 120);
  };

  return { anchorRef, rect, show, hide, isOpen: Boolean(rect) };
}


const FLYOUT_GAP = 8;
const FLYOUT_MIN_HEIGHT = 240;

function flyoutPosition(rect) {
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - rect.top - FLYOUT_GAP;

  const top =
    spaceBelow < FLYOUT_MIN_HEIGHT
      ? Math.max(FLYOUT_GAP, viewportHeight - FLYOUT_GAP - FLYOUT_MIN_HEIGHT)
      : rect.top;

  return {
    top,
    left: rect.right + FLYOUT_GAP,
    maxHeight: viewportHeight - top - FLYOUT_GAP,
  };
}

function MenuNode({ item, isCollapsed, location }) {
  const hasChildren = Boolean(item.children?.length);
  const active = isMenuItemActive(item, location.pathname);
  const [isOpen, setIsOpen] = useState(active);
  const {
    anchorRef,
    rect,
    show,
    hide,
    isOpen: isFlyoutOpen,
  } = useAnchoredHover(isCollapsed);
  const Icon = item.icon;

  if (!hasChildren) return <MenuLink item={item} isCollapsed={isCollapsed} />;

  const chevronUp = isCollapsed ? isFlyoutOpen : isOpen;

  return (
    <div ref={anchorRef} onMouseEnter={show} onMouseLeave={hide}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isCollapsed ? isFlyoutOpen : isOpen}
        className={clsx(
          "flex w-full items-center rounded-lg py-2.5 cursor-pointer   text-sm font-medium transition-colors",
          isCollapsed ? "justify-center gap-1.5 px-2" : "gap-3 px-3",
          active
            ? "bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-card"
            : "text-brand-200 hover:bg-white/5 hover:text-white",
        )}
      >
        <Icon className="h-[18px] w-[18px]  shrink-0" aria-hidden="true" />
        {!isCollapsed && (
          <span className="flex-1 truncate text-left">{item.label}</span>
        )}
        <ChevronDown
          className={clsx(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            chevronUp && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {/* Expanded sidebar: inline accordion */}
      {isOpen && !isCollapsed && (
        <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-4">
          {item.children.map((child) => (
            <MenuLink key={child.key} item={child} isCollapsed={false} />
          ))}
        </div>
      )}

      {/* Collapsed sidebar: hover flyout, portalled to escape nav overflow */}
      {isCollapsed &&
        isFlyoutOpen &&
        rect &&
        createPortal(
          <div
            role="menu"
            aria-label={item.label}
            onMouseEnter={show}
            onMouseLeave={hide}
            style={flyoutPosition(rect)}
            className="fixed z-[60] flex min-w-[220px] flex-col rounded-lg bg-ink-800 p-2 shadow-popover"
          >
            {/* Header stays put while the list below it scrolls. */}
            <div className="shrink-0 px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-brand-300">
              {item.label}
            </div>
            <div className="scrollbar-thin min-h-0 flex-1 space-y-0.5 overflow-y-auto">
              {item.children.map((child) => (
                <NavLink
                  key={child.key}
                  to={child.path}
                  onClick={hide}
                  className={({ isActive }) =>
                    clsx(
                      "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-500 text-white"
                        : "text-brand-100 hover:bg-white/10 hover:text-white",
                    )
                  }
                >
                  {child.label}
                </NavLink>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function MenuLink({ item, isCollapsed }) {
  const {
    anchorRef,
    rect,
    show,
    hide,
    isOpen: isTooltipOpen,
  } = useAnchoredHover(isCollapsed);
  const Icon = item.icon;

  return (
    <div ref={anchorRef} onMouseEnter={show} onMouseLeave={hide}>
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          clsx(
            "flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors",
            isCollapsed ? " px-2" : "gap-3 px-3",
            isActive
              ? "bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-card"
              : "text-brand-200 hover:bg-white/5 hover:text-white",
          )
        }
      >
        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
      </NavLink>

      {isCollapsed &&
        isTooltipOpen &&
        rect &&
        createPortal(
          <div
            role="tooltip"
            style={{ top: rect.top + rect.height / 2, left: rect.right + 8 }}
            className="pointer-events-none fixed z-[60] -translate-y-1/2 whitespace-nowrap rounded-md bg-ink-800 px-3 py-1.5 text-xs font-medium text-white shadow-popover"
          >
            {item.label}
          </div>,
          document.body,
        )}
    </div>
  );
}
