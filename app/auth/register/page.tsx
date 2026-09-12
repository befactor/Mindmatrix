"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";

const ERROR_MESSAGES: Record<string, string> = {
  weakPasswordError: "كلمة المرور لازم تكون 8 أحرف على الأقل",
  emailTakenError: "في حساب مسجل بهاد البريد الإلكتروني من قبل",
  genericError: "صار في خطأ، حاول مرة ثانية",
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(ERROR_MESSAGES[data.error] || ERROR_MESSAGES.genericError);
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      router.push("/auth/signin");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <Nav />
      <div className="narrow">
        <div className="form-card">
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, textAlign: "center" }}>إنشاء حساب</h1>
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label>الاسم</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-field">
              <label>البريد الإلكتروني</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-field">
              <label>رقم الموبايل (واتساب)</label>
              <input
                type="tel"
                placeholder="07XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>كلمة المرور</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="hint">8 أحرف على الأقل</div>
            </div>
            <button type="submit" className="btn btn-navy btn-block" disabled={loading}>
              {loading ? "جاري الإنشاء..." : "إنشاء الحساب"}
            </button>
          </form>
          <p className="form-foot">
            عندك حساب؟ <Link href="/auth/signin">سجل دخولك</Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
