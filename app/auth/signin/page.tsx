"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="narrow">
      <div className="form-card">
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, textAlign: "center" }}>تسجيل الدخول</h1>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>البريد الإلكتروني</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-field">
            <label>كلمة المرور</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-navy btn-block" disabled={loading}>
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
        <p className="form-foot">
          ما عندك حساب؟ <Link href="/auth/register">سجل من هون</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <>
      <Nav />
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
      <Footer />
    </>
  );
}
