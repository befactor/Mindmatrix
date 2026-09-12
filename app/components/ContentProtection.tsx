"use client";

import { useEffect, useState } from "react";

// Best-effort deterrents only. No web page can truly block a screenshot or
// someone photographing the screen with another device — see README. What
// this buys us:
//   1. A blur/hide the instant the tab loses focus or visibility, which
//      breaks clean screen recordings and most screenshot *tools* (which
//      need the window focused or capture on a delay).
//   2. Friction against the common "save this page" paths (right-click,
//      Ctrl+S, Ctrl+P, dev tools).
//   3. A watermark (see <Watermark/> below) that survives any capture that
//      does get through, tracing it back to the viewing student.
export function useContentProtection() {
  const [hidden, setHidden] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    function onVisibility() {
      setHidden(document.visibilityState !== "visible");
    }
    function onBlur() {
      setHidden(true);
    }
    function onFocus() {
      setHidden(false);
    }
    function onContextMenu(e: MouseEvent) {
      e.preventDefault();
    }
    function onKeyDown(e: KeyboardEvent) {
      const blockedCombo =
        e.key === "PrintScreen" ||
        (e.ctrlKey && ["s", "p", "u"].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.shiftKey && ["i", "c", "j"].includes(e.key.toLowerCase())) ||
        e.key === "F12";
      if (blockedCombo) {
        e.preventDefault();
        setFlash(true);
        window.setTimeout(() => setFlash(false), 1200);
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return { hidden: hidden || flash };
}

export function Watermark({ name, email }: { name: string; email: string }) {
  const [stamp, setStamp] = useState("");

  useEffect(() => {
    function tick() {
      setStamp(new Date().toLocaleString("ar"));
    }
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  const line = `${name} · ${email} · ${stamp}`;

  return (
    <div className="watermark-layer" aria-hidden="true">
      {Array.from({ length: 24 }).map((_, i) => (
        <span key={i} className="watermark-line">
          {line}
        </span>
      ))}
    </div>
  );
}

export function ProtectionCurtain({ hidden }: { hidden: boolean }) {
  if (!hidden) return null;
  return (
    <div className="protection-curtain">
      <div>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
        المحتوى محمي — رجّع الصفحة لواجهة العرض
      </div>
    </div>
  );
}
