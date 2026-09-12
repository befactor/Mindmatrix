"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";

const ERROR_MESSAGES: Record<string, string> = {
  weakPassword: "كلمة المرور الجديدة لازم تكون 8 أحرف على الأقل",
  wrongPassword: "كلمة المرور الحالية غلط",
};

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/account");
    }
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("كلمة المرور الجديدة وتأكيدها مش متطابقين");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(ERROR_MESSAGES[data.error] || "صار في خطأ، حاول مرة ثانية");
      return;
    }
    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  if (status === "loading" || status === "unauthenticated") {
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
      <div className="narrow">
        <div className="form-card">
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>إعدادات الحساب</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>{session?.user.email}</p>

          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>تغيير كلمة المرور</h2>
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">تم تغيير كلمة المرور بنجاح</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label>كلمة المرور الحالية</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>كلمة المرور الجديدة</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <div className="hint">8 أحرف على الأقل</div>
            </div>
            <div className="form-field">
              <label>تأكيد كلمة المرور الجديدة</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-navy btn-block" disabled={submitting}>
              {submitting ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
