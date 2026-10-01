import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ModalContextType {
  openModal: (modalId: string, data?: any) => void;
  closeModal: (modalId?: string) => void;
  isModalOpen: (modalId: string) => boolean;
  getModalData: (modalId: string) => any;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

interface ModalState {
  [modalId: string]: {
    isOpen: boolean;
    data?: any;
  };
}

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [modals, setModals] = useState<ModalState>({});

  const openModal = (modalId: string, data?: any) => {
    setModals(prev => ({
      ...prev,
      [modalId]: { isOpen: true, data }
    }));
  };

  const closeModal = (modalId?: string) => {
    if (modalId) {
      setModals(prev => ({
        ...prev,
        [modalId]: { isOpen: false, data: null }
      }));
    } else {
      // Fermer toutes les modales
      setModals({});
    }
  };

  const isModalOpen = (modalId: string) => {
    return modals[modalId]?.isOpen || false;
  };

  const getModalData = (modalId: string) => {
    return modals[modalId]?.data;
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal, isModalOpen, getModalData }}>
      {children}
    </ModalContext.Provider>
  );
}
