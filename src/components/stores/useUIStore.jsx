import { createContext, useContext, useState, useCallback } from 'react';

/**
 * 🎨 UI STORE - FIXED
 * Verbesserte UI-State-Verwaltung
 */

const UIStoreContext = createContext(null);

export function UIStoreProvider({ children }) {
  const [modals, setModals] = useState({
    createPost: false,
    editPost: false,
    comments: false,
    imageViewer: false
  });
  const [modalData, setModalData] = useState({});
  const [isOffline, setIsOffline] = useState(false);

  const openModal = useCallback((modalName, data = null) => {
    if (!modalName) {
      console.error('openModal: modalName required');
      return;
    }

    setModals(prev => ({ ...prev, [modalName]: true }));
    
    if (data) {
      setModalData(prev => ({ ...prev, [modalName]: data }));
    }
  }, []);

  const closeModal = useCallback((modalName) => {
    if (!modalName) {
      console.error('closeModal: modalName required');
      return;
    }

    setModals(prev => ({ ...prev, [modalName]: false }));
    
    // ✅ FIX: Clear modal data after animation delay
    setTimeout(() => {
      setModalData(prev => {
        const newData = { ...prev };
        delete newData[modalName];
        return newData;
      });
    }, 300);
  }, []);

  const closeAllModals = useCallback(() => {
    setModals({
      createPost: false,
      editPost: false,
      comments: false,
      imageViewer: false
    });
    setModalData({});
  }, []);

  const setOfflineStatus = useCallback((offline) => {
    setIsOffline(Boolean(offline));
  }, []);

  const value = {
    modals,
    modalData,
    isOffline,
    openModal,
    closeModal,
    closeAllModals,
    setOffline: setOfflineStatus
  };

  return (
    <UIStoreContext.Provider value={value}>
      {children}
    </UIStoreContext.Provider>
  );
}

export function useUIStore() {
  const context = useContext(UIStoreContext);
  if (!context) {
    throw new Error('useUIStore must be used within UIStoreProvider');
  }
  return context;
}