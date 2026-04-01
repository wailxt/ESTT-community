'use client';

import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function UnifiedDialog({
    isOpen,
    type = 'info',
    title,
    message,
    actions = [],
    onClose,
    autoClose,
    icon
}) {
    useEffect(() => {
        if (isOpen && autoClose) {
            const timer = setTimeout(() => {
                onClose?.();
            }, autoClose);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoClose, onClose]);

    // Define icon and color based on type
    const typeConfig = {
        success: {
            icon: CheckCircle,
            iconColor: 'text-green-600'
        },
        error: {
            icon: AlertCircle,
            iconColor: 'text-red-600'
        },
        warning: {
            icon: AlertTriangle,
            iconColor: 'text-orange-600'
        },
        info: {
            icon: Info,
            iconColor: 'text-blue-600'
        },
        danger: {
            icon: AlertTriangle,
            iconColor: 'text-red-600'
        }
    };

    const config = typeConfig[type] || typeConfig.info;
    const Icon = icon || config.icon;

    // Map legacy variants to standard Button variants
    const getButtonVariant = (variant) => {
        switch (variant) {
            case 'primary': return 'default';
            case 'secondary': return 'outline';
            case 'danger': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) onClose?.();
        }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        {type !== 'warning' && (
                            <Icon
                                className={`mt-0.5 h-6 w-6 flex-shrink-0 ${config.iconColor}`}
                                strokeWidth={2}
                            />
                        )}
                        <div className="flex-1 space-y-2">
                            {title && (
                                <DialogTitle className="text-left leading-tight">
                                    {title}
                                </DialogTitle>
                            )}
                            {message && (
                                <DialogDescription className="text-left text-sm leading-relaxed">
                                    {message}
                                </DialogDescription>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {actions.length > 0 && (
                    <DialogFooter className="mt-6 flex sm:justify-end gap-2">
                        {actions.map((action, idx) => (
                            <Button
                                key={idx}
                                variant={getButtonVariant(action.variant)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick?.();
                                    onClose?.();
                                }}
                            >
                                {action.label}
                            </Button>
                        ))}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
