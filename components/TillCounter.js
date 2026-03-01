"use client";

import { useState, useEffect } from "react";

const AUD_DENOMINATIONS = [
  { label: "$100", value: 100, type: "note" },
  { label: "$50",  value: 50,  type: "note" },
  { label: "$20",  value: 20,  type: "note" },
  { label: "$10",  value: 10,  type: "note" },
  { label: "$5",   value: 5,   type: "note" },
  { label: "$2",   value: 2,   type: "coin" },
  { label: "$1",   value: 1,   type: "coin" },
  { label: "50c",  value: 0.5, type: "coin" },
  { label: "20c",  value: 0.2, type: "coin" },
  { label: "10c",  value: 0.1, type: "coin" },
  { label: "5c",   value: 0.05,type: "coin" },
];

const fmt = (n) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n ?? 0);

const todayStr = () =>
  new Date().toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const todayKey = () => new Date().toISOString().slice(0, 10);

const calcTotal = (qtys) =>
  AUD_DENOMINATIONS.reduce((sum, d) => sum + (qtys?.[d.value] || 0) * d.value, 0);

async function apiLoadRecords() {
  const res = await fetch("/api/records");
  const data = await res.json();
  return data.records ?? [];
}
async function apiSaveRecord(record) {
  await fetch("/api/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
}
async function apiLoadDraft(dateKey) {
  const res = await fetch(`/api/draft?dateKey=${dateKey}`);
  const data = await res.json();
  return data.draft ?? null;
}
async function apiSaveDraft(draft) {
  await fetch("/api/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
}

function DenomRow({ denom, qty, onChange, readOnly }) {
  const subtotal = (qty || 0) * denom.value;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "60px 1fr 48px 90px",
      alignItems: "center", gap: "10px", padding: "7px 12px", borderRadius: "10px",
      background: qty > 0 ? "rgba(250,200,70,0.07)" : "transparent", transition: "background 0.2s",
    }}>
      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "15px", fontWeight: 600, color: denom.type === "note" ? "#f5c842" : "#a8d8a8" }}>
        {denom.label}
      </span>
      {readOnly
        ? <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
        : <input type="range" min={0} max={50} value={qty || 0}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{ accentColor: denom.type === "note" ? "#f5c842" : "#a8d8a8", cursor: "pointer", width: "100%" }} />
      }
      <input
        type="number" min={0}
        value={qty === 0 ? "" : qty || ""} placeholder="0"
        readOnly={readOnly}
        onChange={(e) => !readOnly && onChange(Math.max(0, Number(e.target.value) || 0))}
        style={{
          width: "44px", background: readOnly ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px",
          color: readOnly ? "rgba(255,255,255,0.35)" : "#fff",
          textAlign: "center", padding: "4px", fontSize: "14px", fontFamily: "'DM Mono',monospace",
        }}
      />
      <span style={{ textAlign: "right", fontFamily: "'DM Mono',monospace", fontSize: "14px", color: subtotal > 0 ? "#f5c842" : "rgba(255,255,255,0.2)" }}>
        {fmt(subtotal)}
      </span>
    </div>
  );
}

function HistoryPanel({ records, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#16161f", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: "520px", maxHeight: "80vh", overflowY: "auto", padding: "24px 20px 40px" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display',serif", fontSize: "20px", color: "#fff" }}>📋 Saved Records</h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: "8px", padding: "6px 14px", cursor: "pointer", fontSize: "13px" }}>Close</button>
        </div>
        {records.length === 0
          ? <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "40px 0" }}>No records saved yet.</p>
          : [...records].reverse().map((r, i) => {
              const variance = r.expectedSales > 0 ? r.cashSales - r.expectedSales : null;
              return (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "14px 16px", marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "#fff" }}>{r.date_label}</div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                        Closed by: <span style={{ color: "#f5c842" }}>{r.closer_name || "—"}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "16px", fontWeight: 700, color: "#f5c842" }}>{fmt(r.closingTotal)}</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>closing (counted)</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: r.cashTakenOut > 0 ? "8px" : "0" }}>
                    {[
                      { l: "Opening",    v: fmt(r.openingTotal), c: "#a8d8a8" },
                      { l: "Cash Sales", v: fmt(r.cashSales),    c: "#6ec6f0" },
                      variance !== null
                        ? { l: "Variance", v: fmt(variance), c: variance < 0 ? "#f08080" : "#a8d8a8" }
                        : { l: "Expected", v: "—",           c: "rgba(255,255,255,0.3)" },
                      ...(r.cashTakenOut > 0 ? [{ l: "Cash Taken Out", v: fmt(r.cashTakenOut), c: "#f08080" }] : []),
                    ].map((x) => (
                      <div key={x.l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "8px 10px" }}>
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.6px" }}>{x.l}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "13px", fontWeight: 600, color: x.c }}>{x.v}</div>
                      </div>
                    ))}
                  </div>
                  {r.cashTakenOut > 0 && (
                    <div style={{ background: "rgba(240,128,128,0.06)", border: "1px solid rgba(240,128,128,0.15)", borderRadius: "8px", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>Adjusted Closing (counted + taken out)</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "13px", fontWeight: 700, color: "#f5c842" }}>{fmt(r.closingTotal + r.cashTakenOut)}</span>
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

export default function TillCounter() {
  const [tab, setTab]                     = useState("opening");
  const [openingQtys, setOpeningQtys]     = useState({});
  const [closingQtys, setClosingQtys]     = useState({});
  const [expectedSales, setExpectedSales] = useState("");
  const [cashTakenOut, setCashTakenOut]   = useState("");
  const [takenOutNote, setTakenOutNote]   = useState("");
  const [closerName, setCloserName]       = useState("");
  const [records, setRecords]             = useState([]);
  const [showHistory, setShowHistory]     = useState(false);
  const [toast, setToast]                 = useState(null);
  const [prevClosing, setPrevClosing]     = useState(null);
  const [loading, setLoading]             = useState(true);
  const [savedToday, setSavedToday]       = useState(false);
  const [saving, setSaving]               = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [recs, draft] = await Promise.all([
          apiLoadRecords(),
          apiLoadDraft(todayKey()),
        ]);
        setRecords(recs);
        if (draft) {
          if (Object.keys(draft.opening_qtys || {}).length > 0) setOpeningQtys(draft.opening_qtys);
          setClosingQtys(draft.closing_qtys || {});
          setExpectedSales(draft.expectedSales != null ? String(draft.expectedSales) : "");
          setCloserName(draft.closerName || "");
          setCashTakenOut(draft.cashTakenOut != null && draft.cashTakenOut > 0 ? String(draft.cashTakenOut) : "");
          setTakenOutNote(draft.takenOutNote || "");
          if (draft.savedToday) setSavedToday(true);
        }
        if (recs.length > 0) {
          const last = recs[recs.length - 1];
          setPrevClosing({ total: last.closingTotal, date: last.date_label });
          if (!draft || Object.keys(draft.opening_qtys || {}).length === 0) {
            setOpeningQtys(last.closing_qtys || {});
          }
        }
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Auto-save draft (debounced 1.5s)
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      apiSaveDraft({
        dateKey: todayKey(),
        openingQtys, closingQtys,
        expectedSales: parseFloat(expectedSales) || 0,
        closerName,
        cashTakenOut: parseFloat(cashTakenOut) || 0,
        takenOutNote,
        savedToday,
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [openingQtys, closingQtys, expectedSales, closerName, cashTakenOut, takenOutNote, savedToday, loading]);

  const openingTotal   = calcTotal(openingQtys);
  const closingCounted = calcTotal(closingQtys);
  const takenOut       = parseFloat(cashTakenOut) || 0;
  // Adjusted closing = what was counted in till + what was already removed
  const adjustedClosing = closingCounted + takenOut;
  const cashSales      = adjustedClosing - openingTotal;
  const expected       = parseFloat(expectedSales) || 0;
  const variance       = expected > 0 ? cashSales - expected : null;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    if (!closerName.trim()) {
      showToast("⚠️ Please enter the closer's name before saving.", "error");
      setTab("closing");
      return;
    }
    if (closingCounted === 0) {
      showToast("⚠️ Closing float is empty — count your closing till first.", "error");
      return;
    }
    setSaving(true);
    try {
      await apiSaveRecord({
        dateKey: todayKey(), dateLabel: todayStr(),
        closerName: closerName.trim(),
        openingQtys, closingQtys,
        openingTotal,
        closingTotal: closingCounted,
        cashTakenOut: takenOut,
        cashSales,
        expectedSales: expected,
        takenOutNote: takenOutNote.trim(),
      });
      const recs = await apiLoadRecords();
      setRecords(recs);
      setSavedToday(true);
      showToast("✅ Saved! Tomorrow's opening will carry today's closing balance.");
    } catch {
      showToast("❌ Save failed — check your connection.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0f0f14", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>
      Loading till data…
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f14", color: "#fff", fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;600&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      {toast && (
        <div style={{
          position: "fixed", top: "16px", left: "50%", transform: "translateX(-50%)", zIndex: 200,
          background: toast.type === "error" ? "#450a0a" : "#052e16",
          border: `1px solid ${toast.type === "error" ? "#f87171" : "#4ade80"}`,
          borderRadius: "12px", padding: "12px 20px", fontSize: "13px", fontWeight: 500,
          color: "#fff", maxWidth: "380px", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        }}>{toast.msg}</div>
      )}

      {showHistory && <HistoryPanel records={records} onClose={() => setShowHistory(false)} />}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1a1a24,#0f0f14)", borderBottom: "1px solid rgba(245,200,66,0.12)", padding: "18px 20px 14px" }}>
        <div style={{ maxWidth: "520px", margin: "0 auto", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ width: "34px", height: "34px", background: "linear-gradient(135deg,#f5c842,#e0a020)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px" }}>💰</div>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: 700, margin: 0 }}>Till Counter</h1>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>{todayStr()}</p>
          </div>
          <span style={{ background: "rgba(245,200,66,0.1)", border: "1px solid rgba(245,200,66,0.2)", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", color: "#f5c842" }}>AUD</span>
          <span style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", color: "#4ade80", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            Cloud Sync
          </span>
          <button onClick={() => setShowHistory(true)} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "rgba(255,255,255,0.55)", padding: "6px 12px", cursor: "pointer", fontSize: "12px", fontFamily: "'DM Sans',sans-serif" }}>
            History ({records.length})
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "18px 16px 40px" }}>

        {prevClosing && (
          <div style={{ background: "rgba(110,198,240,0.06)", border: "1px solid rgba(110,198,240,0.14)", borderRadius: "12px", padding: "10px 14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>🔄</span>
            <div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>Opening carried from last closing</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "14px", fontWeight: 600, color: "#6ec6f0" }}>
                {fmt(prevClosing.total)} <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>({prevClosing.date})</span>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
          {[
            { label: "Opening Float",   val: fmt(openingTotal),    color: "#a8d8a8" },
            { label: "Closing (Counted)", val: fmt(closingCounted), color: "#f5c842" },
            { label: "Cash Sales",      val: fmt(cashSales),       color: cashSales >= 0 ? "#6ec6f0" : "#f08080" },
            variance !== null
              ? { label: "Variance", val: fmt(variance), color: variance === 0 ? "#a8d8a8" : variance > 0 ? "#a8d8a8" : "#f08080", sub: variance > 0 ? "OVER" : variance < 0 ? "SHORT" : "BALANCED" }
              : { label: "Variance", val: "—", color: "rgba(255,255,255,0.25)", sub: "Enter expected sales" },
          ].map((c) => (
            <div key={c.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "12px 14px" }}>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px" }}>{c.label}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "17px", fontWeight: 700, color: c.color }}>{c.val}</div>
              {c.sub && <div style={{ fontSize: "10px", marginTop: "2px", color: c.color, opacity: 0.75, fontWeight: 600 }}>{c.sub}</div>}
            </div>
          ))}
        </div>

        {/* Cash taken out — shown prominently when > 0 */}
        {takenOut > 0 && (
          <div style={{ background: "rgba(240,128,128,0.07)", border: "1px solid rgba(240,128,128,0.2)", borderRadius: "12px", padding: "10px 16px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.8px" }}>Adjusted Closing</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>Counted {fmt(closingCounted)} + Taken Out {fmt(takenOut)}</div>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "20px", fontWeight: 700, color: "#f5c842" }}>{fmt(adjustedClosing)}</div>
          </div>
        )}

        {/* Expected Sales */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "12px 16px", marginBottom: "14px" }}>
          <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px", display: "block", marginBottom: "8px" }}>Expected Cash Sales (POS / reports)</label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#f5c842", fontFamily: "'DM Mono',monospace", fontSize: "18px" }}>$</span>
            <input type="number" placeholder="0.00" value={expectedSales} onChange={(e) => setExpectedSales(e.target.value)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "20px", fontFamily: "'DM Mono',monospace", fontWeight: 600 }} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "4px", marginBottom: "14px" }}>
          {[["opening", "🟢 Opening Float", "#a8d8a8"], ["closing", "🟡 Closing Float", "#f5c842"]].map(([key, label, color]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, border: "none", cursor: "pointer", borderRadius: "9px", padding: "9px 6px",
              background: tab === key ? `rgba(${key === "opening" ? "168,216,168" : "245,200,66"},0.13)` : "transparent",
              color: tab === key ? color : "rgba(255,255,255,0.35)",
              fontWeight: 600, fontSize: "13px", transition: "all 0.2s", fontFamily: "'DM Sans',sans-serif",
            }}>
              {label}
              <span style={{ marginLeft: "6px", fontFamily: "'DM Mono',monospace", fontSize: "11px", opacity: 0.8 }}>
                {key === "opening" ? fmt(openingTotal) : fmt(closingCounted)}
              </span>
            </button>
          ))}
        </div>

        {/* Closing tab extras: closer name + cash taken out */}
        {tab === "closing" && (
          <>
            {/* Closer name */}
            <div style={{ marginBottom: "12px", padding: "12px 14px", background: "rgba(245,200,66,0.05)", borderRadius: "12px", border: "1px solid rgba(245,200,66,0.12)" }}>
              <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.8px", display: "block", marginBottom: "8px" }}>
                👤 Closer Name <span style={{ color: "#f08080" }}>*</span>
              </label>
              <input type="text" placeholder="Name of person closing the till"
                value={closerName} onChange={(e) => setCloserName(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff", padding: "9px 12px", fontSize: "14px", fontFamily: "'DM Sans',sans-serif", outline: "none" }}
              />
            </div>

            {/* Cash taken out */}
            <div style={{ marginBottom: "14px", padding: "12px 14px", background: "rgba(240,128,128,0.05)", borderRadius: "12px", border: "1px solid rgba(240,128,128,0.15)" }}>
              <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.8px", display: "block", marginBottom: "8px" }}>
                💸 Cash Taken Out <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>(removed before counting)</span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ color: "#f08080", fontFamily: "'DM Mono',monospace", fontSize: "18px" }}>$</span>
                <input type="number" placeholder="0.00" value={cashTakenOut}
                  onChange={(e) => setCashTakenOut(e.target.value)}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "20px", fontFamily: "'DM Mono',monospace", fontWeight: 600 }} />
              </div>
              <input type="text" placeholder="Reason / note (e.g. safe drop, banking run)"
                value={takenOutNote} onChange={(e) => setTakenOutNote(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#fff", padding: "7px 12px", fontSize: "13px", fontFamily: "'DM Sans',sans-serif", outline: "none" }}
              />
              {takenOut > 0 && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                  Adjusted closing will be <span style={{ color: "#f5c842", fontWeight: 600 }}>{fmt(closingCounted + takenOut)}</span> ({fmt(closingCounted)} counted + {fmt(takenOut)} taken out)
                </div>
              )}
            </div>
          </>
        )}

        {/* Denomination counter */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "8px 4px" }}>
          <div style={{ padding: "6px 12px 8px", display: "grid", gridTemplateColumns: "60px 1fr 48px 90px", gap: "10px" }}>
            {["Denom", "Qty", "", "Subtotal"].map((h, i) => (
              <span key={i} style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.8px", textAlign: i === 3 ? "right" : "left" }}>{h}</span>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "6px" }}>
            {["note", "coin"].map((type) => (
              <div key={type}>
                <div style={{ padding: "4px 12px", fontSize: "10px", color: type === "note" ? "#f5c842" : "#a8d8a8", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.6 }}>{type}s</div>
                {AUD_DENOMINATIONS.filter((d) => d.type === type).map((d) => (
                  <DenomRow key={d.value} denom={d}
                    qty={tab === "opening" ? (openingQtys[d.value] || 0) : (closingQtys[d.value] || 0)}
                    readOnly={tab === "opening" && !!prevClosing}
                    onChange={(val) => {
                      if (tab === "opening") setOpeningQtys((p) => ({ ...p, [d.value]: val }));
                      else setClosingQtys((p) => ({ ...p, [d.value]: val }));
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", margin: "8px 0 0", padding: "10px 14px 6px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
              {tab === "opening" ? "Opening Total" : "Closing Total (Counted)"}
            </span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "20px", fontWeight: 700, color: tab === "opening" ? "#a8d8a8" : "#f5c842" }}>
              {tab === "opening" ? fmt(openingTotal) : fmt(closingCounted)}
            </span>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} style={{
          marginTop: "16px", width: "100%",
          background: savedToday ? "rgba(74,222,128,0.12)" : "linear-gradient(135deg,#f5c842,#d97706)",
          border: savedToday ? "1px solid rgba(74,222,128,0.3)" : "none",
          borderRadius: "12px", color: savedToday ? "#4ade80" : "#0f0f14",
          padding: "14px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
          fontSize: "15px", fontWeight: 700, fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s",
        }}>
          {saving ? "Saving…" : savedToday ? "✅ Saved Today — Click to Update" : "💾 Save Closing Count"}
        </button>

        <button onClick={() => { setOpeningQtys({}); setClosingQtys({}); setExpectedSales(""); setCloserName(""); setCashTakenOut(""); setTakenOutNote(""); setSavedToday(false); }}
          style={{ marginTop: "10px", width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", color: "rgba(255,255,255,0.22)", padding: "9px", cursor: "pointer", fontSize: "12px", fontFamily: "'DM Sans',sans-serif" }}>
          Reset All
        </button>
      </div>
    </div>
  );
}
