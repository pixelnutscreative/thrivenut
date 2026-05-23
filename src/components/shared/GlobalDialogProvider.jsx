import React, { createContext, useContext, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const GlobalDialogContext = createContext(null);

export const useGlobalDialog = () => {
  const context = useContext(GlobalDialogContext);
  if (!context) {
    throw new Error('useGlobalDialog must be used within a GlobalDialogProvider');
  }
  return context;
};

export const GlobalDialogProvider = ({ children }) => {
  const [dialogConfig, setDialogConfig] = useState(null);

  const confirm = useCallback((message, onConfirm, options = {}) => {
    setDialogConfig({
      type: 'confirm',
      message,
      title: options.title || 'Are you sure?',
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      variant: options.variant || 'default', // 'default', 'destructive'
      onConfirm: () => {
        onConfirm();
        setDialogConfig(null);
      },
      onCancel: () => setDialogConfig(null)
    });
  }, []);

  const prompt = useCallback((message, defaultValue = '', onConfirm, options = {}) => {
    setDialogConfig({
      type: 'prompt',
      message,
      value: defaultValue,
      title: options.title || 'Input Required',
      confirmText: options.confirmText || 'Submit',
      cancelText: options.cancelText || 'Cancel',
      onConfirm: (val) => {
        onConfirm(val);
        setDialogConfig(null);
      },
      onCancel: () => setDialogConfig(null)
    });
  }, []);

  const alert = useCallback((message, options = {}) => {
    setDialogConfig({
      type: 'alert',
      message,
      title: options.title || 'Notice',
      confirmText: options.confirmText || 'OK',
      onConfirm: () => setDialogConfig(null),
      onCancel: () => setDialogConfig(null)
    });
  }, []);

  return (
    <GlobalDialogContext.Provider value={{ confirm, prompt, alert }}>
      {children}
      {dialogConfig && (
        <Dialog open={!!dialogConfig} onOpenChange={(open) => !open && setDialogConfig(null)}>
          <DialogContent className="sm:max-w-[400px] z-[99999]">
            <DialogHeader>
              <DialogTitle className={dialogConfig.variant === 'destructive' ? 'text-red-600' : 'text-slate-800'}>
                {dialogConfig.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <p className="text-slate-600 font-medium whitespace-pre-wrap">{dialogConfig.message}</p>
              
              {dialogConfig.type === 'prompt' && (
                <Input 
                  autoFocus
                  defaultValue={dialogConfig.value}
                  onChange={(e) => {
                    setDialogConfig(prev => ({ ...prev, value: e.target.value }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      dialogConfig.onConfirm(e.target.value);
                    }
                  }}
                  className="mt-4"
                />
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              {dialogConfig.type !== 'alert' && (
                <Button variant="outline" onClick={dialogConfig.onCancel}>
                  {dialogConfig.cancelText}
                </Button>
              )}
              <Button 
                variant={dialogConfig.variant}
                onClick={() => dialogConfig.onConfirm(dialogConfig.value)}
              >
                {dialogConfig.confirmText}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </GlobalDialogContext.Provider>
  );
};