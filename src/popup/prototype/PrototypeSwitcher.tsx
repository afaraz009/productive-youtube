// PROTOTYPE — throwaway. Floating bar to flip between popup variants.
import React, { useEffect } from "react";

interface Variant {
  key: string;
  name: string;
}

interface Props {
  variants: Variant[];
  current: string;
  onChange: (key: string) => void;
}

const PrototypeSwitcher: React.FC<Props> = ({ variants, current, onChange }) => {
  const idx = Math.max(0, variants.findIndex((v) => v.key === current));
  const next = () => onChange(variants[(idx + 1) % variants.length].key);
  const prev = () => onChange(variants[(idx - 1 + variants.length) % variants.length].key);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, variants]);

  const cur = variants[idx];

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 12,
        transform: "translateX(-50%)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 8px",
        borderRadius: 9999,
        background: "rgba(15, 23, 42, 0.95)",
        color: "white",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        fontSize: 12,
        fontWeight: 600,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <button
        onClick={prev}
        aria-label="Previous variant"
        style={btn}
      >‹</button>
      <span style={{ padding: "0 6px", letterSpacing: 0.4 }}>
        <span style={{ opacity: 0.6 }}>VARIANT</span>{" "}
        <span style={{ color: "#fbbf24" }}>{cur.key}</span>{" "}
        <span style={{ opacity: 0.5 }}>— {cur.name}</span>
      </span>
      <button
        onClick={next}
        aria-label="Next variant"
        style={btn}
      >›</button>
    </div>
  );
};

const btn: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 9999,
  background: "rgba(255,255,255,0.1)",
  color: "white",
  border: "none",
  cursor: "pointer",
  fontSize: 16,
  lineHeight: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default PrototypeSwitcher;
