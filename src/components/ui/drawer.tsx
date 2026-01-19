'use client';

import { ReactNode, useEffect } from 'react';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
}

export function Drawer({ isOpen, onClose, title, description, children, footer }: DrawerProps) {
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
        <div className="fixed inset-0 z-40 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/20 backdrop-blur-[1px] transition-opacity"
                onClick={onClose}
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                {/* Slide-over panel */}
                <div
                    className={`pointer-events-auto w-screen max-w-md transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                        }`}
                >
                    <div className="flex h-full flex-col bg-[var(--background-card)] shadow-xl">
                        {/* Header */}
                        <div className="px-6 py-6 border-b border-[var(--border-light)] flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
                                {description && (
                                    <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="relative rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
                            >
                                <span className="sr-only">Fechar</span>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="relative flex-1 px-6 py-6 overflow-y-auto custom-scrollbar">
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="flex-shrink-0 px-6 py-4 border-t border-[var(--border-light)] bg-[var(--background)] flex justify-end gap-3">
                                {footer}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
