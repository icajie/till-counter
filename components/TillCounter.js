"use client";
import { useState, useEffect } from "react";

// ── Denominations ────────────────────────────────────────────────
const NOTES = [
  { label: "$100", value: 100 },
  { label: "$50",  value: 50  },
  { label: "$20",  value: 20  },
  { label: "$10",  value: 10  },
  { label: "$5",   value: 5   },
];
const COINS = [
  { label: "$2",  value: 2    },
  { label: "$1",  value: 1    },
  { label: "50c", value: 0.5  },
  { label: "20c", value: 0.2  },
  { label: "10c", value: 0.1  },
  { label: "5c",  value: 0.05 },
];
const COIN_ROLLS = [
  { label: "$2 Roll",  value: 2,    qty: 25, total: 50   },
  { label: "$1 Roll",  value: 1,    qty: 20, total: 20   },
  { label: "50c Roll", value: 0.5,  qty: 20, total: 10   },
  { label: "20c Roll", value: 0.2,  qty: 20, total: 4    },
  { label: "10c Roll", value: 0.1,  qty: 20, total: 2    },
  { label: "5c Roll",  value: 0.05, qty: 20, total: 1    },
];

// ── Helpers ──────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n ?? 0);
const todayStr = () => new Date().toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const todayKey = () => new Date().toISOString().slice(0, 10);
const calcLoose = (qtys) => [...NOTES, ...COINS].reduce((s, d) => s + (qtys?.[d.value] || 0) * d.value, 0);
const calcRolls = (rolls) => COIN_ROLLS.reduce((s, r) => s + (rolls?.[r.value] || 0) * r.total, 0);
const calcTotal = (qtys, rolls) => calcLoose(qtys) + calcRolls(rolls);

// ── API ──────────────────────────────────────────────────────────
const api = {
  records: async () => { const r = await fetch("/api/records"); const d = await r.json(); return d.records ?? []; },
  saveRecord: (b) => fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }),
  draft: async (k) => { const r = await fetch(`/api/draft?dateKey=${k}`); const d = await r.json(); return d.draft ?? null; },
  saveDraft: (b) => fetch("/api/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }),
};

// ── Styles ───────────────────────────────────────────────────────
const S = {
  card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "14px 16px", marginBottom: "12px" },
  input: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff", padding: "9px 12px", fontSize: "14px", fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" },
  label: { fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.9px", display: "block", marginBottom: "8px" },
  mono: { fontFamily: "'DM Mono', monospace" },
};

// ── DenomRow ─────────────────────────────────────────────────────
function DenomRow({ label, color, value, qty, onChange, readOnly, sublabel }) {
  const subtotal = (qty || 0) * value;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 52px 88px", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "8px", background: qty > 0 ? "rgba(255,255,255,0.04)" : "transparent", transition: "background 0.15s" }}>
      <div>
        <div style={{ ...S.mono, fontSize: "14px", fontWeight: 700, color }}>{label}</div>
        {sublabel && <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "1px" }}>{sublabel}</div>}
      </div>
      {readOnly
        ? <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }} />
        : <input type="range" min={0} max={50} value={qty || 0} onChange={(e) => onChange(+e.target.value)}
            style={{ accentColor: color, cursor: "pointer", width: "100%" }} />
      }
      <input type="number" min={0} value={qty || ""} placeholder="0" readOnly={readOnly}
        onChange={(e) => !readOnly && onChange(Math.max(0, +e.target.value || 0))}
        style={{ ...S.mono, width: "48px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: readOnly ? "rgba(255,255,255,0.3)" : "#fff", textAlign: "center", padding: "4px", fontSize: "13px" }}
      />
      <span style={{ ...S.mono, textAlign: "right", fontSize: "13px", color: subtotal > 0 ? "#f5c842" : "rgba(255,255,255,0.18)" }}>{fmt(subtotal)}</span>
    </div>
  );
}

// ── RollRow ──────────────────────────────────────────────────────
function RollRow({ roll, qty, onChange }) {
  const subtotal = (qty || 0) * roll.total;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 52px 88px", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "8px", background: qty > 0 ? "rgba(168,216,168,0.05)" : "transparent", transition: "background 0.15s" }}>
      <div>
        <div style={{ ...S.mono, fontSize: "13px", fontWeight: 700, color: "#a8d8a8" }}>{roll.label}</div>
        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>{roll.qty}×{roll.label.replace(" Roll","")}</div>
      </div>
      <input type="range" min={0} max={20} value={qty || 0} onChange={(e) => onChange(+e.target.value)}
        style={{ accentColor: "#a8d8a8", cursor: "pointer", width: "100%" }} />
      <input type="number" min={0} value={qty || ""} placeholder="0"
        onChange={(e) => onChange(Math.max(0, +e.target.value || 0))}
        style={{ ...S.mono, width: "48px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", color: "#fff", textAlign: "center", padding: "4px", fontSize: "13px" }}
      />
      <span style={{ ...S.mono, textAlign: "right", fontSize: "13px", color: subtotal > 0 ? "#a8d8a8" : "rgba(255,255,255,0.18)" }}>{fmt(subtotal)}</span>
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────────
function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: "4px" }}>
      <div style={{ padding: "3px 10px 5px", fontSize: "10px", color, textTransform: "uppercase", letterSpacing: "1.2px", fontWeight: 700, opacity: 0.7 }}>{title}</div>
      {children}
    </div>
  );
}

// ── Money input ──────────────────────────────────────────────────
function MoneyInput({ label, value, onChange, color = "#f5c842", note, onNoteChange, noteLabel, sublabel, icon }) {
  return (
    <div style={{ ...S.card, borderColor: `${color}22` }}>
      <label style={{ ...S.label, color: `${color}99` }}>{icon} {label} {sublabel && <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>{sublabel}</span>}</label>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: note !== undefined ? "10px" : 0 }}>
        <span style={{ ...S.mono, color, fontSize: "20px" }}>$</span>
        <input type="number" placeholder="0.00" value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "22px", ...S.mono, fontWeight: 700 }}
        />
      </div>
      {note !== undefined && (
        <input type="text" placeholder={noteLabel || "Add a note…"} value={note} onChange={(e) => onNoteChange(e.target.value)}
          style={{ ...S.input, fontSize: "13px", padding: "7px 10px" }} />
      )}
    </div>
  );
}

// ── History Panel ────────────────────────────────────────────────
function HistoryPanel({ records, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#13131c", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: "540px", maxHeight: "85vh", overflowY: "auto", padding: "24px 18px 40px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display',serif", fontSize: "20px", color: "#fff" }}>📋 Saved Records</h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "13px" }}>Close</button>
        </div>
        {records.length === 0
          ? <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "40px 0" }}>No records yet.</p>
          : [...records].reverse().map((r, i) => {
              const variance = r.expectedSales > 0 ? r.cashSales - r.expectedSales : null;
              return (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "14px 16px", marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "15px", color: "#fff" }}>{r.date_label}</div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "3px" }}>Closed by <span style={{ color: "#f5c842" }}>{r.closer_name || "—"}</span></div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ ...S.mono, fontSize: "17px", fontWeight: 700, color: "#f5c842" }}>{fmt(r.closingTotal)}</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>closing counted</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "6px" }}>
                    {[
                      { l: "Opening",    v: fmt(r.openingTotal), c: "#a8d8a8" },
                      { l: "Sales",      v: fmt(r.salesValue),   c: "#6ec6f0" },
                      { l: "Cash Sales", v: fmt(r.cashSales),    c: "#6ec6f0" },
                      r.pettyCash > 0 ? { l: "Petty Cash", v: fmt(r.pettyCash), c: "#f08080" } : null,
                      r.bankRun   > 0 ? { l: "Bank Run",   v: fmt(r.bankRun),   c: "#f08080" } : null,
                      variance !== null ? { l: "Variance", v: fmt(variance), c: variance < 0 ? "#f08080" : "#a8d8a8" } : null,
                    ].filter(Boolean).map((x) => (
                      <div key={x.l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "7px 10px" }}>
                        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "3px" }}>{x.l}</div>
                        <div style={{ ...S.mono, fontSize: "12px", fontWeight: 700, color: x.c }}>{x.v}</div>
                      </div>
                    ))}
                  </div>
                  {(r.pettyCashNote || r.bankRunNote) && (
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      {r.pettyCashNote && <div>Petty cash: {r.pettyCashNote}</div>}
                      {r.bankRunNote   && <div>Bank run: {r.bankRunNote}</div>}
                    </div>
                  )}
                </div>
              );
            })
        }
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export default function TillCounter() {
  const [tab, setTab]               = useState("closing");
  const [openingQtys, setOQ]        = useState({});
  const [openingRolls, setOR]       = useState({});
  const [closingQtys, setCQ]        = useState({});
  const [closingRolls, setCR]       = useState({});
  const [salesValue, setSales]      = useState("");
  const [pettyCash, setPetty]       = useState("");
  const [pettyCashNote, setPettyN]  = useState("");
  const [bankRun, setBankRun]       = useState("");
  const [bankRunNote, setBankRunN]  = useState("");
  const [expectedSales, setExpected]= useState("");
  const [closerName, setCloser]     = useState("");
  const [records, setRecords]       = useState([]);
  const [showHistory, setShowHist]  = useState(false);
  const [toast, setToast]           = useState(null);
  const [prevClosing, setPrev]      = useState(null);
  const [loading, setLoading]       = useState(true);
  const [savedToday, setSaved]      = useState(false);
  const [saving, setSaving]         = useState(false);

  // Load on mount
  useEffect(() => {
    (async () => {
      try {
        const [recs, draft] = await Promise.all([api.records(), api.draft(todayKey())]);
        setRecords(recs);
        if (draft) {
          if (Object.keys(draft.opening_qtys || {}).length) setOQ(draft.opening_qtys);
          setCQ(draft.closing_qtys || {});
          setSales(draft.salesValue > 0 ? String(draft.salesValue) : "");
          setPetty(draft.pettyCash > 0 ? String(draft.pettyCash) : "");
          setPettyN(draft.pettyCashNote || "");
          setBankRun(draft.bankRun > 0 ? String(draft.bankRun) : "");
          setBankRunN(draft.bankRunNote || "");
          setExpected(draft.expectedSales > 0 ? String(draft.expectedSales) : "");
          setCloser(draft.closerName || "");
          if (draft.savedToday) setSaved(true);
        }
        if (recs.length > 0) {
          const last = recs[recs.length - 1];
          setPrev({ total: last.closingTotal, date: last.date_label });
          if (!draft || !Object.keys(draft.opening_qtys || {}).length) {
            setOQ(last.closing_qtys || {});
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => api.saveDraft({
      dateKey: todayKey(), openingQtys, closingQtys,
      salesValue: +salesValue || 0, pettyCash: +pettyCash || 0, pettyCashNote,
      bankRun: +bankRun || 0, bankRunNote, expectedSales: +expectedSales || 0,
      closerName, savedToday,
    }), 1500);
    return () => clearTimeout(t);
  }, [openingQtys, closingQtys, salesValue, pettyCash, pettyCashNote, bankRun, bankRunNote, expectedSales, closerName, savedToday, loading]);

  const openingTotal   = calcTotal(openingQtys, openingRolls);
  const closingCounted = calcTotal(closingQtys, closingRolls);
  const petty          = +pettyCash || 0;
  const bank           = +bankRun   || 0;
  const sales          = +salesValue|| 0;
  const expected       = +expectedSales || 0;
  // Formula: Closing Counted = Opening + Cash Sales - Petty Cash - Bank Run
  // Therefore: Cash Sales = Closing Counted - Opening + Petty Cash + Bank Run
  const cashSales      = closingCounted - openingTotal + petty + bank;
  const variance       = expected > 0 ? cashSales - expected : null;

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const handleSave = async () => {
    if (!closerName.trim()) { showToast("⚠️ Please enter the closer's name.", "error"); setTab("closing"); return; }
    if (closingCounted === 0) { showToast("⚠️ Closing float is empty — count your till first.", "error"); return; }
    setSaving(true);
    try {
      const res = await api.saveRecord({
        dateKey: todayKey(), dateLabel: todayStr(), closerName: closerName.trim(),
        openingQtys, closingQtys, openingTotal, closingTotal: closingCounted,
        salesValue: sales, pettyCash: petty, pettyCashNote, bankRun: bank, bankRunNote,
        cashSales, expectedSales: expected,
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Save failed");
      setRecords(await api.records());
      setSaved(true);
      showToast("✅ Saved! Tomorrow's opening carries today's closing.");
    } catch (e) {
      console.error(e);
      showToast(`❌ ${e.message}`, "error");
    } finally { setSaving(false); }
  };

  const setQty  = (setter, key, val) => setter(p => ({ ...p, [key]: val }));

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.35)", fontFamily: "sans-serif" }}>
      Loading…
    </div>
  );

  const isOpening = tab === "opening";
  const qtys      = isOpening ? openingQtys  : closingQtys;
  const rolls     = isOpening ? openingRolls : closingRolls;
  const setQ      = isOpening ? (k,v) => setQty(setOQ, k, v) : (k,v) => setQty(setCQ, k, v);
  const setR      = isOpening ? (k,v) => setQty(setOR, k, v) : (k,v) => setQty(setCR, k, v);
  const tabTotal  = calcTotal(qtys, rolls);
  const roTotal   = isOpening ? openingTotal : closingCounted;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;600&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: "16px", left: "50%", transform: "translateX(-50%)", zIndex: 200, background: toast.type === "error" ? "#3b0a0a" : "#052e16", border: `1px solid ${toast.type === "error" ? "#f87171" : "#4ade80"}`, borderRadius: "12px", padding: "12px 20px", fontSize: "13px", fontWeight: 600, color: "#fff", maxWidth: "380px", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.7)", whiteSpace: "pre-line" }}>
          {toast.msg}
        </div>
      )}

      {showHistory && <HistoryPanel records={records} onClose={() => setShowHist(false)} />}

      {/* Header */}
      <div style={{ background: "linear-gradient(160deg,#16161f,#0a0a0f)", borderBottom: "1px solid rgba(245,200,66,0.1)", padding: "16px 18px 14px" }}>
        <div style={{ maxWidth: "540px", margin: "0 auto", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ width: "36px", height: "36px", background: "linear-gradient(135deg,#f5c842,#d97706)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>💰</div>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "19px", fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Till Counter</h1>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.32)", fontSize: "11px" }}>{todayStr()}</p>
          </div>
          <span style={{ background: "rgba(245,200,66,0.1)", border: "1px solid rgba(245,200,66,0.2)", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", color: "#f5c842" }}>AUD</span>
          <span style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.18)", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", color: "#4ade80", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} /> Cloud Sync
          </span>
          <button onClick={() => setShowHist(true)} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "8px", color: "rgba(255,255,255,0.5)", padding: "6px 12px", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>
            History ({records.length})
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "540px", margin: "0 auto", padding: "16px 14px 50px" }}>

        {/* Carry-over banner */}
        {prevClosing && (
          <div style={{ background: "rgba(110,198,240,0.06)", border: "1px solid rgba(110,198,240,0.13)", borderRadius: "12px", padding: "9px 14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "16px" }}>🔄</span>
            <div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Opening carried from last closing</div>
              <div style={{ ...S.mono, fontSize: "13px", fontWeight: 700, color: "#6ec6f0" }}>{fmt(prevClosing.total)} <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.28)", fontWeight: 400 }}>({prevClosing.date})</span></div>
            </div>
          </div>
        )}

        {/* ── Summary cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
          {[
            { label: "Opening Float",   val: fmt(openingTotal),   color: "#a8d8a8" },
            { label: "Closing Counted", val: fmt(closingCounted), color: "#f5c842" },
            { label: "Cash Sales",      val: fmt(cashSales),      color: cashSales >= 0 ? "#6ec6f0" : "#f08080" },
            variance !== null
              ? { label: "Variance", val: fmt(variance), color: variance === 0 ? "#a8d8a8" : variance > 0 ? "#a8d8a8" : "#f08080", sub: variance > 0 ? "OVER" : variance < 0 ? "SHORT" : "BALANCED" }
              : { label: "Variance", val: "—", color: "rgba(255,255,255,0.2)", sub: "Enter expected sales" },
          ].map((c) => (
            <div key={c.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "11px 13px" }}>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>{c.label}</div>
              <div style={{ ...S.mono, fontSize: "16px", fontWeight: 700, color: c.color }}>{c.val}</div>
              {c.sub && <div style={{ fontSize: "10px", marginTop: "2px", color: c.color, opacity: 0.8, fontWeight: 700 }}>{c.sub}</div>}
            </div>
          ))}
        </div>

        {/* Cash flow breakdown: Closing = Opening + Cash Sales - Petty - Bank Run */}
        {(petty > 0 || bank > 0 || closingCounted > 0) && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", color: "rgba(255,255,255,0.45)", lineHeight: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Opening Float</span>
              <span style={{ color: "#a8d8a8", fontFamily: "'DM Mono',monospace" }}>{fmt(openingTotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>+ Cash Sales</span>
              <span style={{ color: "#6ec6f0", fontFamily: "'DM Mono',monospace" }}>{fmt(cashSales)}</span>
            </div>
            {petty > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>− Petty Cash (taken before count)</span>
                <span style={{ color: "#f08080", fontFamily: "'DM Mono',monospace" }}>−{fmt(petty)}</span>
              </div>
            )}
            {bank > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>− Bank Run (taken after count)</span>
                <span style={{ color: "#f08080", fontFamily: "'DM Mono',monospace" }}>−{fmt(bank)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "4px", paddingTop: "6px", fontWeight: 700 }}>
              <span style={{ color: "#fff" }}>= Closing Counted</span>
              <span style={{ color: "#f5c842", fontFamily: "'DM Mono',monospace" }}>{fmt(closingCounted)}</span>
            </div>
          </div>
        )}

        {/* ── Inputs section ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "4px" }}>
          <MoneyInput icon="📊" label="Today's Sales" sublabel="(from POS)" value={salesValue} onChange={setSales} color="#6ec6f0" />
          <MoneyInput icon="📊" label="Expected Cash" sublabel="(cash portion)" value={expectedSales} onChange={setExpected} color="#a8d8a8" />
        </div>

        <MoneyInput icon="🪙" label="Petty Cash Taken Out" sublabel="(before counting)" value={pettyCash} onChange={setPetty} color="#f08080"
          note={pettyCashNote} onNoteChange={setPettyN} noteLabel="Reason (e.g. staff lunch, supplies…)" />

        <MoneyInput icon="🏦" label="Bank Run" sublabel="(after counting)" value={bankRun} onChange={setBankRun} color="#fb923c"
          note={bankRunNote} onNoteChange={setBankRunN} noteLabel="Note (e.g. deposited by John…)" />

        {/* ── Tabs ── */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "4px", marginBottom: "12px" }}>
          {[["closing","🟡 Closing Float","#f5c842"],["opening","🟢 Opening Float","#a8d8a8"]].map(([key,label,color]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, border: "none", cursor: "pointer", borderRadius: "9px", padding: "8px 6px",
              background: tab === key ? `rgba(${key==="closing"?"245,200,66":"168,216,168"},0.12)` : "transparent",
              color: tab === key ? color : "rgba(255,255,255,0.32)",
              fontWeight: 600, fontSize: "12px", transition: "all 0.2s", fontFamily: "inherit",
            }}>
              {label} <span style={{ ...S.mono, fontSize: "11px", opacity: 0.75, marginLeft: "4px" }}>{fmt(key==="closing"?closingCounted:openingTotal)}</span>
            </button>
          ))}
        </div>

        {/* Closer name — closing tab only */}
        {tab === "closing" && (
          <div style={{ ...S.card, borderColor: "rgba(245,200,66,0.15)", marginBottom: "12px" }}>
            <label style={{ ...S.label }}>👤 Closer Name <span style={{ color: "#f08080" }}>*</span></label>
            <input type="text" placeholder="Name of person closing the till" value={closerName} onChange={(e) => setCloser(e.target.value)} style={S.input} />
          </div>
        )}

        {/* ── Denomination counter ── */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "10px 6px", marginBottom: "12px" }}>
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 52px 88px", gap: "8px", padding: "2px 10px 8px" }}>
            {["Denom","Qty","","Subtotal"].map((h,i) => (
              <span key={i} style={{ fontSize: "9px", color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "1px", textAlign: i===3?"right":"left" }}>{h}</span>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "6px" }}>
            <Section title="Notes" color="#f5c842">
              {NOTES.map(d => (
                <DenomRow key={d.value} label={d.label} color="#f5c842" value={d.value}
                  qty={qtys[d.value] || 0} readOnly={isOpening && !!prevClosing}
                  onChange={(v) => setQ(d.value, v)} />
              ))}
            </Section>
            <Section title="Coins (Loose)" color="#a8d8a8">
              {COINS.map(d => (
                <DenomRow key={d.value} label={d.label} color="#a8d8a8" value={d.value}
                  qty={qtys[d.value] || 0} readOnly={isOpening && !!prevClosing}
                  onChange={(v) => setQ(d.value, v)} />
              ))}
            </Section>
            <Section title="Coin Rolls" color="#c4b5fd">
              {COIN_ROLLS.map(r => (
                <RollRow key={r.value} roll={r}
                  qty={rolls[r.value] || 0}
                  onChange={(v) => setR(r.value, v)} />
              ))}
            </Section>
          </div>
          {/* Total row */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", margin: "8px 0 0", padding: "10px 12px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
              {isOpening ? "Opening Total" : "Closing Total"}
              {calcRolls(rolls) > 0 && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", marginLeft: "6px" }}>incl. {fmt(calcRolls(rolls))} rolls</span>}
            </div>
            <span style={{ ...S.mono, fontSize: "20px", fontWeight: 700, color: isOpening ? "#a8d8a8" : "#f5c842" }}>{fmt(tabTotal)}</span>
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving} style={{
          width: "100%",
          background: savedToday ? "rgba(74,222,128,0.1)" : "linear-gradient(135deg,#f5c842,#d97706)",
          border: savedToday ? "1px solid rgba(74,222,128,0.3)" : "none",
          borderRadius: "14px", color: savedToday ? "#4ade80" : "#0a0a0f",
          padding: "15px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
          fontSize: "15px", fontWeight: 700, fontFamily: "inherit", transition: "all 0.2s",
        }}>
          {saving ? "Saving…" : savedToday ? "✅ Saved Today — Click to Update" : "💾 Save Closing Count"}
        </button>

        <button onClick={() => { setOQ({}); setOR({}); setCQ({}); setCR({}); setSales(""); setPetty(""); setPettyN(""); setBankRun(""); setBankRunN(""); setExpected(""); setCloser(""); setSaved(false); }}
          style={{ marginTop: "8px", width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", color: "rgba(255,255,255,0.2)", padding: "9px", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>
          Reset All
        </button>
      </div>
    </div>
  );
}