"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";
import { useContentProtection, Watermark, ProtectionCurtain } from "@/app/components/ContentProtection";

type PdfContent = {
  id: string;
  type: "PDF";
  title: string;
  subjectName: string;
  watermark: { name: string; email: string };
};

export default function PdfViewerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status: authStatus } = useSession();
  const { hidden } = useContentProtection();

  const [item, setItem] = useState<PdfContent | null>(null);
  const [error, setError] = useState("");
  const [rendering, setRendering] = useState(true);
  const pagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/learn/pdf/${id}`);
      return;
    }
    if (authStatus !== "authenticated") return;

    let cancelled = false;

    async function load() {
      const metaRes = await fetch(`/api/content/${id}`);
      if (!metaRes.ok) {
        setError(metaRes.status === 403 ? "ما عندك صلاحية توصل لهاد المحتوى بعد." : "المحتوى غير موجود.");
        return;
      }
      const meta: PdfContent = await metaRes.json();
      if (cancelled) return;
      setItem(meta);

      const bytesRes = await fetch(`/api/content/${id}/pdf`);
      if (!bytesRes.ok) {
        setError("تعذر تحميل الملف.");
        return;
      }
      const buffer = await bytesRes.arrayBuffer();

      const pdfjsLib = await import("pdfjs-dist");
      // Served as a plain static file (see scripts/copy-pdf-worker.js) so
      // webpack never tries to bundle/minify this ESM worker file itself.
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      if (cancelled || !pagesRef.current) return;
      pagesRef.current.innerHTML = "";

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        if (cancelled) return;
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.4 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.oncontextmenu = (e) => e.preventDefault();
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, viewport }).promise;
        pagesRef.current?.appendChild(canvas);
      }
      if (!cancelled) setRendering(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, authStatus, router]);

  if (error) {
    return (
      <>
        <Nav />
        <div className="empty-state">{error}</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <ProtectionCurtain hidden={hidden} />
      <div className="narrow">
        <div className="page-head">
          <div>
            <h1 style={{ fontSize: 19 }}>{item?.title || ""}</h1>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>{item?.subjectName || ""}</p>
          </div>
        </div>
        {rendering && (
          <div className="loading-box">
            <div className="spin" />
            جاري تحميل الملف...
          </div>
        )}
        <div className="viewer-shell">
          <div className="pdf-pages" ref={pagesRef} />
          {item && <Watermark name={item.watermark.name} email={item.watermark.email} />}
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12, textAlign: "center" }}>
          هاد الملف معلّم باسمك — أي مشاركة أو تسريب بينرجع إلك.
        </p>
      </div>
      <Footer />
    </>
  );
}
