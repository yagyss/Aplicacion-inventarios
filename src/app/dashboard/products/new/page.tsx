'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
    ArrowLeft,
    Save,
    Plus,
    X,
    Loader2,
    Grid3X3,
    Palette,
    Ruler,
    Package,
} from 'lucide-react';
import Link from 'next/link';

const PREDEFINED_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2', '4', '6', '8', '10', '12', '14', '16', '18', '28', '29', '30', '31', '32', '33', '34', '36', '38'];
const PREDEFINED_COLORS = [
    'Negro', 'Blanco', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Rosa',
    'Morado', 'Naranja', 'Gris', 'Beige', 'Marrón', 'Coral', 'Turquesa',
    'Lavanda', 'Oliva', 'Terracota', 'Crema', 'Vino', 'Celeste',
];

export default function NewProductPage() {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [brand, setBrand] = useState('');
    const [baseCost, setBaseCost] = useState('');
    const [basePrice, setBasePrice] = useState('');
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [customColor, setCustomColor] = useState('');
    const [stockMatrix, setStockMatrix] = useState<Record<string, Record<string, number>>>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const toggleColor = (color: string) => {
        setSelectedColors(prev =>
            prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
        );
    };

    const toggleSize = (size: string) => {
        setSelectedSizes(prev =>
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    const addCustomColor = () => {
        if (customColor.trim() && !selectedColors.includes(customColor.trim())) {
            setSelectedColors(prev => [...prev, customColor.trim()]);
            setCustomColor('');
        }
    };

    const getStock = (color: string, size: string) => {
        return stockMatrix[color]?.[size] || 0;
    };

    const setStock = (color: string, size: string, value: number) => {
        setStockMatrix(prev => ({
            ...prev,
            [color]: {
                ...prev[color],
                [size]: value,
            },
        }));
    };

    const fillAllStock = (value: number) => {
        const newMatrix: Record<string, Record<string, number>> = {};
        selectedColors.forEach(color => {
            newMatrix[color] = {};
            selectedSizes.forEach(size => {
                newMatrix[color][size] = value;
            });
        });
        setStockMatrix(newMatrix);
    };

    const totalVariants = selectedColors.length * selectedSizes.length;
    const totalUnits = Object.values(stockMatrix).reduce(
        (acc, sizes) => acc + Object.values(sizes).reduce((a, b) => a + b, 0), 0
    );

    const handleSave = async () => {
        if (!name.trim()) { setError('El nombre es requerido'); return; }
        if (selectedColors.length === 0) { setError('Selecciona al menos un color'); return; }
        if (selectedSizes.length === 0) { setError('Selecciona al menos una talla'); return; }

        setSaving(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setError('No autenticado'); setSaving(false); return; }

            // Create product
            const { data: product, error: productError } = await supabase
                .from('products')
                .insert({
                    user_id: user.id,
                    name: name.trim(),
                    category: category.trim() || null,
                    brand: brand.trim() || null,
                    base_cost: Number(baseCost) || 0,
                    base_price: Number(basePrice) || 0,
                    available_colors: selectedColors,
                    available_sizes: selectedSizes,
                })
                .select()
                .single();

            if (productError) throw productError;

            // Create all variants
            const variants = selectedColors.flatMap(color =>
                selectedSizes.map(size => ({
                    product_id: product.id,
                    color,
                    size,
                    stock: getStock(color, size),
                    sku: `${name.slice(0, 3).toUpperCase()}-${color.slice(0, 3).toUpperCase()}-${size}`,
                }))
            );

            const { error: variantError } = await supabase
                .from('product_variants')
                .insert(variants);

            if (variantError) throw variantError;

            router.push('/dashboard/products');
        } catch (err: any) {
            console.error('Error detallado:', err);
            const errorMessage = err?.message || err?.error_description || 'Error al guardar';
            setError(`Error de base de datos: ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/dashboard/products" className="btn btn-ghost btn-icon">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1>Nuevo Producto</h1>
                        <p>Crea un producto con Matriz de Curva de Tallas</p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? <><Loader2 size={18} /> Guardando...</> : <><Save size={18} /> Guardar Producto</>}
                </button>
            </div>

            {error && <div className="auth-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Left: Product Info */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 className="section-title"><Package size={18} /> Información del Producto</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Nombre del producto *</label>
                            <input
                                className="input"
                                placeholder="Ej: Blusa Floral Primavera"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group">
                                <label>Categoría</label>
                                <input
                                    className="input"
                                    placeholder="Ej: Blusas"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                />
                            </div>
                            <div className="input-group">
                                <label>Marca</label>
                                <input
                                    className="input"
                                    placeholder="Ej: Mi Marca"
                                    value={brand}
                                    onChange={(e) => setBrand(e.target.value)}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group">
                                <label>Costo Base ($)</label>
                                <input
                                    className="input"
                                    type="number"
                                    placeholder="25000"
                                    value={baseCost}
                                    onChange={(e) => setBaseCost(e.target.value)}
                                />
                            </div>
                            <div className="input-group">
                                <label>Precio de Venta ($)</label>
                                <input
                                    className="input"
                                    type="number"
                                    placeholder="65000"
                                    value={basePrice}
                                    onChange={(e) => setBasePrice(e.target.value)}
                                />
                            </div>
                        </div>
                        {baseCost && basePrice && Number(basePrice) > 0 && (
                            <div style={{
                                padding: '0.875rem',
                                background: 'var(--color-bg-input)',
                                borderRadius: 'var(--radius)',
                                display: 'flex',
                                justifyContent: 'space-between',
                            }}>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Margen Bruto</span>
                                <span style={{
                                    fontWeight: 700,
                                    color: ((Number(basePrice) - Number(baseCost)) / Number(basePrice)) * 100 >= 30
                                        ? 'var(--color-success)'
                                        : 'var(--color-warning)',
                                }}>
                                    {(((Number(basePrice) - Number(baseCost)) / Number(basePrice)) * 100).toFixed(1)}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Colors & Sizes */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 className="section-title"><Palette size={18} /> Colores</h3>
                    <div className="chip-group" style={{ marginBottom: '1rem' }}>
                        {PREDEFINED_COLORS.map(color => (
                            <button
                                key={color}
                                className={`chip ${selectedColors.includes(color) ? 'active' : ''}`}
                                onClick={() => toggleColor(color)}
                            >
                                {color}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                        <input
                            className="input"
                            placeholder="Color personalizado"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addCustomColor()}
                            style={{ flex: 1 }}
                        />
                        <button className="btn btn-secondary" onClick={addCustomColor}>
                            <Plus size={16} />
                        </button>
                    </div>

                    <h3 className="section-title"><Ruler size={18} /> Tallas</h3>
                    <div className="chip-group">
                        {PREDEFINED_SIZES.map(size => (
                            <button
                                key={size}
                                className={`chip ${selectedSizes.includes(size) ? 'active' : ''}`}
                                onClick={() => toggleSize(size)}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Size Curve Matrix */}
            {selectedColors.length > 0 && selectedSizes.length > 0 && (
                <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 className="section-title" style={{ margin: 0 }}>
                            <Grid3X3 size={18} /> Matriz de Curva de Tallas
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span className="badge badge-primary">{totalVariants} variantes</span>
                            <span className="badge badge-success">{totalUnits} unidades</span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-sm btn-secondary" onClick={() => fillAllStock(5)}>
                                    Llenar 5
                                </button>
                                <button className="btn btn-sm btn-secondary" onClick={() => fillAllStock(10)}>
                                    Llenar 10
                                </button>
                                <button className="btn btn-sm btn-secondary" onClick={() => fillAllStock(0)}>
                                    Limpiar
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="matrix-container">
                        <table className="size-matrix">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', paddingLeft: '1rem' }}>Color</th>
                                    {selectedSizes.map(size => (
                                        <th key={size}>{size}</th>
                                    ))}
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedColors.map(color => {
                                    const rowTotal = selectedSizes.reduce((acc, size) => acc + getStock(color, size), 0);
                                    return (
                                        <tr key={color}>
                                            <td className="color-label">{color}</td>
                                            {selectedSizes.map(size => (
                                                <td key={size}>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={getStock(color, size) || ''}
                                                        onChange={(e) => setStock(color, size, Number(e.target.value) || 0)}
                                                        placeholder="0"
                                                    />
                                                </td>
                                            ))}
                                            <td style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>
                                                {rowTotal}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
