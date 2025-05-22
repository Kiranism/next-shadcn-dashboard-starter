'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DialogFormProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  showBackButton?: boolean;
  backButtonLabel?: string;
  onBack?: () => void;
  isLoading?: boolean; // For future use with form submission state
}

export const DialogForm: React.FC<DialogFormProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  showBackButton = false,
  backButtonLabel = 'Cancel',
  onBack,
  isLoading = false, // Default isLoading state
}) => {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[750px] lg:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            {icon}
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        <div className="py-4">
          {children}
        </div>

        {(showBackButton) && (
          <DialogFooter>
            {showBackButton && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
              >
                {backButtonLabel}
              </Button>
            )}
            {/* 
              Submit button is typically part of the 'children' (the form itself).
              If a generic submit button controlled by this dialog was needed,
              it could be added here, potentially using the isLoading prop.
              Example:
              <Button type="submit" form="your-form-id" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit"}
              </Button>
            */}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Ensure the component is exportable
export default DialogForm;
