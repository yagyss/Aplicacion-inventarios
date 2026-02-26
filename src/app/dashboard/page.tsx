'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Package,
    ShoppingCart,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Target,
} from 'lucide-react';

interface KPI {
    label: string;
    value: string;
    trend: string;
    trendDir: 'up' | 'down';
    icon: React.ElementType;
    iconColor: string;
}

interface SemaphoreItem {
    name: string;
    variant: string;
    stock: number;
    status: 'red' | 'yellow' | 'green';
    action: string;
}

export default function DashboardPage() {
    const [greeting, setGreeting] = useState('');
    const [businessName, setBusinessName] = useState('');
    const supabase = createClient();

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Buenos días');
        else if (hour < 18) setGreeting('Buenas tardes');
        else setGreeting('Buenas noches');

        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.business_name) {
                setBusinessName(user.user_metadata.business_name);
            }
        };
        getUser();
    }, []);

    const kpis: KPI[] = [
        {
            label: 'ROI Real Hoy',
            value: '$2,847',
            trend: '+12.5%',
            trendDir: 'up',
            icon: Target,
            iconColor: 'primary',
        },
        {
            label: 'Ventas del Día',
            value: '23',
            trend: '+8 vs ayer',
            trendDir: 'up',
            icon: ShoppingCart,
            iconColor: 'success',
        },
        {
            label: 'Inventario Total',
            value: '1,245',
            trend: '87 SKUs activos',
            trendDir: 'up',
            icon: Package,
            iconColor: 'accent',
        },
        {
            label: 'CAC Promedio',
            value: '$4.20',
            trend: '-$0.80 vs semana',
            trendDir: 'down',
            icon: DollarSign,
            iconColor: 'warning',
        },
        {
            label: 'Margen Neto',
            value: '34.2%',
            trend: '+2.1%',
            trendDir: 'up',
            icon: Activity,
            iconColor: 'success',
        },
        {
            label: 'Alertas Activas',
            value: '3',
            trend: '2 liquidar, 1 reordenar',
            trendDir: 'down',
            icon: AlertTriangle,
            iconColor: 'danger',
        },
    ];

    const semaphoreItems: SemaphoreItem[] = [
        {
            name: 'Blusa Floral',
            variant: 'Rosa / Talla L',
            stock: 47,
            status: 'red',
            action: 'ROI negativo — Liquidar',
        },
        {
            name: 'Jean Skinny',
            variant: 'Negro / Talla 28',
            stock: 3,
            status: 'green',
            action: 'Alta rotación — Reordenar',
        },
        {
            name: 'Vestido Midi',
            variant: 'Azul / Talla M',
            stock: 15,
            status: 'yellow',
            action: 'Monitorear stock',
        },
        {
            name: 'Crop Top',
            variant: 'Blanco / Talla S',
            stock: 2,
            status: 'green',
            action: 'Quiebre inminente — Reordenar',
        },
        {
            name: 'Falda Plisada',
            variant: 'Beige / Talla XL',
            stock: 38,
            status: 'red',
            action: 'Sin ventas 30 días — Liquidar',
        },
    ];

    const chartData = [65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100, 88];

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>{greeting}, {businessName || 'emprendedor'} 👋</h1>
                    <p>Aquí está el pulso financiero de tu marca hoy</p>
                </div>
            </div>

            {/* Bento Grid KPIs */}
            <div className="bento-grid" style={{ marginBottom: '2rem' }}>
                {kpis.map((kpi, i) => (
                    <div
                        key={kpi.label}
                        className="glass-card kpi-card"
                        style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
                    >
                        <div className="kpi-header">
                            <div className={`kpi-icon ${kpi.iconColor}`}>
                                <kpi.icon size={22} />
                            </div>
                            <span className={`kpi-trend ${kpi.trendDir}`}>
                                {kpi.trendDir === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {kpi.trend}
                            </span>
                        </div>
                        <div className="kpi-value">{kpi.value}</div>
                        <div className="kpi-label">{kpi.label}</div>
                    </div>
                ))}
            </div>

            {/* Bottom Section: Chart + Semaphore */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {/* Sales Chart */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div className="section-title">
                        <TrendingUp size={18} style={{ color: 'var(--color-primary-light)' }} />
                        Ventas por Curva — Últimos 12 días
                    </div>
                    <div className="chart-area">
                        {chartData.map((val, i) => (
                            <div
                                key={i}
                                className="chart-bar"
                                style={{
                                    height: `${val}%`,
                                    animationDelay: `${i * 0.05}s`,
                                }}
                                title={`Día ${i + 1}: ${val} unidades`}
                            />
                        ))}
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.7rem',
                        color: 'var(--color-text-muted)',
                        marginTop: '0.5rem',
                    }}>
                        <span>Hace 12 días</span>
                        <span>Hoy</span>
                    </div>
                </div>

                {/* Inventory Semaphore */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div className="section-title">
                        <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
                        Semáforo de Inventario
                    </div>
                    <div className="semaphore-list">
                        {semaphoreItems.map((item, i) => (
                            <div key={i} className="semaphore-item">
                                <div className="traffic-light">
                                    <div className={`traffic-dot ${item.status}`} />
                                </div>
                                <div className="semaphore-item-info">
                                    <strong>{item.name} — {item.variant}</strong>
                                    <small>{item.stock} uds · {item.action}</small>
                                </div>
                                <span className={`badge badge-${item.status === 'red' ? 'danger' : item.status === 'green' ? 'success' : 'warning'}`}>
                                    {item.stock}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
