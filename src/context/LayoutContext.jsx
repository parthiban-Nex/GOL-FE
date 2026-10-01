import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LayoutContext = createContext(undefined);

export const LayoutProvider = ({ children }) => {
  const [isQuickLinksOpen, setIsQuickLinksOpen] = useState(false);

  const openQuickLinks = useCallback(() => setIsQuickLinksOpen(true), []);
  const closeQuickLinks = useCallback(() => setIsQuickLinksOpen(false), []);
  const toggleQuickLinks = useCallback(() => setIsQuickLinksOpen((prev) => !prev), []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle on Alt + Q or Ctrl + Q
      if ((e.altKey || e.ctrlKey) && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        toggleQuickLinks();
      }
      // Close on Escape
      if (e.key === 'Escape' && isQuickLinksOpen) {
        e.preventDefault();
        closeQuickLinks();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickLinksOpen, toggleQuickLinks, closeQuickLinks]);

  return (
    <LayoutContext.Provider
      value={{
        isQuickLinksOpen,
        openQuickLinks,
        closeQuickLinks,
        toggleQuickLinks
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};