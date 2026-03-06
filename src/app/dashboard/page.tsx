'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// ── DESIGN TOKENS ──
const C = {
  bg: "#F7F8FC", white: "#FFFFFF", text: "#1A1A2E", muted: "#8B8FA8", border: "#EAECF5",
  green: "#00C896", greenLight: "#E6FAF5", red: "#FF5A5F", redLight: "#FFF0F0",
  blue: "#4A90FF", blueLight: "#EEF4FF", orange: "#FF8C42", orangeLight: "#FFF4EE",
  purple: "#8B5CF6", purpleLight: "#F3F0FF", yellow: "#FFB800", yellowLight: "#FFFBEB",
  teal: "#06B6D4", tealLight: "#E0F7FA",
};

const TABS = [
  { id: "home", label: "Inicio", emoji: "🏠" },
  { id: "inventory", label: "Inventario", emoji: "📦" },
  { id: "sales", label: "Ventas", emoji: "💰" },
  { id: "expenses", label: "Gastos", emoji: "💸" },
  { id: "finance", label: "Finanzas", emoji: "📈" },
  { id: "metrics", label: "Métricas", emoji: "📊" },
];

const fmt = (n: number) => "$" + Number(Math.round(n)).toLocaleString("es-CO");
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  input, select, textarea { font-family: inherit; }
  .card { background: #FFFFFF; border-radius: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
  .btn-main { background: #00C896; color: white; border: none; border-radius: 16px; padding: 14px 24px; font-size: 16px; font-weight: 800; cursor: pointer; width: 100%; font-family: inherit; transition: all 0.15s; }
  .btn-main:active { transform: scale(0.97); opacity: 0.9; }
  .btn-orange { background: #FF8C42; }
  .btn-blue { background: #4A90FF; }
  .btn-outline { background: #FFFFFF; color: #1A1A2E; border: 2px solid #EAECF5; border-radius: 14px; padding: 12px 20px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; }
  .stk-input { background: #F7F8FC; border: 2px solid #EAECF5; border-radius: 14px; padding: 13px 16px; font-size: 15px; width: 100%; outline: none; font-family: inherit; color: #1A1A2E; transition: border 0.2s; }
  .stk-input:focus { border-color: #00C896; }
  .pill { display: inline-flex; align-items: center; border-radius: 30px; padding: 5px 14px; font-size: 12px; font-weight: 800; }
  .row-item { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1.5px solid #EAECF5; }
  .row-item:last-child { border-bottom: none; }
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: flex-end; justify-content: center; }
  .sheet { background: white; border-radius: 28px 28px 0 0; padding: 28px 20px 40px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
  .handle { width: 40px; height: 4px; background: #EAECF5; border-radius: 2px; margin: 0 auto 24px; }
  .toast { position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); background: #1A1A2E; color: white; border-radius: 16px; padding: 13px 22px; font-weight: 700; font-size: 14px; z-index: 2000; white-space: nowrap; box-shadow: 0 8px 24px rgba(0,0,0,0.2); animation: popIn 0.3s ease; }
  @keyframes popIn { from { transform: translateX(-50%) translateY(10px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
  .icon-box { width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
  .stock-btn { width: 36px; height: 36px; border-radius: 10px; border: 2px solid #EAECF5; background: white; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #8B8FA8; font-family: inherit; }
  .filter-btn { border: 2px solid #EAECF5; background: white; border-radius: 12px; padding: 7px 16px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; color: #8B8FA8; transition: all 0.15s; white-space: nowrap; }
  .filter-btn.active { border-color: #00C896; color: #00C896; background: #E6FAF5; }
  .tab-btn { background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 8px; border-radius: 14px; transition: all 0.2s; }
  .tab-btn.active { background: #E6FAF5; }
  .bar { height: 8px; background: #EAECF5; border-radius: 8px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 8px; transition: width 0.8s ease; }
  .kpi-card { border-radius: 18px; padding: 16px; }
  .section-title { font-weight: 900; font-size: 15px; color: #1A1A2E; margin-bottom: 14px; }
  .cf-positive { color: #00C896; font-weight: 900; }
  .cf-negative { color: #FF5A5F; font-weight: 900; }
  .cf-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #EAECF5; font-size: 14px; }
  .cf-row:last-child { border-bottom: none; }
  .warning-box { background: #FFF0F0; border: 2px solid rgba(255,90,95,0.2); border-radius: 16px; padding: 14px 16px; }
  .ok-box { background: #E6FAF5; border: 2px solid rgba(0,200,150,0.2); border-radius: 16px; padding: 14px 16px; }
`;

// ── TYPES ──
interface Product {
  id: string | number;
  name: string;
  sku: string;
  brand: string;
  color: string;
  size: string;
  stock: number;
  minStock: number;
  price: number;
  cost: number;
  sold: number;
  category: string;
  emoji: string;
  variant_id?: string;
}

interface Sale {
  id: string | number;
  productId: string | number;
  qty: number;
  total: number;
  date: string;
  method: string;
}

interface Expense {
  id: string | number;
  concept: string;
  amount: number;
  date: string;
  category: string;
  emoji: string;
}

export default function DashboardPage() {
  const [tab, setTab] = useState("home");
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState("S");

  const supabase = createClient();

  // ── LOAD DATA ──
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (user.user_metadata?.business_name) {
        setUserInitials(user.user_metadata.business_name[0].toUpperCase());
      }

      const [
        { data: db_products },
        { data: db_variants },
        { data: db_sales },
        { data: db_sale_items },
        { data: db_expenses }
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('product_variants').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('sale_items').select('*'),
        supabase.from('expenses').select('*')
      ]);

      // Map to flat Product interface
      const mappedProducts: Product[] = (db_variants || []).map(v => {
        const p = (db_products || []).find(x => x.id === v.product_id);
        const soldCount = (db_sale_items || []).filter(s => s.variant_id === v.id).reduce((a, b) => a + b.quantity, 0);
        return {
          id: v.id,
          variant_id: v.id,
          name: p?.name || "Sin nombre",
          sku: v.sku || "N/A",
          brand: p?.brand || "N/A",
          color: v.color,
          size: v.size,
          stock: v.stock || 0,
          minStock: 5,
          price: Number(v.price_override || p?.base_price || 0),
          cost: Number(v.cost_override || p?.base_cost || 0),
          sold: soldCount,
          category: p?.category || "Otro",
          emoji: p?.category === 'Calzado' ? '👟' : p?.category === 'Accesorios' ? '🧢' : '👕'
        };
      });

      const mappedSales: Sale[] = (db_sales || []).map(s => ({
        id: s.id,
        productId: (db_sale_items || []).find(si => si.sale_id === s.id)?.variant_id || 0,
        qty: (db_sale_items || []).find(si => si.sale_id === s.id)?.quantity || 0,
        total: Number(s.total),
        date: s.created_at.split('T')[0],
        method: s.channel === 'tienda_fisica' ? 'Efectivo' : 'Tarjeta'
      }));

      const catEmojis: Record<string, string> = { Operacional: "🏪", Compras: "🛍️", Marketing: "📱", Logística: "🚚", Otro: "💡" };

      const mappedExpenses: Expense[] = (db_expenses || []).map(e => ({
        id: e.id,
        concept: e.description || e.category,
        amount: Number(e.amount),
        date: e.created_at.split('T')[0],
        category: e.category,
        emoji: catEmojis[e.category] || "💡"
      }));

      setProducts(mappedProducts);
      setSales(mappedSales);
      setExpenses(mappedExpenses);
      setLoading(false);
    };

    fetchData();
  }, []);

  const lowStock = products.filter(p => p.stock <= p.minStock);
  const totalSalesCount = sales.reduce((a, s) => a + s.total, 0);
  const totalExpensesCount = expenses.reduce((a, e) => a + e.amount, 0);
  const profit = totalSalesCount - totalExpensesCount;

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2800); }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
        <p style={{ fontWeight: 800, color: C.muted }}>Cargando Stokly...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative", paddingBottom: 90 }}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* HEADER */}
      <div style={{ background: C.white, padding: "18px 20px 14px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 0 " + C.border }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>stokly 📦</div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Tu negocio bajo control</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {lowStock.length > 0 && (
              <button onClick={() => setTab("inventory")} style={{ background: C.redLight, border: "none", borderRadius: 12, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <span>🔴</span><span style={{ fontWeight: 800, fontSize: 13, color: C.red }}>{lowStock.length}</span>
              </button>
            )}
            <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,#00C896,#4A90FF)", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", fontSize: 16 }}>{userInitials}</div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: "18px 16px" }}>
        {tab === "home" && <Home products={products} totalSales={totalSalesCount} totalExpenses={totalExpensesCount} profit={profit} lowStock={lowStock} setTab={setTab} setModal={setModal} />}
        {tab === "inventory" && <Inventory products={products} setProducts={setProducts} lowStock={lowStock} showToast={showToast} setModal={setModal} />}
        {tab === "sales" && <Sales sales={sales} products={products} totalSales={totalSalesCount} setModal={setModal} />}
        {tab === "expenses" && <Expenses expenses={expenses} setExpenses={setExpenses} totalExpenses={totalExpensesCount} showToast={showToast} setModal={setModal} />}
        {tab === "finance" && <Finance products={products} sales={sales} expenses={expenses} totalSales={totalSalesCount} totalExpenses={totalExpensesCount} profit={profit} />}
        {tab === "metrics" && <Metrics products={products} sales={sales} totalSales={totalSalesCount} profit={profit} />}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: C.white, borderTop: "1.5px solid " + C.border, padding: "8px 4px 14px", display: "flex", justifyContent: "space-around", zIndex: 60 }}>
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <span style={{ fontSize: 20 }}>{t.emoji}</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: tab === t.id ? C.green : C.muted }}>{t.label}</span>
          </button>
        ))}
      </div>

      {modal === "product" && <AddProductModal onClose={() => setModal(null)} onSave={() => { setModal(null); showToast("✅ Producto agregado (Refresca)"); }} />}
      {modal === "sale" && <AddSaleModal products={products} onClose={() => setModal(null)} onSave={(s: any) => { setSales(prev => [...prev, s]); setModal(null); showToast("💰 Venta registrada"); }} />}
      {modal === "expense" && <AddExpenseModal onClose={() => setModal(null)} onSave={() => { setModal(null); showToast("💸 Gasto registrado"); }} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// ── SUBCOMPONENTS ──

function Home({ products, totalSales, totalExpenses, profit, lowStock, setTab, setModal }: any) {
  const top3 = [...products].sort((a, b) => b.sold - a.sold).slice(0, 3);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "linear-gradient(135deg,#00C896 0%,#4A90FF 100%)", borderRadius: 24, padding: 22, color: "white" }}>
        <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.85, marginBottom: 2 }}>Ganancia neta del mes</div>
        <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 14 }}>{fmt(profit)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 14, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, marginBottom: 3 }}>VENTAS</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{fmt(totalSales)}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 14, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.8, marginBottom: 3 }}>GASTOS</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{fmt(totalExpenses)}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Registrar venta", emoji: "💰", color: C.green, bg: C.greenLight, action: () => setModal("sale") },
          { label: "Agregar producto", emoji: "📦", color: C.blue, bg: C.blueLight, action: () => setModal("product") },
          { label: "Registrar gasto", emoji: "💸", color: C.orange, bg: C.orangeLight, action: () => setModal("expense") },
          { label: "Flujo de caja", emoji: "📈", color: C.teal, bg: C.tealLight, action: () => setTab("finance") },
        ].map(a => (
          <button key={a.label} onClick={a.action} style={{ background: a.bg, border: "none", borderRadius: 18, padding: 16, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{a.emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: a.color }}>{a.label}</div>
          </button>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="card" style={{ padding: 16, border: "2px solid " + C.red + "30" }}>
          <div style={{ fontWeight: 900, fontSize: 14, color: C.red, marginBottom: 10 }}>⚠️ Stock bajo — {lowStock.length} productos</div>
          {lowStock.slice(0, 3).map((p: any) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", background: C.redLight, borderRadius: 10, padding: "8px 12px", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{p.emoji} {p.name} ({p.size})</span>
              <span style={{ fontWeight: 900, color: C.red }}>{p.stock} uds</span>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 18 }}>
        <div className="section-title">🏆 Lo que más vendes</div>
        {top3.map((p, i) => (
          <div key={p.id} className="row-item">
            <div style={{ width: 30, height: 30, background: i === 0 ? C.yellow : C.bg, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: i === 0 ? "white" : C.muted }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{p.emoji} {p.name}</div>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{p.brand} · {p.color}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: C.green }}>{p.sold}</div>
              <div style={{ fontSize: 11, color: C.muted }}>vendidos</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Finance({ products, sales, expenses, totalSales, totalExpenses, profit }: any) {
  const [activeSection, setActiveSection] = useState("cashflow");

  const marketingExpenses = expenses.filter((e: any) => e.category === "Marketing").reduce((a: any, e: any) => a + e.amount, 0);
  const operationalExpenses = expenses.filter((e: any) => e.category === "Operacional").reduce((a: any, e: any) => a + e.amount, 0);
  const purchaseExpenses = expenses.filter((e: any) => e.category === "Compras").reduce((a: any, e: any) => a + e.amount, 0);
  const totalTransactions = sales.length;

  const cpa = totalTransactions > 0 ? marketingExpenses / totalTransactions : 0;
  const cogs = products.reduce((a: any, p: any) => a + p.sold * p.cost, 0);

  const grossProfit = totalSales - cogs;
  const grossMargin = pct(grossProfit, totalSales);
  const netMargin = pct(profit, totalSales);

  const fixedCosts = operationalExpenses + marketingExpenses;
  const breakEven = grossMargin > 0 ? (fixedCosts / (grossMargin / 100)) : 0;

  const cashflowDays = [
    { label: "Sem 1", entrada: sales.filter((s: any) => s.date <= "2025-03-07").reduce((a: any, s: any) => a + s.total, 0), salida: expenses.filter((e: any) => e.date <= "2025-03-07").reduce((a: any, e: any) => a + e.amount, 0) },
    { label: "Sem 2", entrada: sales.filter((s: any) => s.date > "2025-03-07" && s.date <= "2025-03-14").reduce((a: any, s: any) => a + s.total, 0), salida: expenses.filter((e: any) => e.date > "2025-03-07" && e.date <= "2025-03-14").reduce((a: any, e: any) => a + e.amount, 0) },
    { label: "Sem 3", entrada: sales.filter((s: any) => s.date > "2025-03-14" && s.date <= "2025-03-21").reduce((a: any, s: any) => a + s.total, 0), salida: expenses.filter((e: any) => e.date > "2025-03-14" && e.date <= "2025-03-21").reduce((a: any, e: any) => a + e.amount, 0) },
    { label: "Sem 4", entrada: sales.filter((s: any) => s.date > "2025-03-21").reduce((a: any, s: any) => a + s.total, 0), salida: expenses.filter((e: any) => e.date > "2025-03-21").reduce((a: any, e: any) => a + e.amount, 0) },
  ];
  const maxCF = Math.max(...cashflowDays.map(d => Math.max(d.entrada, d.salida)));

  const productProfitability = products.map((p: any) => {
    const revenue = p.sold * p.price;
    const cog = p.sold * p.cost;
    const grossP = revenue - cog;
    const mktShare = revenue > 0 ? (revenue / totalSales) * marketingExpenses : 0;
    const netP = grossP - mktShare;
    const margin = revenue > 0 ? pct(grossP, revenue) : 0;
    const roi = cog > 0 ? pct(grossP, cog) : 0;
    return { ...p, revenue, cog, grossP, netP, margin, roi, mktShare };
  }).sort((a: any, b: any) => b.grossP - a.grossP);

  const frozenCapital = products.reduce((a: any, p: any) => a + p.stock * p.cost, 0);

  const sections = [
    { id: "cashflow", label: "Flujo de Caja", emoji: "💧" },
    { id: "profitability", label: "Rentabilidad", emoji: "💎" },
    { id: "indicators", label: "Indicadores", emoji: "🎯" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontWeight: 900, fontSize: 20, color: C.text }}>📈 Finanzas</div>
        <div style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Análisis real de tu negocio</div>
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {sections.map(s => (
          <button key={s.id} className={`filter-btn ${activeSection === s.id ? "active" : ""}`} onClick={() => setActiveSection(s.id)}>
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {activeSection === "cashflow" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...(profit >= 0 ? { background: "linear-gradient(135deg,#00C896,#06B6D4)" } : { background: "linear-gradient(135deg,#FF5A5F,#FF8C42)" }), borderRadius: 22, padding: 22, color: "white" }}>
            <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.85, marginBottom: 2 }}>
              {profit >= 0 ? "✅ Flujo positivo — estás ganando" : "🚨 Flujo negativo — estás perdiendo"}
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 14 }}>{fmt(profit)}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 13, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 700, marginBottom: 3 }}>ENTRADAS</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{fmt(totalSales)}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 13, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 700, marginBottom: 3 }}>SALIDAS</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{fmt(totalExpenses)}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div className="section-title">📅 Flujo semanal</div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 120, marginBottom: 10 }}>
              {cashflowDays.map((d, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                  <div style={{ width: "100%", display: "flex", gap: 3, alignItems: "flex-end", height: 100 }}>
                    <div style={{ flex: 1, background: C.green, borderRadius: "6px 6px 0 0", height: maxCF > 0 ? `${Math.max(4, (d.entrada / maxCF) * 100)}%` : "4px", transition: "height 0.8s ease" }} />
                    <div style={{ flex: 1, background: C.red, borderRadius: "6px 6px 0 0", height: maxCF > 0 ? `${Math.max(4, (d.salida / maxCF) * 100)}%` : "4px", transition: "height 0.8s ease" }} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.muted }}>{d.label}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: d.entrada - d.salida >= 0 ? C.green : C.red }}>
                    {d.entrada - d.salida >= 0 ? "+" : ""}{fmt(d.entrada - d.salida)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}><div style={{ width: 12, height: 12, background: C.green, borderRadius: 3 }} /><span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Entradas</span></div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}><div style={{ width: 12, height: 12, background: C.red, borderRadius: 3 }} /><span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Salidas</span></div>
            </div>
          </div>

          {/* Desglose de salidas */}
          <div className="card" style={{ padding: 18 }}>
            <div className="section-title">💸 Desglose de salidas</div>
            {[
              { label: "Costo de productos (COGS)", value: cogs, color: C.orange },
              { label: "Gastos operacionales", value: operationalExpenses, color: C.red },
              { label: "Marketing y publicidad", value: marketingExpenses, color: C.purple },
              { label: "Compras de inventario", value: purchaseExpenses, color: C.blue },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 14 }}>
                <div className="cf-row" style={{ borderBottom: "none", padding: "4px 0" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{item.label}</span>
                  <span style={{ fontWeight: 900, color: item.color }}>{fmt(item.value)}</span>
                </div>
                <div className="bar">
                  <div className="bar-fill" style={{ width: `${pct(item.value, totalSales + cogs)}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: C.yellowLight, border: "2px solid " + C.yellow + "50", borderRadius: 18, padding: 18 }}>
            <div style={{ fontWeight: 900, fontSize: 14, color: C.text, marginBottom: 6 }}>⚠️ Capital inmovilizado en inventario</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: C.yellow, marginBottom: 6 }}>{fmt(frozenCapital)}</div>
            <div style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Es dinero que tienes invertido en productos sin vender. Mucho inventario = menos liquidez.</div>
          </div>
        </div>
      )}

      {activeSection === "profitability" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "linear-gradient(135deg,#8B5CF6,#4A90FF)", borderRadius: 22, padding: 20, color: "white" }}>
            <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.85, marginBottom: 2 }}>Ganancia bruta total</div>
            <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 4 }}>{fmt(grossProfit)}</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>Margen bruto: {grossMargin}% · Margen neto: {netMargin}%</div>
          </div>

          {productProfitability.map((p: any) => (
            <div key={p.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                <div className="icon-box" style={{ background: p.grossP > 0 ? C.greenLight : C.redLight }}>{p.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 15 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{p.brand} · {p.color} / {p.size}</div>
                </div>
                <span className="pill" style={{ background: p.margin > 40 ? C.greenLight : p.margin > 20 ? C.yellowLight : C.redLight, color: p.margin > 40 ? C.green : p.margin > 20 ? C.yellow : C.red }}>
                  {p.margin}% margen
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { label: "Ingresos", value: fmt(p.revenue), color: C.blue },
                  { label: "Costo", value: fmt(p.cog), color: C.orange },
                  { label: "Ganancia bruta", value: fmt(p.grossP), color: p.grossP > 0 ? C.green : C.red },
                ].map(k => (
                  <div key={k.label} style={{ background: C.bg, borderRadius: 12, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>{k.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: C.purpleLight, borderRadius: 12, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: C.purple, fontWeight: 700, marginBottom: 3 }}>ROI</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: C.purple }}>{p.roi}%</div>
                  <div style={{ fontSize: 11, color: C.muted }}>por cada peso invertido</div>
                </div>
                <div style={{ background: C.tealLight, borderRadius: 12, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: C.teal, fontWeight: 700, marginBottom: 3 }}>GANANCIA/UNIDAD</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: C.teal }}>{fmt(p.price - p.cost)}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>por unidad vendida</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSection === "indicators" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* CPA */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>CPA — Costo de Adquisición</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: C.purple }}>{fmt(cpa)}</div>
                <div style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>por cada venta generada</div>
              </div>
              <div style={{ background: C.purpleLight, borderRadius: 14, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 24 }}>🎯</div>
              </div>
            </div>
            <div style={{ background: C.bg, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8 }}>¿Qué significa?</div>
              <div className="cf-row"><span style={{ fontSize: 13 }}>Gastas en marketing</span><span style={{ fontWeight: 900, color: C.purple }}>{fmt(marketingExpenses)}</span></div>
              <div className="cf-row"><span style={{ fontSize: 13 }}>Número de ventas</span><span style={{ fontWeight: 900 }}>{totalTransactions}</span></div>
              <div className="cf-row" style={{ borderBottom: "none" }}><span style={{ fontSize: 13, fontWeight: 800 }}>Te cuesta conseguir cada venta</span><span style={{ fontWeight: 900, color: C.purple }}>{fmt(cpa)}</span></div>
            </div>
            <div style={{ marginTop: 12, ...(cpa < 30000 ? { background: C.greenLight, border: "2px solid rgba(0,200,150,0.2)", borderRadius: 12, padding: 12 } : { background: C.yellowLight, border: "2px solid rgba(255,184,0,0.2)", borderRadius: 12, padding: 12 }) }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: cpa < 30000 ? C.green : C.yellow }}>
                {cpa < 30000 ? "✅ CPA saludable — tu marketing es eficiente" : "⚠️ CPA alto — evalúa reducir gastos de marketing o aumentar ventas"}
              </div>
            </div>
          </div>

          {/* Punto de equilibrio */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>Punto de Equilibrio</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: C.orange }}>{fmt(breakEven)}</div>
                <div style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>necesitas vender al mes para no perder</div>
              </div>
              <div style={{ background: C.orangeLight, borderRadius: 14, padding: "10px 14px" }}><div style={{ fontSize: 24 }}>⚖️</div></div>
            </div>
            <div style={{ background: C.bg, borderRadius: 12, padding: 14 }}>
              <div className="cf-row"><span style={{ fontSize: 13 }}>Costos fijos mensuales</span><span style={{ fontWeight: 900, color: C.orange }}>{fmt(fixedCosts)}</span></div>
              <div className="cf-row"><span style={{ fontSize: 13 }}>Margen bruto actual</span><span style={{ fontWeight: 900 }}>{grossMargin}%</span></div>
              <div className="cf-row" style={{ borderBottom: "none" }}><span style={{ fontSize: 13, fontWeight: 800 }}>Ya vendiste este mes</span><span style={{ fontWeight: 900, color: totalSales >= breakEven ? C.green : C.red }}>{fmt(totalSales)}</span></div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>Progreso al punto de equilibrio</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: totalSales >= breakEven ? C.green : C.orange }}>{Math.min(100, pct(totalSales, breakEven))}%</span>
              </div>
              <div className="bar" style={{ height: 12 }}>
                <div className="bar-fill" style={{ width: `${Math.min(100, pct(totalSales, breakEven))}%`, background: totalSales >= breakEven ? C.green : "linear-gradient(90deg,#FF8C42,#FFB800)" }} />
              </div>
              {totalSales >= breakEven
                ? <div style={{ marginTop: 10, background: C.greenLight, border: "2px solid rgba(0,200,150,0.2)", borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, color: C.green }}>✅ Superaste el punto de equilibrio. Estás ganando.</div>
                : <div style={{ marginTop: 10, background: C.yellowLight, border: "2px solid rgba(255,184,0,0.2)", borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, color: C.yellow }}>⚠️ Faltan {fmt(breakEven - totalSales)} para cubrir tus costos fijos.</div>
              }
            </div>
          </div>

          {/* Márgenes reales */}
          <div className="card" style={{ padding: 20 }}>
            <div className="section-title">📊 Márgenes reales</div>
            {[
              { label: "Margen Bruto", desc: "Ventas menos costo de productos", value: grossMargin, amount: grossProfit, color: C.green },
              { label: "Margen Neto", desc: "Lo que realmente queda en tu bolsillo", value: netMargin, amount: profit, color: netMargin > 0 ? C.teal : C.red },
            ].map(m => (
              <div key={m.label} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div><div style={{ fontWeight: 800, fontSize: 14 }}>{m.label}</div><div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{m.desc}</div></div>
                  <div style={{ textAlign: "right" }}><div style={{ fontWeight: 900, fontSize: 20, color: m.color }}>{m.value}%</div><div style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{fmt(m.amount)}</div></div>
                </div>
                <div className="bar" style={{ height: 10 }}><div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, m.value))}%`, background: m.color }} /></div>
              </div>
            ))}
            <div style={{ background: C.bg, borderRadius: 14, padding: 14, marginTop: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginBottom: 10, textTransform: "uppercase" }}>¿Cómo estás vs. la industria?</div>
              {[
                { label: "Tu margen bruto", value: `${grossMargin}%`, status: grossMargin > 40 ? "🟢 Excelente" : grossMargin > 25 ? "🟡 Normal" : "🔴 Bajo" },
                { label: "Tu margen neto", value: `${netMargin}%`, status: netMargin > 15 ? "🟢 Excelente" : netMargin > 5 ? "🟡 Normal" : "🔴 Bajo" },
                { label: "Referencia industria retail", value: "5%-20% neto", status: "ℹ️ Estándar" },
              ].map(r => (
                <div key={r.label} className="cf-row"><span style={{ fontSize: 13, fontWeight: 700 }}>{r.label}</span><div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 900 }}>{r.value}</div><div style={{ fontSize: 11, color: C.muted }}>{r.status}</div></div></div>
              ))}
            </div>
          </div>

          {/* ROI general */}
          <div className="card" style={{ padding: 20 }}>
            <div className="section-title">💹 ROI del negocio</div>
            <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: profit > 0 ? C.green : C.red }}>{pct(profit, totalExpenses)}%</div>
              <div style={{ fontSize: 14, color: C.muted, fontWeight: 700 }}>retorno sobre lo que invertiste</div>
            </div>
            <div style={{ background: C.bg, borderRadius: 14, padding: 14 }}>
              <div className="cf-row"><span style={{ fontSize: 13 }}>Total invertido (gastos)</span><span style={{ fontWeight: 900, color: C.orange }}>{fmt(totalExpenses)}</span></div>
              <div className="cf-row"><span style={{ fontSize: 13 }}>Total recuperado (ventas)</span><span style={{ fontWeight: 900, color: C.green }}>{fmt(totalSales)}</span></div>
              <div className="cf-row" style={{ borderBottom: "none" }}><span style={{ fontSize: 13, fontWeight: 800 }}>Ganancia neta</span><span style={{ fontWeight: 900, color: profit > 0 ? C.green : C.red }}>{fmt(profit)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Inventory({ products, setProducts, lowStock, showToast, setModal }: any) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const brands = ["Todos", ...new Set(products.map((p: any) => p.brand))];
  const filtered = products.filter((p: any) =>
    (filter === "Todos" || p.brand === filter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.color.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><div style={{ fontWeight: 900, fontSize: 20 }}>Inventario</div><div style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>{products.length} refs · {products.reduce((a: any, p: any) => a + p.stock, 0)} uds</div></div>
        <button onClick={() => setModal("product")} style={{ background: C.green, color: "white", border: "none", borderRadius: 14, padding: "10px 18px", fontWeight: 900, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>+ Agregar</button>
      </div>
      <input className="stk-input" placeholder="🔍 Buscar nombre, color, marca..." value={search} onChange={e => setSearch(e.target.value)} />
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {brands.map((b: any) => <button key={b} className={`filter-btn ${filter === b ? "active" : ""}`} onClick={() => setFilter(b)}>{b}</button>)}
      </div>
      {filtered.map((p: any) => {
        const isLow = p.stock <= p.minStock;
        const margin = p.price ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;
        return (
          <div key={p.id} className="card" style={{ padding: 16, border: `2px solid ${isLow ? C.red + "40" : "transparent"}` }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div className="icon-box" style={{ background: isLow ? C.redLight : C.greenLight }}>{p.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: 15 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 8 }}>{p.brand} · {p.color} · T{p.size}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span className="pill" style={{ background: C.blueLight, color: C.blue }}>{p.sku}</span>
                  <span className="pill" style={{ background: margin > 40 ? C.greenLight : C.yellowLight, color: margin > 40 ? C.green : C.yellow }}>Margen {margin}%</span>
                  <span className="pill" style={{ background: C.purpleLight, color: C.purple }}>{fmt(p.price)}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1.5px solid " + C.border }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>STOCK {isLow ? "⚠️" : "✅"}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: isLow ? C.red : C.text }}>{p.stock} <span style={{ fontSize: 12, color: C.muted }}>/ mín {p.minStock}</span></div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="stock-btn" onClick={() => { }}>−</button>
                <button className="stock-btn" onClick={() => { }}>+</button>
                <button onClick={() => { setProducts((prev: any) => prev.filter((x: any) => x.id !== p.id)); showToast("🗑️ Eliminado"); }} style={{ background: C.redLight, border: "none", borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontWeight: 800, fontSize: 13, color: C.red, fontFamily: "inherit" }}>Borrar</button>
              </div>
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.muted, fontWeight: 700 }}>No encontrado 🔍</div>}
    </div>
  );
}

function Sales({ sales, products, totalSales, setModal }: any) {
  const byMethod = sales.reduce((acc: any, s: any) => { acc[s.method] = (acc[s.method] || 0) + s.total; return acc; }, {});
  const colors: Record<string, string[]> = { Efectivo: [C.green, C.greenLight], Tarjeta: [C.blue, C.blueLight], Nequi: [C.purple, C.purpleLight], Transferencia: [C.orange, C.orangeLight], Daviplata: [C.red, C.redLight] };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><div style={{ fontWeight: 900, fontSize: 20 }}>Ventas</div><div style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>{sales.length} transacciones</div></div>
        <button onClick={() => setModal("sale")} style={{ background: C.green, color: "white", border: "none", borderRadius: 14, padding: "10px 18px", fontWeight: 900, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>+ Venta</button>
      </div>
      <div style={{ background: "linear-gradient(135deg,#00C896,#4A90FF)", borderRadius: 20, padding: 20, color: "white" }}>
        <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.85 }}>Total del mes</div>
        <div style={{ fontSize: 34, fontWeight: 900 }}>{fmt(totalSales)}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {Object.entries(byMethod).map(([m, total]) => {
          const [color] = colors[m] || [C.muted, C.bg];
          return <div key={m} className="card" style={{ padding: 16 }}><div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 4 }}>{m}</div><div style={{ fontSize: 20, fontWeight: 900 }}>{fmt(total as number)}</div></div>;
        })}
      </div>
      <div className="card" style={{ padding: 18 }}>
        <div className="section-title">Historial</div>
        {[...sales].reverse().map((s: any) => {
          const p = products.find((x: any) => x.id === s.productId);
          return (
            <div key={s.id} className="row-item">
              <div className="icon-box" style={{ background: C.greenLight }}>{p?.emoji || "📦"}</div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 14 }}>{p?.name || "Producto"}</div><div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{s.date} · {s.qty} uds · {s.method}</div></div>
              <div style={{ fontWeight: 900, fontSize: 16, color: C.green }}>{fmt(s.total)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Expenses({ expenses, setExpenses, totalExpenses, showToast, setModal }: any) {
  const byCategory = expenses.reduce((acc: any, e: any) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {});
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><div style={{ fontWeight: 900, fontSize: 20 }}>Gastos</div><div style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>{expenses.length} registros</div></div>
        <button onClick={() => setModal("expense")} style={{ background: C.orange, color: "white", border: "none", borderRadius: 14, padding: "10px 18px", fontWeight: 900, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>+ Gasto</button>
      </div>
      <div style={{ background: "linear-gradient(135deg,#FF8C42,#FF5A5F)", borderRadius: 20, padding: 20, color: "white" }}>
        <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.85 }}>Total gastos del mes</div>
        <div style={{ fontSize: 34, fontWeight: 900 }}>{fmt(totalExpenses)}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {Object.entries(byCategory).map(([cat, amount]) => (
          <div key={cat} className="card" style={{ padding: 16 }}><div style={{ fontSize: 13, fontWeight: 800, color: C.orange, marginBottom: 4 }}>{cat}</div><div style={{ fontSize: 20, fontWeight: 900 }}>{fmt(amount as number)}</div></div>
        ))}
      </div>
      <div className="card" style={{ padding: 18 }}>
        <div className="section-title">Historial</div>
        {[...expenses].reverse().map((e: any) => (
          <div key={e.id} className="row-item">
            <div className="icon-box" style={{ background: C.orangeLight }}>{e.emoji}</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 14 }}>{e.concept}</div><div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{e.date} · {e.category}</div></div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: C.red }}>{fmt(e.amount)}</div>
              <button onClick={() => { setExpenses((prev: any) => prev.filter((x: any) => x.id !== e.id)); showToast("🗑️ Eliminado"); }} style={{ background: "none", border: "none", color: C.muted, fontSize: 11, cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>Borrar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metrics({ products, sales, totalSales, profit }: any) {
  const topSold = [...products].sort((a: any, b: any) => b.sold - a.sold);
  const byBrand = products.reduce((acc: any, p: any) => { if (!acc[p.brand]) acc[p.brand] = 0; acc[p.brand] += p.sold; return acc; }, {});
  const byColor = products.reduce((acc: any, p: any) => { if (!acc[p.color]) acc[p.color] = 0; acc[p.color] += p.sold; return acc; }, {});
  const maxSold = topSold[0]?.sold || 1;
  const maxBrand = Math.max(...Object.values(byBrand).map(Number));
  const maxColor = Math.max(...Object.values(byColor).map(Number));
  const toBuy = products.filter((p: any) => p.stock < p.minStock * 2).sort((a: any, b: any) => b.sold - a.sold);
  const margin = totalSales ? pct(profit, totalSales) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontWeight: 900, fontSize: 20 }}>📊 Métricas</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Margen neto", value: `${margin}%`, color: margin > 30 ? C.green : C.orange, bg: margin > 30 ? C.greenLight : C.orangeLight },
          { label: "Ticket prom.", value: fmt(sales.length ? Math.round(totalSales / sales.length) : 0), color: C.blue, bg: C.blueLight },
          { label: "Más vendido", value: topSold[0]?.name.split(" ")[0] || "—", color: C.yellow, bg: C.yellowLight },
          { label: "Referencias", value: products.length, color: C.purple, bg: C.purpleLight },
        ].map((k: any) => (
          <div key={k.label} className="card" style={{ padding: 16, background: k.bg }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: k.color, marginBottom: 6, textTransform: "uppercase" }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>{k.value}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 18 }}>
        <div className="section-title">🏆 Ranking de ventas</div>
        {topSold.map((p: any, i: number) => (
          <div key={p.id} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 14 }}><span style={{ color: i === 0 ? C.yellow : C.muted, marginRight: 6 }}>#{i + 1}</span>{p.emoji} {p.name}</span>
              <span style={{ fontWeight: 900, color: C.green }}>{p.sold}</span>
            </div>
            <div className="bar"><div className="bar-fill" style={{ width: `${Math.round((p.sold / maxSold) * 100)}%`, background: i === 0 ? "linear-gradient(90deg,#FFB800,#FF8C42)" : "linear-gradient(90deg,#00C896,#4A90FF)" }} /></div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 18 }}>
        <div className="section-title">👟 Por marca</div>
        {Object.entries(byBrand).sort((a: any, b: any) => b[1] - a[1]).map(([brand, sold]) => (
          <div key={brand} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontWeight: 800, fontSize: 14 }}>{brand}</span><span style={{ fontWeight: 900, color: C.blue }}>{sold as number} uds</span></div>
            <div className="bar"><div className="bar-fill" style={{ width: `${Math.round((sold as number / maxBrand) * 100)}%`, background: "linear-gradient(90deg,#4A90FF,#8B5CF6)" }} /></div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 18 }}>
        <div className="section-title">🎨 Colores preferidos</div>
        {Object.entries(byColor).sort((a: any, b: any) => b[1] - a[1]).map(([color, sold]) => (
          <div key={color} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontWeight: 800, fontSize: 14 }}>{color}</span><span style={{ fontWeight: 900, color: C.purple }}>{sold as number} uds</span></div>
            <div className="bar"><div className="bar-fill" style={{ width: `${Math.round((sold as number / maxColor) * 100)}%`, background: "linear-gradient(90deg,#F472B6,#8B5CF6)" }} /></div>
          </div>
        ))}
      </div>
      {toBuy.length > 0 && (
        <div className="card" style={{ padding: 18, border: "2px solid " + C.yellow + "50" }}>
          <div className="section-title">🛒 Qué deberías comprar</div>
          {toBuy.map((p: any) => {
            const qty = Math.max(p.minStock * 3, 10);
            return (
              <div key={p.id} style={{ background: C.yellowLight, borderRadius: 16, padding: "14px 16px", marginBottom: 10 }}>
                <div style={{ fontWeight: 900, fontSize: 15 }}>{p.emoji} {p.name} <span style={{ color: C.muted, fontWeight: 600 }}>· {p.color}/{p.size}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, flexWrap: "wrap", gap: 4 }}>
                  <span style={{ fontSize: 13, color: C.muted, fontWeight: 700 }}>Stock: <span style={{ color: C.red }}>{p.stock}</span></span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: C.yellow }}>Comprar {qty} → {fmt(qty * p.cost)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── MODALS ──

function AddProductModal({ onClose, onSave }: any) {
  const [f, setF] = useState({ name: "", sku: "", brand: "", color: "", size: "", stock: "", minStock: "5", price: "", cost: "", category: "Ropa" });
  const supabase = createClient();

  async function save() {
    if (!f.name || !f.sku || !f.stock) return;

    // Create product
    const { data: pData } = await supabase.from('products').insert({
      name: f.name,
      sku: f.sku,
      brand: f.brand,
      category: f.category,
      base_cost: Number(f.cost),
      base_price: Number(f.price),
      user_id: (await supabase.auth.getUser()).data.user?.id
    }).select().single();

    if (pData) {
      // Create variant
      await supabase.from('product_variants').insert({
        product_id: pData.id,
        color: f.color,
        size: f.size,
        stock: Number(f.stock),
        sku: f.sku
      });
    }

    onSave();
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 20 }}>📦 Nuevo producto</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="stk-input" placeholder="Nombre" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} />
          <input className="stk-input" placeholder="SKU" value={f.sku} onChange={e => setF(p => ({ ...p, sku: e.target.value }))} />
          <input className="stk-input" placeholder="Marca" value={f.brand} onChange={e => setF(p => ({ ...p, brand: e.target.value }))} />
          <input className="stk-input" placeholder="Color" value={f.color} onChange={e => setF(p => ({ ...p, color: e.target.value }))} />
          <input className="stk-input" placeholder="Talla" value={f.size} onChange={e => setF(p => ({ ...p, size: e.target.value }))} />
          <input className="stk-input" placeholder="Stock" type="number" value={f.stock} onChange={e => setF(p => ({ ...p, stock: e.target.value }))} />
          <input className="stk-input" placeholder="Precio" type="number" value={f.price} onChange={e => setF(p => ({ ...p, price: e.target.value }))} />
          <input className="stk-input" placeholder="Costo" type="number" value={f.cost} onChange={e => setF(p => ({ ...p, cost: e.target.value }))} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
          <button className="btn-main" onClick={save} style={{ flex: 2 }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function AddSaleModal({ products, onClose, onSave }: any) {
  const [pid, setPid] = useState("");
  const [qty, setQty] = useState(1);
  const [method, setMethod] = useState("Efectivo");
  const p = products.find((x: any) => x.id === pid);
  const total = p ? p.price * qty : 0;
  const supabase = createClient();

  async function save() {
    if (!p || qty < 1 || p.stock < qty) return;

    const { data: sale } = await supabase.from('sales').insert({
      total: total,
      channel: method === 'Efectivo' ? 'tienda_fisica' : 'online',
      user_id: (await supabase.auth.getUser()).data.user?.id
    }).select().single();

    if (sale) {
      await supabase.from('sale_items').insert({
        sale_id: sale.id,
        variant_id: p.id,
        quantity: qty,
        unit_price: p.price,
        unit_cost: p.cost
      });

      await supabase.from('product_variants').update({
        stock: p.stock - qty
      }).eq('id', p.id);
    }

    onSave({ id: Date.now(), productId: pid, qty, total, date: new Date().toISOString().split('T')[0], method });
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 20 }}>💰 Registrar venta</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginBottom: 5, textTransform: "uppercase" }}>Producto</div>
            <select className="stk-input" value={pid} onChange={e => setPid(e.target.value)}>
              <option value="">Selecciona un producto</option>
              {products.filter((p: any) => p.stock > 0).map((p: any) => <option key={p.id} value={p.id}>{p.emoji} {p.name} — {p.color}/{p.size} ({p.stock} disp.) — {fmt(p.price)}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>Cantidad</div>
            <div style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "center" }}>
              <button className="stock-btn" style={{ width: 48, height: 48, fontSize: 24 }} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span style={{ fontSize: 36, fontWeight: 900, minWidth: 50, textAlign: "center" }}>{qty}</span>
              <button className="stock-btn" style={{ width: 48, height: 48, fontSize: 24 }} onClick={() => setQty(q => Math.min(p?.stock || 99, q + 1))}>+</button>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>Método de pago</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Efectivo", "Tarjeta", "Nequi", "Transferencia", "Daviplata"].map(m => (
                <button key={m} className={`filter-btn ${method === m ? "active" : ""}`} onClick={() => setMethod(m)}>{m}</button>
              ))}
            </div>
          </div>
          {p && <div style={{ background: C.greenLight, borderRadius: 16, padding: "16px 20px", textAlign: "center" }}><div style={{ fontSize: 13, color: C.muted, fontWeight: 700 }}>Total a cobrar</div><div style={{ fontSize: 36, fontWeight: 900, color: C.green }}>{fmt(total)}</div></div>}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
          <button className="btn-main" onClick={save} style={{ flex: 2 }}>Confirmar venta</button>
        </div>
      </div>
    </div>
  );
}

function AddExpenseModal({ onClose, onSave }: any) {
  const [f, setF] = useState({ concept: "", amount: "", category: "Operacional" });
  const catEmojis: Record<string, string> = { Operacional: "🏪", Compras: "🛍️", Marketing: "📱", Logística: "🚚", Otro: "💡" };
  const supabase = createClient();

  async function save() {
    if (!f.concept || !f.amount) return;
    await supabase.from('expenses').insert({
      category: f.category,
      amount: Number(f.amount),
      description: f.concept,
      user_id: (await supabase.auth.getUser()).data.user?.id
    });
    onSave();
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="handle" />
        <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 20 }}>💸 Registrar gasto</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginBottom: 5, textTransform: "uppercase" }}>Concepto</div>
            <input className="stk-input" placeholder="Ej: Arriendo del mes" value={f.concept} onChange={e => setF(p => ({ ...p, concept: e.target.value }))} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginBottom: 5, textTransform: "uppercase" }}>Monto ($)</div>
            <input className="stk-input" type="number" placeholder="0" value={f.amount} onChange={e => setF(p => ({ ...p, amount: e.target.value }))} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>Categoría</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Operacional", "Compras", "Marketing", "Logística", "Otro"].map(c => (
                <button key={c} className={`filter-btn ${f.category === c ? "active" : ""}`} onClick={() => setF(p => ({ ...p, category: c }))}>{catEmojis[c]} {c}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button className="btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
          <button className="btn-main btn-orange" onClick={save} style={{ flex: 2 }}>Guardar gasto</button>
        </div>
      </div>
    </div>
  );
}
