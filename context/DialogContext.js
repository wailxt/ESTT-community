'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import UnifiedDialog from '@/components/ui/UnifiedDialog';

const DialogContext = createContext();

export function DialogProvider({ children }) {
    const [dialogs, setDialogs] = useState([]);
    const [confirmResolvers, setConfirmResolvers] = useState({});

    const showDialog = useCallback((config) => {
        const id = Date.now();
        const dialogConfig = {
            id,
            isOpen: true,
            ...config,
            onClose: () => {
                config.onClose?.();
                setDialogs(prev => prev.filter(d => d.id !== id));
            }
        };
        setDialogs(prev => [...prev, dialogConfig]);
        return id;
    }, []);

    const closeDialog = useCallback((id) => {
        setDialogs(prev => prev.filter(d => d.id !== id));
    }, []);

    const showSuccess = useCallback((message, actions = [], options = {}) => {
        return showDialog({
            type: 'success',
            message,
            actions,
            autoClose: options.autoClose ?? 3500,
            ...options
        });
    }, [showDialog]);

    const showError = useCallback((message, actions = [], options = {}) => {
        return showDialog({
            type: 'error',
            message,
            actions,
            autoClose: options.autoClose ?? 0, // Stay open
            ...options
        });
    }, [showDialog]);

    const showWarning = useCallback((message, actions = [], options = {}) => {
        return showDialog({
            type: 'warning',
            message,
            actions,
            autoClose: options.autoClose ?? 0, // Stay open
            ...options
        });
    }, [showDialog]);

    const showInfo = useCallback((message, actions = [], options = {}) => {
        return showDialog({
            type: 'info',
            message,
            actions,
            autoClose: options.autoClose ?? 3000,
            ...options
        });
    }, [showDialog]);

    const showConfirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            const id = Date.now() + Math.random();
            const type = options.type || 'warning';
            const confirmVariant = options.confirmVariant || (type === 'danger' ? 'danger' : 'primary');

            const confirmActions = [
                {
                    label: options.cancelLabel || 'Annuler',
                    variant: 'secondary',
                    onClick: () => {
                        resolve(false);
                        closeDialog(id);
                    }
                },
                {
                    label: options.confirmLabel || 'Confirmer',
                    variant: confirmVariant,
                    onClick: () => {
                        resolve(true);
                        closeDialog(id);
                    }
                }
            ];

            showDialog({
                id,
                type: type,
                title: options.title || 'Confirmation',
                message,
                actions: confirmActions,
                autoClose: 0,
                ...options
            });

            setConfirmResolvers(prev => ({ ...prev, [id]: resolve }));
        });
    }, [showDialog, closeDialog]);

    const value = {
        showDialog,
        closeDialog,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm
    };

    return (
        <DialogContext.Provider value={value}>
            {children}
            {/* Render all dialogs */}
            <div className="dialog-container">
                {dialogs.map((dialog) => (
                    <UnifiedDialog
                        key={dialog.id}
                        isOpen={dialog.isOpen}
                        type={dialog.type}
                        title={dialog.title}
                        message={dialog.message}
                        actions={dialog.actions}
                        onClose={dialog.onClose}
                        autoClose={dialog.autoClose}
                        icon={dialog.icon}
                    />
                ))}
            </div>
        </DialogContext.Provider>
    );
}

export function useDialog() {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
}
