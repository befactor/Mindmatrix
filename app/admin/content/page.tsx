"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";

type Subject = { id: string; name: string };
type ContentRow = {
  id: string;
  type: "VIDEO" | "PDF";
  title: string;
  subjectName: string;
  videoUrl: string | null;
  pdfFilename: string | null;
};

export default function AdminContentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [items, setItems] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [subjectId, setSubjectId] = useState("");
  const [type, setType] = useState<"VIDEO" | "PDF">("VIDEO");
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || session.user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    void refresh();
  }, [status, session, router]);

  async function refresh() {
    const [subRes, itemsRes] = await Promise.all([fetch("/api/subjects"), fetch("/api/admin/content")]);
    const subs = await subRes.json();
    setSubjects(subs);
    if (subs.length > 0 && !subjectId) setSubjectId(subs[0].id);
    setItems(await itemsRes.json());
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (type === "PDF" && !file) {
      setFormError("اختار ملف PDF");
      return;
    }
    if (type === "VIDEO" && !videoUrl.trim()) {
      setFormError("حط رابط الفيديو");
      return;
    }

    const form = new FormData();
    form.set("subjectId", subjectId);
    form.set("type", type);
    form.set("title", title);
    if (type === "VIDEO") form.set("videoUrl", videoUrl.trim());
    if (type === "PDF" && file) form.set("file", file);

    setSubmitting(true);
    const res = await fetch("/api/admin/content", { method: "POST", body: form });
    setSubmitting(false);
    if (!res.ok) {
      setFormError("صار في خطأ برفع المحتوى");
      return;
    }
    setTitle("");
    setVideoUrl("");
    setFile(null);
    void refresh();
  }

  async function deleteItem(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/content/${id}`, { method: "DELETE" });
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
          <h1>إدارة المحتوى</h1>
        </div>

        <div className="admin-panel">
          <div className="card">
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>إضافة محتوى جديد</h2>
            {formError && <div className="form-error">{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>المادة</label>
                <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>النوع</label>
                <select value={type} onChange={(e) => setType(e.target.value as "VIDEO" | "PDF")}>
                  <option value="VIDEO">فيديو</option>
                  <option value="PDF">ملف PDF</option>
                </select>
              </div>
              <div className="form-field">
                <label>العنوان</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              {type === "VIDEO" ? (
                <div className="form-field">
                  <label>رابط الفيديو (Bunny Stream / Vimeo خاص / يوتيوب غير مدرج)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                  <div className="hint">استخدم رابط مباشر أو embed، مش رابط تحميل الملف الأصلي.</div>
                </div>
              ) : (
                <div className="form-field">
                  <label>ملف PDF</label>
                  <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  <div className="hint">يُفضّل أقل من 4 ميجا (حدود الرفع على الخادم).</div>
                </div>
              )}
              <button type="submit" className="btn btn-navy btn-block" disabled={submitting}>
                {submitting ? "جاري الرفع..." : "إضافة"}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>المحتوى الحالي</h2>
            {items.length === 0 ? (
              <div className="empty-state">ما في محتوى مضاف بعد.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>العنوان</th>
                    <th>المادة</th>
                    <th>النوع</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td>{i.title}</td>
                      <td>{i.subjectName}</td>
                      <td>{i.type === "VIDEO" ? "فيديو" : "PDF"}</td>
                      <td>
                        <button className="btn btn-sm btn-danger" disabled={busyId === i.id} onClick={() => deleteItem(i.id)}>
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
