"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

export default function Nav() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-brand" onClick={() => setOpen(false)}>
          <Image src="/logo.jpg" alt="MindMatrix Academy" width={36} height={36} className="mark" priority />
          MindMatrix Academy
        </Link>
        <button className="nav-toggle" onClick={() => setOpen((v) => !v)} aria-label="القائمة">
          <span />
          <span />
          <span />
        </button>
        <div className={`nav-links ${open ? "open" : ""}`}>
          <Link href="/#subjects" onClick={() => setOpen(false)}>
            المواد
          </Link>
          <Link href="/#about" onClick={() => setOpen(false)}>
            عن المركز
          </Link>
          {session ? (
            <>
              {session.user.role === "ADMIN" && (
                <>
                  <Link href="/admin" onClick={() => setOpen(false)}>
                    لوحة الإدارة
                  </Link>
                  <Link href="/admin/content" onClick={() => setOpen(false)}>
                    المحتوى
                  </Link>
                </>
              )}
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                حجوزاتي
              </Link>
              <Link href="/learn" onClick={() => setOpen(false)}>
                موادي
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="nav-link-btn">
                تسجيل خروج
              </button>
            </>
          ) : (
            <Link href="/auth/signin" onClick={() => setOpen(false)}>
              تسجيل دخول
            </Link>
          )}
          <Link href="/booking" className="nav-cta" onClick={() => setOpen(false)}>
            احجز موعد
          </Link>
        </div>
      </div>
    </nav>
  );
}
