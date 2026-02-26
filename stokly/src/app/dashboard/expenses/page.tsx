'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Plus,
    DollarSign,
    Trash2,
    Loader2,
    X,
    Save,
} from 'lucide-react';

interface Expense {
    id: string;
    category: string;
    amount: number;
    description: string;
    created_at: string;
}

const CATEGORIES = [
    'Arriendo', 'Nómina', 'Servicios', 'Pauta Digital',
    'Empaque', 'Transporte', 'Proveedores', 'Otros',
];

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [category, setCategory] = useState('Otros');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    useEffect(() => { loadExpenses(); }, []);

    const loadExpenses = async () => {
        setLoading(true);
        const { data } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
        if (data) setExpenses(data);
        setLoading(false);
    };

    const addExpense = async () => {
        if (!amount) return;
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from('expenses').insert({ user_id: user.id, category, amount: Number(amount), description: description.trim() || null });
        setAmount(''); setDescription(''); setShowForm(false); setSaving(false);
        loadExpenses();
    };

    const deleteExpense = async (id: string) => {
        if (!confirm('¿Eliminar este gasto?')) return;
        await supabase.from('expenses').delete().eq('id', id);
        setExpenses(expenses.filter(e => e.id !== id));
    };

    const totalMonth = expenses
        .filter(e => new Date(e.created_at).getMonth() === new Date().getMonth())
        .reduce((acc, e) => acc + e.amount, 0);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Gastos</h1>
                    <p>Control de gastos operativos</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    <Plus size={18} /> Registrar Gasto
                </button>
            </div>

            <div className="glass-card kpi-card" style={{ marginBottom: '1.5rem' }}>
                <div className="kpi-header">
                    <div className="kpi-icon danger"><DollarSign size={22} /></div>
                </div>
                <div className="kpi-value">${totalMonth.toLocaleString('es-CO')}</div>
                <div className="kpi-label">Gastos este mes</div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '50px' }} />)}
                </div>
            ) : expenses.length === 0 ? (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <DollarSign size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>No hay gastos registrados</p>
                </div>
            ) : (
                <div className="data-table-container">
                    <table className="data-table">
                        <thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Monto</th><th></th></tr></thead>
                        <tbody>
                            {expenses.map(exp => (
                                <tr key={exp.id}>
                                    <td>{new Date(exp.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</td>
                                    <td><span className="badge badge-warning">{exp.category}</span></td>
                                    <td style={{ color: 'var(--color-text-secondary)' }}>{exp.description || '—'}</td>
                                    <td style={{ fontWeight: 700 }}>${exp.amount.toLocaleString('es-CO')}</td>
                                    <td><button className="btn btn-ghost btn-icon" onClick={() => deleteExpense(exp.id)}><Trash2 size={16} style={{ color: 'var(--color-danger)' }} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Registrar Gasto</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="input-group">
                                <label>Categoría</label>
                                <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Monto ($)</label>
                                <input className="input" type="number" placeholder="150000" value={amount} onChange={e => setAmount(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>Descripción</label>
                                <input className="input" placeholder="Detalle del gasto" value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                            <button className="btn btn-primary" onClick={addExpense} disabled={saving}>
                                {saving ? <><Loader2 size={18} /> Guardando...</> : <><Save size={18} /> Guardar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
