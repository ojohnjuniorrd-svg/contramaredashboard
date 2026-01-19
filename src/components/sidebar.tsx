'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './theme-provider';

interface SidebarProps {
    userName?: string;
    userEmail?: string;
    onSignOut?: () => void;
}

export function Sidebar({ userName = 'Usuário', userEmail = 'user@email.com', onSignOut }: SidebarProps) {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { href: '/', label: 'Visão Geral', icon: 'dashboard' },
        { href: '/campaigns', label: 'Campanhas', icon: 'rocket_launch' },
        { href: '/reports', label: 'Relatórios', icon: 'bar_chart' },
        { href: '/settings', label: 'Configurações', icon: 'settings' },
    ];

    return (
        <aside className="w-64 bg-[var(--background-card)] border-r border-[var(--border)] flex flex-col h-full shrink-0">
            {/* Branding */}
            <div className="p-4 border-b border-[var(--border-light)]">
                <div className="flex gap-3 items-center">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-blue-400 flex items-center justify-center text-white shadow-lg">
                        <span className="material-symbols-outlined">waves</span>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <h1 className="text-[var(--text-primary)] text-base font-semibold leading-tight truncate">Contra Maré</h1>
                        <p className="text-[var(--text-secondary)] text-xs font-normal leading-normal truncate">Marketing Analytics</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isActive
                                ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--background-hover)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[24px] ${isActive ? 'text-[var(--primary)]' : ''}`}>
                                {item.icon}
                            </span>
                            <p className="text-sm font-medium leading-normal">{item.label}</p>
                        </Link>
                    );
                })}
            </nav>

            {/* Theme Toggle */}
            <div className="px-4 py-2 border-t border-[var(--border-light)]">
                <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-[var(--text-secondary)] hover:bg-[var(--background-hover)] transition-colors"
                >
                    <span className="material-symbols-outlined text-[24px]">
                        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </span>
                    <span className="text-sm font-medium">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
                </button>
            </div>

            {/* User Footer */}
            <div className="p-4 border-t border-[var(--border-light)]">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-blue-400 flex items-center justify-center text-white text-sm font-semibold">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{userName}</p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{userEmail}</p>
                    </div>
                </div>
                {onSignOut && (
                    <button
                        onClick={onSignOut}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-[var(--text-secondary)] hover:bg-[var(--background-hover)] hover:text-[var(--error)] transition-colors"
                    >
                        <span className="material-symbols-outlined text-[24px]">logout</span>
                        <span className="text-sm font-medium">Sair</span>
                    </button>
                )}
            </div>
        </aside>
    );
}
