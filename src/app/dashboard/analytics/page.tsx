'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    BarChart3, Target, TrendingUp, AlertTriangle,
    DollarSign, ArrowUpRight, ArrowDownRight, Activity,
    Package, Tag, Ruler, Award
} from 'lucide-react';

export default function AnalyticsPage() {
    const [salesData, setSalesData] = useState<{ total: number; cost: number; count: number }>({ total: 0, cost: 0, count: 0 });
    const [expensesTotal, setExpensesTotal] = useState(0);
    const [adSpend, setAdSpend] = useState(0);
    const [topProducts, setTopProducts] = useState<{ name: string; qty: number }[]>([]);
    const [topBrands, setTopBrands] = useState<{ name: string; qty: number }[]>([]);
    const [topSizes, setTopSizes] = useState<{ name: string; qty: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => { loadAnalytics(); }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const [salesRes, itemsRes, expensesRes] = await Promise.all([
                supabase.from('sales').select('total'),
                supabase.from('sale_items').select(`
                    quantity, unit_cost,
                    product_variants (
                        size,
                        products (
                            name,
                            brand
                        )
                    )
                `),
                supabase.from('expenses').select('amount, category'),
            ]);

            if (salesRes.error) console.error('Sales Error:', salesRes.error);
            if (itemsRes.error) console.error('Items Error:', itemsRes.error);
            if (expensesRes.error) console.error('Expenses Error:', expensesRes.error);

            if (salesRes.data) {
                const total = salesRes.data.reduce((a, s) => a + (Number(s.total) || 0), 0);
                setSalesData(prev => ({ ...prev, total, count: salesRes.data.length }));
            }

            if (itemsRes.data) {
                const cost = itemsRes.data.reduce((a, i) => a + (Number(i.unit_cost) || 0) * (Number(i.quantity) || 0), 0);
                setSalesData(prev => ({ ...prev, cost }));

                // Calculate Top Sellers
                const productSales: Record<string, number> = {};
                const brandSales: Record<string, number> = {};
                const sizeSales: Record<string, number> = {};

                itemsRes.data.forEach((item: any) => {
                    const qty = Number(item.quantity) || 0;
                    const variant = item.product_variants;
                    if (variant) {
                        const size = variant.size;
                        const productInfo = variant.products; // For many-to-one, it's usually an object, but sometimes an array
                        const product = Array.isArray(productInfo) ? productInfo[0] : productInfo;

                        if (size) {
                            sizeSales[size] = (sizeSales[size] || 0) + qty;
                        }

                        if (product) {
                            const name = product.name;
                            const brand = product.brand && product.brand.trim() !== '' ? product.brand : 'Sin Marca';

                            if (name) productSales[name] = (productSales[name] || 0) + qty;
                            if (brand) brandSales[brand] = (brandSales[brand] || 0) + qty;
                        }
                    }
                });

                const getTop = (obj: Record<string, number>, num = 5) =>
                    Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, num).map(([name, qty]) => ({ name, qty }));

                setTopProducts(getTop(productSales, 5));
                setTopBrands(getTop(brandSales, 5));
                setTopSizes(getTop(sizeSales, 6));
            }

            if (expensesRes.data) {
                const total = expensesRes.data.reduce((a, e) => a + (Number(e.amount) || 0), 0);
                const ads = expensesRes.data.filter(e => e.category === 'Pauta Digital' || e.category === 'Marketing').reduce((a, e) => a + (Number(e.amount) || 0), 0);
                setExpensesTotal(total);
                setAdSpend(ads);
            }
        } catch (e) {
            console.error('Error loading analytics:', e);
        } finally {
            setLoading(false);
        }
    };

    const revenue = salesData.total;
    const cogs = salesData.cost;
    const grossProfit = revenue - cogs;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netProfit = grossProfit - expensesTotal;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const cac = salesData.count > 0 ? adSpend / salesData.count : 0;
    const avgTicket = salesData.count > 0 ? revenue / salesData.count : 0;
    const realROI = adSpend > 0 ? ((revenue - cogs - adSpend) / adSpend) * 100 : 0;

    const format = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;

    const metrics = [
        { label: 'Ingresos Totales', value: format(revenue), icon: DollarSign, color: 'primary', trend: '' },
        { label: 'Utilidad Bruta', value: format(grossProfit), icon: TrendingUp, color: 'success', trend: `${grossMargin.toFixed(1)}% margen` },
        { label: 'Utilidad Neta', value: format(netProfit), icon: Activity, color: netProfit >= 0 ? 'success' : 'danger', trend: `${netMargin.toFixed(1)}% margen` },
        { label: 'CAC Promedio', value: format(cac), icon: Target, color: 'warning', trend: `${salesData.count} ventas` },
        { label: 'Ticket Promedio', value: format(avgTicket), icon: BarChart3, color: 'accent', trend: '' },
        { label: 'ROI Real de Pauta', value: `${realROI.toFixed(1)}%`, icon: Target, color: realROI >= 0 ? 'success' : 'danger', trend: `$${Math.round(adSpend).toLocaleString('es-CO')} invertido` },
    ];

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Analítica Financiera</h1>
                    <p>Unit Economics · Rentabilidad Real · ROI de Pauta</p>
                </div>
            </div>

            {/* Formula */}
            <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Fórmula Stokly
                </p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary-light)' }}>
                    Utilidad Real = Precio − COGS − CAC − Gastos Operativos
                </p>
            </div>

            {loading ? (
                <div className="bento-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: '140px' }} />)}
                </div>
            ) : (
                <>
                    <div className="bento-grid" style={{ marginBottom: '2rem' }}>
                        {metrics.map((m, i) => (
                            <div key={m.label} className="glass-card kpi-card animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
                                <div className="kpi-header">
                                    <div className={`kpi-icon ${m.color}`}><m.icon size={22} /></div>
                                    {m.trend && (
                                        <span className="kpi-trend up" style={{ fontSize: '0.75rem' }}>
                                            {m.trend}
                                        </span>
                                    )}
                                </div>
                                <div className="kpi-value">{m.value}</div>
                                <div className="kpi-label">{m.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* CAC Alert */}
                    {cac > 0 && avgTicket > 0 && cac >= avgTicket * 0.3 && (
                        <div className="glass-card" style={{ padding: '1.25rem', borderColor: 'var(--color-danger)', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <AlertTriangle size={24} style={{ color: 'var(--color-danger)' }} />
                                <div>
                                    <strong style={{ color: 'var(--color-danger)' }}>⚠️ Alerta de CAC Elevado</strong>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                                        Tu costo de adquisición ({format(cac)}) representa el {((cac / avgTicket) * 100).toFixed(0)}% del ticket promedio.
                                        Considera optimizar tu pauta o redirigir presupuesto a canales orgánicos.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Breakdown */}
                    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <h3 className="section-title"><BarChart3 size={18} /> Desglose Financiero</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[
                                { label: 'Ingresos', value: revenue, pct: 100, color: 'var(--color-primary)' },
                                { label: 'Costo de Producto (COGS)', value: cogs, pct: revenue > 0 ? (cogs / revenue) * 100 : 0, color: 'var(--color-warning)' },
                                { label: 'Gastos Operativos', value: expensesTotal - adSpend, pct: revenue > 0 ? ((expensesTotal - adSpend) / revenue) * 100 : 0, color: 'var(--color-text-muted)' },
                                { label: 'Pauta Publicitaria', value: adSpend, pct: revenue > 0 ? (adSpend / revenue) * 100 : 0, color: 'var(--color-danger)' },
                                { label: 'Utilidad Neta', value: netProfit, pct: revenue > 0 ? (netProfit / revenue) * 100 : 0, color: netProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' },
                            ].map(item => (
                                <div key={item.label}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                        <span style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
                                        <span style={{ fontWeight: 600 }}>{format(item.value)} ({item.pct.toFixed(1)}%)</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'var(--color-bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${Math.min(Math.abs(item.pct), 100)}%`, background: item.color, borderRadius: '3px', transition: 'width 0.8s ease' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rankings / Top Sellers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {/* Top Products */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 className="section-title"><Award size={18} style={{ color: 'var(--color-warning)' }} /> Top Conjuntos / Modelos</h3>
                            {topProducts.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {topProducts.map((p, idx) => (
                                        <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-sm)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 700, width: '16px' }}>{idx + 1}.</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{p.name}</span>
                                            </div>
                                            <span className="badge badge-primary">{p.qty} unids</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem 0' }}>No hay datos suficientes</p>
                            )}
                        </div>

                        {/* Top Brands */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 className="section-title"><Tag size={18} style={{ color: 'var(--color-accent)' }} /> Marcas Más Vendidas</h3>
                            {topBrands.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {topBrands.map((b, idx) => (
                                        <div key={b.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-sm)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 700, width: '16px' }}>{idx + 1}.</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{b.name}</span>
                                            </div>
                                            <span className="badge badge-success">{b.qty} unids</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem 0' }}>No hay datos suficientes</p>
                            )}
                        </div>

                        {/* Top Sizes */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 className="section-title"><Ruler size={18} style={{ color: 'var(--color-primary-light)' }} /> Tallas Populares</h3>
                            {topSizes.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {topSizes.map((s) => (
                                        <div key={s.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.75rem', background: 'var(--color-bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', flex: '1', minWidth: '60px' }}>
                                            <span style={{ fontSize: '1rem', fontWeight: 800 }}>{s.name}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{s.qty} vend.</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem 0' }}>No hay datos suficientes</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
