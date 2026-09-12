"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";

type Subject = { id: string; name: string };
type AdminBooking = {
  id: string;
  status: string;
  subject: { name: string };
  slot: { startsAt: string };
  user: { name: string | null; email: string | null; phone: string | null };
  payment: { cliqReference: string; senderName: string | null; amountJod: string } | null;
};
type AdminSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  isBooked: boolean;
  subject: { name: string };
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [slots, setSlots] = useState<AdminSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [subjectId, setSubjectId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [slotError, setSlotError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || session.user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    void refresh();
  }, [status, session, router]);

  async function refresh() {
    const [bRes, sRes, subRes] = await Promise.all([
      fetch("/api/admin/bookings"),
      fetch("/api/admin/slots"),
      fetch("/api/subjects"),
    ]);
    setBookings(await bRes.json());
    setSlots(await sRes.json());
    const subs = await subRes.json();
    setSubjects(subs);
    if (subs.length > 0 && !subjectId) setSubjectId(subs[0].id);
    setLoading(false);
  }

  async function confirmBooking(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/bookings/${id}/confirm`, { method: "POST" });
    setBusyId(null);
    void refresh();
  }

  async function rejectBooking(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/bookings/${id}/reject`, { method: "POST" });
    setBusyId(null);
    void refresh();
  }

  async function createSlot(e: React.FormEvent) {
    e.preventDefault();
    setSlotError("");
    const res = await fetch("/api/admin/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, startsAt, endsAt }),
    });
    if (!res.ok) {
      setSlotError("تأكد من التواريخ — وقت النهاية لازم يكون بعد وقت البداية");
      return;
    }
    setStartsAt("");
    setEndsAt("");
    void refresh();
  }

  async function deleteSlot(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/slots/${id}`, { method: "DELETE" });
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
          <h1>لوحة الإدارة</h1>
        </div>

        <div className="admin-panel">
          <div className="card">
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>حجوزات بانتظار التأكيد</h2>
            {bookings.length === 0 ? (
              <div className="empty-state">ما في حجوزات بانتظار المراجعة حالياً.</div>
            ) : (
              <div className="booking-list">
                {bookings.map((b) => (
                  <div className="booking-row" key={b.id} style={{ flexDirection: "column", alignItems: "stretch" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div className="subject-name">{b.subject.name}</div>
                        <div className="meta">
                          {b.user.name || b.user.email} · {b.user.phone || "بدون رقم"}
                        </div>
                        <div className="meta">
                          {new Date(b.slot.startsAt).toLocaleString("ar", {
                            day: "numeric",
                            month: "short",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <span className={`badge ${b.status === "AWAITING_CONFIRMATION" ? "badge-awaiting" : "badge-pending"}`}>
                        {b.status === "AWAITING_CONFIRMATION" ? "بانتظار التأكيد" : "بانتظار الدفع"}
                      </span>
                    </div>

                    {b.payment && (
                      <div style={{ fontSize: 13, background: "var(--bg)", borderRadius: 10, padding: 10 }}>
                        رقم العملية: <strong>{b.payment.cliqReference}</strong>
                        {b.payment.senderName && <> · الاسم: {b.payment.senderName}</>} · المبلغ:{" "}
                        {Number(b.payment.amountJod)} د.أ
                      </div>
                    )}

                    {b.status === "AWAITING_CONFIRMATION" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="btn btn-navy btn-sm"
                          disabled={busyId === b.id}
                          onClick={() => confirmBooking(b.id)}
                        >
                          تأكيد الدفع
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={busyId === b.id}
                          onClick={() => rejectBooking(b.id)}
                        >
                          رفض
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>إضافة موعد متاح</h2>
            {slotError && <div className="form-error">{slotError}</div>}
            <form onSubmit={createSlot} style={{ marginBottom: 24 }}>
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
                <label>من</label>
                <input type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
              </div>
              <div className="form-field">
                <label>إلى</label>
                <input type="datetime-local" required value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-navy btn-block">
                إضافة الموعد
              </button>
            </form>

            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "var(--muted)" }}>
              المواعيد القادمة
            </h3>
            <table className="table">
              <thead>
                <tr>
                  <th>المادة</th>
                  <th>الوقت</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={s.id}>
                    <td>{s.subject.name}</td>
                    <td>
                      {new Date(s.startsAt).toLocaleString("ar", {
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>{s.isBooked ? "محجوز" : "متاح"}</td>
                    <td>
                      {!s.isBooked && (
                        <button className="btn btn-sm btn-danger" disabled={busyId === s.id} onClick={() => deleteSlot(s.id)}>
                          حذف
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
