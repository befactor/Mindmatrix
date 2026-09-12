"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";

type Booking = {
  id: string;
  status: string;
  subject: { name: string };
  slot: { startsAt: string; endsAt: string };
};

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  PENDING_PAYMENT: { text: "بانتظار الدفع", cls: "badge-pending" },
  AWAITING_CONFIRMATION: { text: "بانتظار تأكيد الإدارة", cls: "badge-awaiting" },
  CONFIRMED: { text: "مؤكد", cls: "badge-confirmed" },
  REJECTED: { text: "مرفوض", cls: "badge-rejected" },
  CANCELLED: { text: "ملغي", cls: "badge-cancelled" },
};

export default function DashboardPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/dashboard");
      return;
    }
    if (authStatus !== "authenticated") return;

    fetch("/api/bookings")
      .then((r) => r.json())
      .then((data) => {
        setBookings(data);
        setLoading(false);
      });
  }, [authStatus, router]);

  if (authStatus === "loading" || loading) {
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
          <h1>حجوزاتي</h1>
          <Link href="/booking" className="btn btn-navy btn-sm">
            حجز جديد
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="empty-state">لسا ما عندك حجوزات.</div>
        ) : (
          <div className="booking-list">
            {bookings.map((b) => {
              const label = STATUS_LABEL[b.status] || { text: b.status, cls: "" };
              return (
                <div className="booking-row" key={b.id}>
                  <div>
                    <div className="subject-name">{b.subject.name}</div>
                    <div className="meta">
                      {new Date(b.slot.startsAt).toLocaleString("ar", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className={`badge ${label.cls}`}>{label.text}</span>
                    {b.status === "PENDING_PAYMENT" && (
                      <Link href={`/bookings/${b.id}/pay`} className="btn btn-gold btn-sm">
                        إكمال الدفع
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
