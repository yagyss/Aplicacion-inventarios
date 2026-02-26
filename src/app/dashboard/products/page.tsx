'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
    Plus,
    Search,
    Package,
    Edit2,
    Trash2,
    Eye,
} from 'lucide-react';

interface Product {
    id: string;
    name: string;
    category: string;
    brand: string;
    base_cost: number;
    base_price: number;
    available_colors: string[];
    available_sizes: string[];
    created_at: string;
    total_stock?: number;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setProducts(data);
        }
        setLoading(false);
    };

    const deleteProduct = async (id: string) => {
        if (!confirm('¿Eliminar este producto y todas sus variantes?')) return;
        await supabase.from('product_variants').delete().eq('product_id', id);
        await supabase.from('products').delete().eq('id', id);
        setProducts(products.filter(p => p.id !== id));
    };

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase()) ||
        p.brand?.toLowerCase().includes(search.toLowerCase())
    );

    const formatPrice = (n: number) => `$${(n || 0).toLocaleString('es-CO')}`;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Productos</h1>
                    <p>{products.length} productos · Matriz de Curva de Tallas</p>
                </div>
                <Link href="/dashboard/products/new" className="btn btn-primary">
                    <Plus size={18} /> Nuevo Producto
                </Link>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '400px' }}>
                <Search
                    size={18}
                    style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--color-text-muted)',
                    }}
                />
                <input
                    type="text"
                    className="input"
                    placeholder="Buscar por nombre, categoría o marca..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ paddingLeft: '2.75rem' }}
                />
            </div>

            {/* Products Table */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton" style={{ height: '60px' }} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-card" style={{
                    padding: '3rem',
                    textAlign: 'center',
                }}>
                    <Package size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>
                        {search ? 'Sin resultados' : 'Aún no tienes productos'}
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                        {search
                            ? 'Intenta con otra búsqueda'
                            : 'Crea tu primer producto con la Matriz de Curva de Tallas'
                        }
                    </p>
                    {!search && (
                        <Link href="/dashboard/products/new" className="btn btn-primary">
                            <Plus size={18} /> Crear Producto
                        </Link>
                    )}
                </div>
            ) : (
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Costo</th>
                                <th>Precio</th>
                                <th>Margen</th>
                                <th>Colores</th>
                                <th>Tallas</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((product) => {
                                const margin = product.base_price && product.base_cost
                                    ? (((product.base_price - product.base_cost) / product.base_price) * 100).toFixed(1)
                                    : '0';
                                return (
                                    <tr key={product.id}>
                                        <td>
                                            <div>
                                                <strong>{product.name}</strong>
                                                {product.brand && (
                                                    <small style={{ display: 'block', color: 'var(--color-text-muted)' }}>
                                                        {product.brand}
                                                    </small>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-primary">{product.category || '—'}</span>
                                        </td>
                                        <td>{formatPrice(product.base_cost)}</td>
                                        <td style={{ fontWeight: 600 }}>{formatPrice(product.base_price)}</td>
                                        <td>
                                            <span className={`badge ${Number(margin) >= 30 ? 'badge-success' : Number(margin) >= 15 ? 'badge-warning' : 'badge-danger'}`}>
                                                {margin}%
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                                {product.available_colors?.length ? product.available_colors.map(c => (
                                                    <span key={c} className="badge" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)' }}>{c}</span>
                                                )) : '—'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                                {product.available_sizes?.length ? product.available_sizes.map(s => (
                                                    <span key={s} className="badge" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)' }}>{s}</span>
                                                )) : '—'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <Link
                                                    href={`/dashboard/products/${product.id}`}
                                                    className="btn btn-ghost btn-icon"
                                                    title="Ver variantes"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                <button
                                                    className="btn btn-ghost btn-icon"
                                                    onClick={() => deleteProduct(product.id)}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} style={{ color: 'var(--color-danger)' }} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
