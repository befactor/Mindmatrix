"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";

type Subject = {
  id: string;
  name: string;
  track: string;
  priceJod: string;
};

type Slot = {
  id: string;
  startsAt: string;
  endsAt: string;
};

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

export default function SlotPickerPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/subjects/${slug}/slots`);
      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setSubject(data.subject);
      setSlots(data.slots);
      if (data.slots.length > 0) setSelectedDay(dayKey(data.slots[0].startsAt));
      setLoading(false);
    }
    load();
  }, [slug]);

  const days = useMemo(() => {
    const seen = new Map<string, Date>();
    for (const s of slots) {
      const key = dayKey(s.startsAt);
      if (!seen.has(key)) seen.set(key, new Date(s.startsAt));
    }
    return Array.from(seen.entries());
  }, [slots]);

  const slotsForDay = slots.filter((s) => selectedDay && dayKey(s.startsAt) === selectedDay);

  async function confirmBooking() {
    if (!selectedSlot) return;
    if (status !== "authenticated") {
      router.push(`/auth/signin?callbackUrl=/booking/${slug}`);
      return;
    }
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId: selectedSlot.id }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      if (data.error === "slotTaken") {
        setError("للأسف هاد الموعد انحجز قبلك بلحظات، اختر موعد ثاني.");
        setSlots((prev) => prev.filter((s) => s.id !== selectedSlot.id));
        setSelectedSlot(null);
      } else {
        setError("صار في خطأ، حاول مرة ثانية");
      }
      return;
    }
    router.push(`/bookings/${data.bookingId}/pay`);
  }

  if (loading) {
    return (
      <>
        <Nav />
        <div className="loading-box">
          <div className="spin" />
          جاري تحميل المواعيد...
        </div>
        <Footer />
      </>
    );
  }

  if (notFound || !subject) {
    return (
      <>
        <Nav />
        <div className="empty-state">المادة غير موجودة.</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="container" style={{ padding: "40px 20px 100px" }}>
        <div className="page-head">
          <div>
            <h1>{subject.name}</h1>
            <p style={{ color: "var(--muted)", marginTop: 4 }}>{Number(subject.priceJod)} د.أ / جلسة</p>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        {slots.length === 0 ? (
          <div className="empty-state">ما في مواعيد متاحة حالياً لهاي المادة — تواصل معنا على واتساب.</div>
        ) : (
          <>
            <div className="day-tabs">
              {days.map(([key, date]) => (
                <button
                  key={key}
                  className={`day-tab ${key === selectedDay ? "active" : ""}`}
                  onClick={() => {
                    setSelectedDay(key);
                    setSelectedSlot(null);
                  }}
                >
                  <span className="dow">{date.toLocaleDateString("ar", { weekday: "short" })}</span>
                  {date.toLocaleDateString("ar", { day: "numeric", month: "short" })}
                </button>
              ))}
            </div>

            <div className="slot-list">
              {slotsForDay.map((s) => (
                <div
                  key={s.id}
                  className={`slot-item ${selectedSlot?.id === s.id ? "selected" : ""}`}
                  onClick={() => setSelectedSlot(s)}
                >
                  <span className="time">
                    {new Date(s.startsAt).toLocaleTimeString("ar", { hour: "numeric", minute: "2-digit" })} -{" "}
                    {new Date(s.endsAt).toLocaleTimeString("ar", { hour: "numeric", minute: "2-digit" })}
                  </span>
                  {selectedSlot?.id === s.id && <span style={{ color: "var(--gold)", fontWeight: 700 }}>✓</span>}
                </div>
              ))}
            </div>

            <button
              className="btn btn-gold btn-block"
              style={{ marginTop: 24 }}
              disabled={!selectedSlot || submitting}
              onClick={confirmBooking}
            >
              {submitting ? "جاري الحجز..." : "احجز هاد الموعد"}
            </button>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
