import { createContext, useContext, useState, useCallback } from 'react';
import GlassContextMenu from './GlassContextMenu';

const ContextMenuContext = createContext(null);

export function useContextMenu() {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) {
    return { openMenu: () => {}, closeMenu: () => {}, isOpen: false };
  }
  return ctx;
}

export default function ContextMenuProvider({ children }) {
  const [menuState, setMenuState] = useState({
    isOpen: false,
    type: null,
    payload: null,
    actions: [],
    title: null,
    subtitle: null,
  });

  const openMenu = useCallback(({ type, payload, actions, title, subtitle }) => {
    // Haptic feedback (web vibrate API)
    if (navigator.vibrate) navigator.vibrate(10);
    
    setMenuState({
      isOpen: true,
      type: type || 'default',
      payload: payload || null,
      actions: actions || [],
      title: title || null,
      subtitle: subtitle || null,
    });
  }, []);

  const closeMenu = useCallback(() => {
    setMenuState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleAction = useCallback((action) => {
    if (action.disabled) return;
    // Medium haptic for action select
    if (navigator.vibrate) navigator.vibrate(15);
    closeMenu();
    // Small delay so sheet animates out before action runs
    setTimeout(() => {
      action.onPress?.();
    }, 150);
  }, [closeMenu]);

  return (
    <ContextMenuContext.Provider value={{ openMenu, closeMenu, isOpen: menuState.isOpen }}>
      {children}
      <GlassContextMenu
        isOpen={menuState.isOpen}
        onClose={closeMenu}
        actions={menuState.actions}
        title={menuState.title}
        subtitle={menuState.subtitle}
        onAction={handleAction}
      />
    </ContextMenuContext.Provider>
  );
}