import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';
import { useModal } from './modal-provider';

interface BaseModalProps {
  modalId: string;
  title: string;
  description?: string;
  children: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'lgBootstrap' | 'extraLarge';
  showFooter?: boolean;
}

export function BaseModal({
  modalId,
  title,
  description,
  children,
  onConfirm,
  onCancel,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  confirmVariant = 'default',
  size = 'md',
  showFooter = true
}: BaseModalProps) {
  const { isModalOpen, closeModal } = useModal();

  const isOpen = isModalOpen(modalId);

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    }
    closeModal(modalId);
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    closeModal(modalId);
  };

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    '3xl': 'w-[95vw] max-w-[95vw]',
    lgBootstrap: 'w-[90vw] max-w-[800px]',
    extraLarge: 'w-11/12 max-w-5xl'
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={`${sizeClasses[size]} max-h-[90vh] flex flex-col`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        {/* `empty:hidden` : sans corps, ce bloc laissait un vide entre le texte
            et les boutons à cause de son padding. */}
        <div className="overflow-y-auto flex-1 py-4 px-1 empty:hidden empty:py-0">
          {children}
        </div>

        {showFooter && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {cancelText}
            </Button>
            {onConfirm && (
              <Button variant={confirmVariant} onClick={handleConfirm}>
                {confirmText}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
