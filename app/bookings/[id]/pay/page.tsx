"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";
import { CLIQ_ALIAS, CLIQ_BANK_NAME } from "@/lib/config";

type BookingDetail = {
  id: string;
  status: string;
  subject: { name: string; priceJod: string };
  slot: { startsAt: string; endsAt: string };
  payment: { cliqReference: string } | null;
};

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status: authStatus } = useSession();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [cliqReference, setCliqReference] = useState("");
  const [senderName, setSenderName] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/bookings/${id}/pay`);
      return;
    }
    if (authStatus !== "authenticated") return;

    async function load() {
      const res = await fetch(`/api/bookings/${id}`);
      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setBooking(await res.json());
      setLoading(false);
    }
    load();
  }, [id, authStatus, router]);

  async function submitProof(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/bookings/${id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliqReference, senderName, proofNote }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("صار في خطأ بإرسال إثبات الدفع، حاول مرة ثانية");
      return;
    }
    setSubmitted(true);
  }

  if (loading || authStatus === "loading") {
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

  if (notFound || !booking) {
    return (
      <>
        <Nav />
        <div className="empty-state">الحجز غير موجود.</div>
        <Footer />
      </>
    );
  }

  const showForm = booking.status === "PENDING_PAYMENT" && !submitted;
  const awaitingOrDone = submitted || booking.status !== "PENDING_PAYMENT";

  return (
    <>
      <Nav />
      <div className="narrow">
        <div className="card">
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>تأكيد الدفع</h1>

          <div className="summary-row">
            <span className="label">المادة</span>
            <span className="value">{booking.subject.name}</span>
          </div>
          <div className="summary-row">
            <span className="label">الموعد</span>
            <span className="value">
              {new Date(booking.slot.startsAt).toLocaleString("ar", {
                weekday: "long",
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="summary-row">
            <span className="label">المبلغ</span>
            <span className="value">{Number(booking.subject.priceJod)} د.أ</span>
          </div>

          {showForm && (
            <>
              <div className="cliq-box">
                <div style={{ fontSize: 13, color: "#cdd8e6" }}>حوّل عن طريق CliQ إلى</div>
                <div className="alias">{CLIQ_ALIAS}</div>
                <div className="amount">
                  {CLIQ_BANK_NAME} — المبلغ: {Number(booking.subject.priceJod)} د.أ
                </div>
              </div>

              <ol className="steps">
                <li>افتح تطبيق بنكك واختار خدمة CliQ / التحويل الفوري.</li>
                <li>حوّل المبلغ بالضبط لاسم المستخدم (Alias) الموضح فوق.</li>
                <li>خذ رقم العملية (Reference Number) من إشعار البنك بعد التحويل.</li>
                <li>عبّي النموذج تحت وارسله — راح نأكد الحجز خلال وقت قصير.</li>
              </ol>

              {error && <div className="form-error">{error}</div>}

              <form onSubmit={submitProof}>
                <div className="form-field">
                  <label>رقم العملية (Reference Number) *</label>
                  <input required value={cliqReference} onChange={(e) => setCliqReference(e.target.value)} />
                </div>
                <div className="form-field">
                  <label>الاسم اللي ظهر بالتحويل (اختياري)</label>
                  <input value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                </div>
                <div className="form-field">
                  <label>ملاحظة إضافية (اختياري)</label>
                  <textarea value={proofNote} onChange={(e) => setProofNote(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-gold btn-block" disabled={submitting}>
                  {submitting ? "جاري الإرسال..." : "أرسل إثبات الدفع"}
                </button>
              </form>
            </>
          )}

          {awaitingOrDone && (
            <div style={{ marginTop: 20, textAlign: "center" }}>
              {(submitted || booking.status === "AWAITING_CONFIRMATION") && (
                <>
                  <span className="badge badge-awaiting">بانتظار تأكيد الإدارة</span>
                  <p style={{ marginTop: 10, color: "var(--muted)", fontSize: 14 }}>
                    استلمنا إثبات الدفع وراح نأكد حجزك خلال وقت قصير. تقدر تتابع حالة الحجز من صفحة{" "}
                    <a href="/dashboard" style={{ color: "var(--navy)", fontWeight: 700 }}>
                      حجوزاتي
                    </a>
                    .
                  </p>
                </>
              )}
              {booking.status === "CONFIRMED" && <span className="badge badge-confirmed">تم تأكيد الحجز ✓</span>}
              {booking.status === "REJECTED" && <span className="badge badge-rejected">تم رفض إثبات الدفع</span>}
              {booking.status === "CANCELLED" && <span className="badge badge-cancelled">الحجز ملغي</span>}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
