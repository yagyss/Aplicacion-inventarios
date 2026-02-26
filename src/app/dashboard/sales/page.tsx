'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Plus,
    ShoppingCart,
    Search,
    Filter,
    Loader2,
    X,
    Minus,
    Check,
} from 'lucide-react';

interface Variant {
    id: string;
    product_id: string;
    color: string;
    size: string;
    stock: number;
    sku: string;
    products: {
        name: string;
        base_price: number;
        base_cost: number;
    };
}

interface CartItem {
    variant: Variant;
    quantity: number;
}

export default function SalesPage() {
    const [variants, setVariants] = useState<Variant[]>([]);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showQuickSale, setShowQuickSale] = useState(false);
    const [channel, setChannel] = useState('tienda_fisica');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sales, setSales] = useState<Array<{
        id: string;
        channel: string;
        total: number;
        created_at: string;
        sale_items: Array<{ quantity: number }>;
    }>>([]);
    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [variantsRes, salesRes] = await Promise.all([
            supabase
                .from('product_variants')
                .select('*, products(name, base_price, base_cost)')
                .gt('stock', 0)
                .order('sku'),
            supabase
                .from('sales')
                .select('*, sale_items(quantity)')
                .order('created_at', { ascending: false })
                .limit(20),
        ]);

        if (variantsRes.data) setVariants(variantsRes.data as unknown as Variant[]);
        if (salesRes.data) setSales(salesRes.data as unknown as typeof sales);
        setLoading(false);
    };

    const addToCart = (variant: Variant) => {
        const existing = cart.find(c => c.variant.id === variant.id);
        if (existing) {
            if (existing.quantity < variant.stock) {
                setCart(cart.map(c =>
                    c.variant.id === variant.id ? { ...c, quantity: c.quantity + 1 } : c
                ));
            }
        } else {
            setCart([...cart, { variant, quantity: 1 }]);
        }
    };

    const removeFromCart = (variantId: string) => {
        setCart(cart.filter(c => c.variant.id !== variantId));
    };

    const updateCartQty = (variantId: string, delta: number) => {
        setCart(cart.map(c => {
            if (c.variant.id !== variantId) return c;
            const newQty = c.quantity + delta;
            if (newQty <= 0) return c;
            if (newQty > c.variant.stock) return c;
            return { ...c, quantity: newQty };
        }));
    };

    const cartTotal = cart.reduce((acc, c) => acc + c.variant.products.base_price * c.quantity, 0);

    const completeSale = async () => {
        if (cart.length === 0) return;
        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: sale, error: saleError } = await supabase
                .from('sales')
                .insert({
                    user_id: user.id,
                    channel,
                    total: cartTotal,
                })
                .select()
                .single();

            if (saleError) throw saleError;

            const saleItems = cart.map(c => ({
                sale_id: sale.id,
                variant_id: c.variant.id,
                quantity: c.quantity,
                unit_price: c.variant.products.base_price,
                unit_cost: c.variant.products.base_cost,
            }));

            await supabase.from('sale_items').insert(saleItems);

            // Decrement stock
            for (const c of cart) {
                await supabase
                    .from('product_variants')
                    .update({ stock: c.variant.stock - c.quantity })
                    .eq('id', c.variant.id);
            }

            setCart([]);
            setShowQuickSale(false);
            loadData();
        } catch (err) {
            console.error(err);
            alert('Error al registrar la venta');
        } finally {
            setSaving(false);
        }
    };

    const filtered = variants.filter(v =>
        v.products?.name?.toLowerCase().includes(search.toLowerCase()) ||
        v.sku?.toLowerCase().includes(search.toLowerCase()) ||
        v.color?.toLowerCase().includes(search.toLowerCase())
    );

    const channels = [
        { value: 'tienda_fisica', label: '🏪 Tienda Física' },
        { value: 'whatsapp', label: '💬 WhatsApp' },
        { value: 'instagram', label: '📸 Instagram' },
        { value: 'online', label: '🌐 Online' },
    ];

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Ventas</h1>
                    <p>Registro rápido multicanal</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowQuickSale(true)}>
                    <Plus size={18} /> Venta Rápida
                </button>
            </div>

            {/* Recent Sales */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 className="section-title">
                    <ShoppingCart size={18} /> Ventas Recientes
                </h3>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '50px' }} />)}
                    </div>
                ) : sales.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                        <ShoppingCart size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        <p>No hay ventas registradas aún</p>
                    </div>
                ) : (
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Canal</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map(sale => (
                                    <tr key={sale.id}>
                                        <td>{new Date(sale.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                                        <td>
                                            <span className="badge badge-primary">
                                                {channels.find(c => c.value === sale.channel)?.label || sale.channel}
                                            </span>
                                        </td>
                                        <td>{sale.sale_items?.reduce((a: number, i: { quantity: number }) => a + i.quantity, 0) || 0} uds</td>
                                        <td style={{ fontWeight: 700 }}>${(sale.total || 0).toLocaleString('es-CO')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Quick Sale Modal */}
            {showQuickSale && (
                <div className="modal-overlay" onClick={() => setShowQuickSale(false)}>
                    <div
                        className="modal-content"
                        style={{ maxWidth: '700px', maxHeight: '90vh' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2>⚡ Venta Rápida</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowQuickSale(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Channel Selector */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            {channels.map(ch => (
                                <button
                                    key={ch.value}
                                    className={`chip ${channel === ch.value ? 'active' : ''}`}
                                    onClick={() => setChannel(ch.value)}
                                >
                                    {ch.label}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input
                                className="input"
                                placeholder="Buscar producto, SKU o color..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ paddingLeft: '2.5rem' }}
                            />
                        </div>

                        {/* Available Products */}
                        <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '1rem' }}>
                            {filtered.slice(0, 20).map(variant => (
                                <div
                                    key={variant.id}
                                    onClick={() => addToCart(variant)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.625rem 0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        transition: 'var(--transition)',
                                        borderBottom: '1px solid var(--color-border)',
                                    }}
                                    className="semaphore-item"
                                >
                                    <div>
                                        <strong style={{ fontSize: '0.85rem' }}>{variant.products?.name}</strong>
                                        <small style={{ display: 'block', color: 'var(--color-text-muted)' }}>
                                            {variant.color} / {variant.size} · {variant.stock} uds
                                        </small>
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        ${(variant.products?.base_price || 0).toLocaleString('es-CO')}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Cart */}
                        {cart.length > 0 && (
                            <>
                                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                                    <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                                        CARRITO ({cart.length} items)
                                    </h4>
                                    {cart.map(item => (
                                        <div key={item.variant.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                                    {item.variant.products?.name} — {item.variant.color}/{item.variant.size}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <button className="btn btn-ghost btn-icon" style={{ width: 28, height: 28 }} onClick={() => updateCartQty(item.variant.id, -1)}>
                                                    <Minus size={14} />
                                                </button>
                                                <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                                                <button className="btn btn-ghost btn-icon" style={{ width: 28, height: 28 }} onClick={() => updateCartQty(item.variant.id, 1)}>
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <span style={{ fontWeight: 600, minWidth: '80px', textAlign: 'right' }}>
                                                ${(item.variant.products.base_price * item.quantity).toLocaleString('es-CO')}
                                            </span>
                                            <button className="btn btn-ghost btn-icon" style={{ width: 28, height: 28 }} onClick={() => removeFromCart(item.variant.id)}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem 0',
                                    borderTop: '1px solid var(--color-border)',
                                    marginTop: '0.75rem',
                                }}>
                                    <div>
                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>TOTAL</span>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                                            ${cartTotal.toLocaleString('es-CO')}
                                        </div>
                                    </div>
                                    <button className="btn btn-primary btn-lg" onClick={completeSale} disabled={saving}>
                                        {saving ? <><Loader2 size={18} /> Procesando...</> : <><Check size={18} /> Confirmar Venta</>}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* FAB for mobile */}
            <button
                className="fab"
                onClick={() => setShowQuickSale(true)}
                style={{ display: 'none' }}
            >
                <Plus size={24} />
            </button>

            <style jsx>{`
        @media (max-width: 768px) {
          .fab { display: flex !important; }
        }
      `}</style>
        </div>
    );
}
