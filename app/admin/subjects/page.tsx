"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";

const TRACKS = ["IB", "SAT", "AP", "IGCSE", "BTEC", "EST"] as const;

type Subject = {
  id: string;
  track: string;
  name: string;
  slug: string;
  description: string | null;
  priceJod: string;
  active: boolean;
};

export default function AdminSubjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [track, setTrack] = useState<(typeof TRACKS)[number]>("IB");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceJod, setPriceJod] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || session.user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    void refresh();
  }, [status, session, router]);

  async function refresh() {
    const res = await fetch("/api/admin/subjects");
    setSubjects(await res.json());
    setLoading(false);
  }

  async function createSubject(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!name.trim() || !priceJod) {
      setFormError("عبّي الاسم والسعر");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/admin/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track, name, description, priceJod: Number(priceJod) }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setFormError("صار في خطأ بإضافة المادة");
      return;
    }
    setName("");
    setDescription("");
    setPriceJod("");
    void refresh();
  }

  async function updateSubject(id: string, data: Partial<Subject>) {
    setBusyId(id);
    await fetch(`/api/admin/subjects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusyId(null);
    void refresh();
  }

  if (status === "loading" || loading) {
    return (
      <>
        <Nav />
        <div className="loading-box">
          <div className="spin" />
          جاري التحميل...
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="container" style={{ padding: "40px 20px 100px" }}>
        <div className="page-head">
          <h1>إدارة المواد</h1>
        </div>

        <div className="admin-panel">
          <div className="card">
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>إضافة مادة جديدة</h2>
            {formError && <div className="form-error">{formError}</div>}
            <form onSubmit={createSubject}>
              <div className="form-field">
                <label>المنهاج</label>
                <select value={track} onChange={(e) => setTrack(e.target.value as (typeof TRACKS)[number])}>
                  {TRACKS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>اسم المادة</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-field">
                <label>وصف مختصر</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="form-field">
                <label>السعر (د.أ / جلسة)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={priceJod}
                  onChange={(e) => setPriceJod(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-navy btn-block" disabled={submitting}>
                {submitting ? "جاري الإضافة..." : "إضافة المادة"}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>المواد الحالية</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {subjects.map((s) => (
                <div key={s.id} className="card" style={{ padding: 16, opacity: s.active ? 1 : 0.55 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.track} · /{s.slug}</div>
                    </div>
                    <span className={`badge ${s.active ? "badge-confirmed" : "badge-cancelled"}`}>
                      {s.active ? "فعّالة" : "معطّلة"}
                    </span>
                  </div>
                  <div className="form-field" style={{ marginTop: 10 }}>
                    <label>السعر (د.أ)</label>
                    <input
                      type="number"
                      step="0.5"
                      defaultValue={Number(s.priceJod)}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (val !== Number(s.priceJod)) updateSubject(s.id, { priceJod: val as unknown as string });
                      }}
                    />
                  </div>
                  <button
                    className={`btn btn-sm ${s.active ? "btn-danger" : "btn-navy"}`}
                    disabled={busyId === s.id}
                    onClick={() => updateSubject(s.id, { active: !s.active })}
                  >
                    {s.active ? "تعطيل المادة" : "تفعيل المادة"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
