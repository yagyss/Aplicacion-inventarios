'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    BarChart3,
    DollarSign,
    LogOut,
    Menu,
    X,
    TrendingUp,
} from 'lucide-react';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/products', label: 'Productos', icon: Package },
    { href: '/dashboard/sales', label: 'Ventas', icon: ShoppingCart },
    { href: '/dashboard/expenses', label: 'Gastos', icon: DollarSign },
    { href: '/dashboard/analytics', label: 'Analítica', icon: BarChart3 },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<{ email?: string; business_name?: string } | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser({
                    email: user.email,
                    business_name: user.user_metadata?.business_name || 'Mi Marca',
                });
            }
        };
        getUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    };

    const initials = user?.business_name
        ? user.business_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : 'ST';

    return (
        <div className="dashboard-layout">
            {/* Sidebar - Desktop */}
            {pathname !== '/dashboard' && (
                <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                    <div className="sidebar-logo">
                        <TrendingUp size={28} style={{ color: 'var(--color-primary-light)' }} />
                        <h2>Stokly</h2>
                    </div>

                    <nav className="sidebar-nav">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">{initials}</div>
                        <div className="sidebar-user-info">
                            <span>{user?.business_name}</span>
                            <small>{user?.email}</small>
                        </div>
                        <button className="btn-ghost" onClick={handleLogout} title="Cerrar sesión">
                            <LogOut size={18} />
                        </button>
                    </div>
                </aside>
            )}

            {/* Mobile Header */}
            {pathname !== '/dashboard' && (
                <header className="mobile-header">
                    <button
                        className="btn-ghost"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <h2>Stokly</h2>
                    <div className="sidebar-user-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                        {initials}
                    </div>
                </header>
            )}

            <main className={pathname === '/dashboard' ? '' : 'main-content'} style={pathname === '/dashboard' ? { width: '100%', flex: 1 } : undefined}>
                {children}
            </main>

            {/* Mobile Bottom Nav */}
            {pathname !== '/dashboard' && (
                <nav className="mobile-nav">
                    <div className="mobile-nav-inner">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`mobile-nav-link ${isActive(item.href) ? 'active' : ''}`}
                            >
                                <item.icon size={22} />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </nav>
            )}

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 35,
                    }}
                />
            )}
        </div>
    );
}
