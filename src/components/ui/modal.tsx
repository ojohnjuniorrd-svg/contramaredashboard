'use client';

import { ReactNode, useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children, footer }: ModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm modal-backdrop"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-[580px] flex flex-col max-h-[90vh] bg-[var(--background-card)] rounded-xl shadow-2xl border border-[var(--border)] overflow-hidden modal-content">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-[var(--border-light)] shrink-0">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h2>
                        {description && (
                            <p className="text-sm font-medium text-[var(--text-secondary)]">{description}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-md hover:bg-[var(--background-hover)]"
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="p-6 border-t border-[var(--border-light)] bg-[var(--background)] flex justify-end gap-3 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
