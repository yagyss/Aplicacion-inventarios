'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, Loader2, Package, Tag, Layers, Edit2 } from 'lucide-react';
import Link from 'next/link';

interface Product {
    id: string;
    name: string;
    category: string;
    brand: string;
    base_cost: number;
    base_price: number;
}

interface Variant {
    id: string;
    color: string;
    size: string;
    stock: number;
    sku: string;
    cost_override: number | null;
    price_override: number | null;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const productId = resolvedParams.id;

    const [product, setProduct] = useState<Product | null>(null);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changes, setChanges] = useState<{ [id: string]: Partial<Variant> }>({});

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        loadProduct();
    }, [productId]);

    const loadProduct = async () => {
        setLoading(true);
        const [productRes, variantsRes] = await Promise.all([
            supabase.from('products').select('*').eq('id', productId).single(),
            supabase.from('product_variants').select('*').eq('product_id', productId).order('color').order('size')
        ]);

        if (productRes.data) setProduct(productRes.data);
        if (variantsRes.data) setVariants(variantsRes.data);
        setLoading(false);
    };

    const handleVariantChange = (id: string, field: keyof Variant, value: string | number) => {
        setChanges(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value === '' ? null : Number(value)
            }
        }));
    };

    const getVariantValue = (variant: Variant, field: keyof Variant) => {
        if (changes[variant.id] && changes[variant.id][field] !== undefined) {
            return changes[variant.id][field];
        }
        return variant[field];
    };

    const handleSave = async () => {
        const variantUpdates = Object.entries(changes).map(([id, updates]) => ({
            id,
            ...updates
        }));

        if (variantUpdates.length === 0) return;

        setSaving(true);
        try {
            for (const update of variantUpdates) {
                await supabase
                    .from('product_variants')
                    .update(update)
                    .eq('id', update.id);
            }
            setChanges({});
            await loadProduct();
        } catch (error) {
            console.error('Error updating variants:', error);
            alert('Error al guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="spinner" /></div>;
    if (!product) return <div>Producto no encontrado</div>;

    const totalStock = variants.reduce((acc, v) => acc + (v.stock || 0), 0);
    const hasChanges = Object.keys(changes).length > 0;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/dashboard/products" className="btn btn-ghost btn-icon">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1>{product.name}</h1>
                        <p>{product.brand ? `${product.brand} · ` : ''}{product.category || 'Sin categoría'}</p>
                    </div>
                </div>
                {hasChanges && (
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? <><Loader2 size={18} className="spinner" /> Guardando...</> : <><Save size={18} /> Guardar Cambios</>}
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 250px', gap: '1.5rem', alignItems: 'start' }}>

                {/* Variants List */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 className="section-title" style={{ margin: 0 }}><Layers size={18} /> Variantes y Tallas</h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            Edita el stock de cada variante
                        </div>
                    </div>

                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Color</th>
                                    <th>Talla</th>
                                    <th>Stock (Uds)</th>
                                    <th>SKU</th>
                                </tr>
                            </thead>
                            <tbody>
                                {variants.map((v) => (
                                    <tr key={v.id}>
                                        <td><div className="badge badge-primary">{v.color}</div></td>
                                        <td><div className="badge badge-accent">{v.size}</div></td>
                                        <td style={{ width: '150px' }}>
                                            <input
                                                type="number"
                                                className="input"
                                                style={{ padding: '0.5rem', width: '100px', textAlign: 'center', borderColor: changes[v.id]?.stock !== undefined ? 'var(--color-primary)' : '' }}
                                                value={getVariantValue(v, 'stock') ?? ''}
                                                onChange={(e) => handleVariantChange(v.id, 'stock', e.target.value)}
                                            />
                                        </td>
                                        <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{v.sku}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 className="section-title"><Package size={18} /> Resumen</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Stock Total</span>
                                <span style={{ fontWeight: 600, color: 'var(--color-primary-light)' }}>{totalStock} uds</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Variantes</span>
                                <span style={{ fontWeight: 600 }}>{variants.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 className="section-title"><Tag size={18} /> Precios Base</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Costo Unitario</label>
                                <div style={{ fontWeight: 600 }}>${(product.base_cost || 0).toLocaleString('es-CO')}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Precio Venta</label>
                                <div style={{ fontWeight: 600, color: 'var(--color-success)' }}>${(product.base_price || 0).toLocaleString('es-CO')}</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
