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

    // Data states
    const [totalSales, setTotalSales] = useState(0);
    const [salesCount, setSalesCount] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [digitalAds, setDigitalAds] = useState(0);
    const [totalInventory, setTotalInventory] = useState(0);
    const [activeSkus, setActiveSkus] = useState(0);
    const [costOfGoods, setCostOfGoods] = useState(0);
    const [semaphoreItems, setSemaphoreItems] = useState<SemaphoreItem[]>([]);

    const supabase = createClient();

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Buenos días');
        else if (hour < 18) setGreeting('Buenas tardes');
        else setGreeting('Buenas noches');

        const loadDashboardData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.business_name) {
                setBusinessName(user.user_metadata.business_name);
            }

            // Fetch Real Data in Parallel
            const [
                { data: sales },
                { data: expenses },
                { data: variants },
                { data: products }
            ] = await Promise.all([
                supabase.from('sales').select('total, created_at'),
                supabase.from('expenses').select('amount, category'),
                supabase.from('product_variants').select('id, color, size, stock, product_id, cost_override'),
                supabase.from('products').select('id, name, base_cost')
            ]);

            // Calculate Sales
            const today = new Date().toISOString().split('T')[0];
            let todaySales = 0;
            let totalRev = 0;
            if (sales) {
                setSalesCount(sales.length);
                sales.forEach(s => {
                    const val = Number(s.total) || 0;
                    totalRev += val;
                    if (s.created_at.startsWith(today)) todaySales += val;
                });
                setTotalSales(totalRev);
            }

            // Calculate Expenses & CAC
            let expTotal = 0;
            let adsTotal = 0;
            if (expenses) {
                expenses.forEach(e => {
                    const val = Number(e.amount) || 0;
                    expTotal += val;
                    if (e.category === 'Pauta Digital' || e.category === 'Marketing') adsTotal += val;
                });
                setTotalExpenses(expTotal);
                setDigitalAds(adsTotal);
            }

            // Calculate Inventory & COGS
            let invCount = 0;
            let skuCount = 0;
            let cogsTotal = 0;
            const alerts: SemaphoreItem[] = [];

            if (variants && products) {
                skuCount = variants.length;
                Object.values(variants).forEach(v => {
                    invCount += v.stock || 0;

                    const parent = products.find(p => p.id === v.product_id);
                    const cost = v.cost_override || parent?.base_cost || 0;

                    // Simple logic for the semaphore
                    if (v.stock <= 3 && v.stock > 0) {
                        alerts.push({
                            name: parent?.name || 'Producto',
                            variant: `${v.color} / ${v.size}`,
                            stock: v.stock,
                            status: 'yellow',
                            action: 'Stock bajo - Reordenar'
                        });
                    } else if (v.stock === 0) {
                        alerts.push({
                            name: parent?.name || 'Producto',
                            variant: `${v.color} / ${v.size}`,
                            stock: v.stock,
                            status: 'red',
                            action: 'Agotado (Quiebre)'
                        });
                    } else if (v.stock > 30) {
                        alerts.push({
                            name: parent?.name || 'Producto',
                            variant: `${v.color} / ${v.size}`,
                            stock: v.stock,
                            status: 'green',
                            action: 'Alto stock - Promocionar'
                        });
                    }
                });
                setTotalInventory(invCount);
                setActiveSkus(skuCount);
                setSemaphoreItems(alerts.slice(0, 5)); // Show top 5 alerts
            }
        };

        loadDashboardData();
    }, []);

    // Derived Metrics
    const format = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;
    const cac = salesCount > 0 ? (digitalAds / salesCount) : 0;
    const realROI = digitalAds > 0 ? ((totalSales - totalExpenses) / digitalAds) * 100 : 0;
    const netProfit = totalSales - totalExpenses;
    const netMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    const kpis: KPI[] = [
        {
            label: 'Utilidad Neta General',
            value: format(netProfit),
            trend: netProfit >= 0 ? 'Rentable' : 'Pérdida',
            trendDir: netProfit >= 0 ? 'up' : 'down',
            icon: Target,
            iconColor: netProfit >= 0 ? 'success' : 'danger',
        },
        {
            label: 'Ingresos Totales',
            value: format(totalSales),
            trend: `${salesCount} ventas`,
            trendDir: 'up',
            icon: ShoppingCart,
            iconColor: 'success',
        },
        {
            label: 'Inventario Total',
            value: totalInventory.toString(),
            trend: `${activeSkus} SKUs activos`,
            trendDir: 'up',
            icon: Package,
            iconColor: 'accent',
        },
        {
            label: 'CAC Promedio',
            value: format(cac),
            trend: 'Costo adquisición',
            trendDir: cac > 10000 ? 'down' : 'up',
            icon: DollarSign,
            iconColor: 'warning',
        },
        {
            label: 'Gastos Operativos',
            value: format(totalExpenses),
            trend: 'Todos los gastos',
            trendDir: 'down',
            icon: Activity,
            iconColor: 'danger',
        },
        {
            label: 'Alertas de Stock',
            value: semaphoreItems.length.toString(),
            trend: 'Requieren atención',
            trendDir: 'down',
            icon: AlertTriangle,
            iconColor: 'warning',
        },
    ];

    const chartData = [65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100, 88];

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>{greeting}, {businessName || 'emprendedor'} 👋</h1>
                    <p>Aquí está el pulso financiero de tu marca (Datos Reales)</p>
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
                        Tráfico vs Ventas (Próximamente Analytics)
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
                            />
                        ))}
                    </div>
                </div>

                {/* Inventory Semaphore */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div className="section-title">
                        <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
                        Semáforo de Inventario (Real)
                    </div>
                    <div className="semaphore-list">
                        {semaphoreItems.length === 0 ? (
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center', margin: '2rem 0' }}>
                                Todo tu inventario está en niveles óptimos. ✅
                            </p>
                        ) : (
                            semaphoreItems.map((item, i) => (
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
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
