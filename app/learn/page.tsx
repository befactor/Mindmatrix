"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";

type ContentItem = { id: string; type: "VIDEO" | "PDF"; title: string };
type SubjectWithContent = { id: string; name: string; contentItems: ContentItem[] };

export default function LearnPage() {
  const { status } = useSession();
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectWithContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/learn");
      return;
    }
    if (status !== "authenticated") return;
    fetch("/api/content")
      .then((r) => r.json())
      .then((data) => {
        setSubjects(data);
        setLoading(false);
      });
  }, [status, router]);

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
          <h1>موادي</h1>
        </div>

        {subjects.length === 0 ? (
          <div className="empty-state">
            محتوى المواد بينفتح بعد ما نأكد أول حجز مدفوع إلك بهاي المادة.
          </div>
        ) : (
          subjects.map((s) => (
            <div key={s.id} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12, color: "var(--navy-deep)" }}>
                {s.name}
              </h2>
              {s.contentItems.length === 0 ? (
                <div className="empty-state" style={{ padding: 20 }}>
                  لسا ما في محتوى مرفوع لهاي المادة.
                </div>
              ) : (
                <div className="content-list">
                  {s.contentItems.map((c) => (
                    <Link
                      key={c.id}
                      href={c.type === "VIDEO" ? `/learn/video/${c.id}` : `/learn/pdf/${c.id}`}
                      className="content-row"
                    >
                      <div>
                        <div className="kind">{c.type === "VIDEO" ? "فيديو" : "ملف"}</div>
                        <div style={{ fontWeight: 700 }}>{c.title}</div>
                      </div>
                      <span style={{ color: "var(--navy)" }}>عرض ›</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <Footer />
    </>
  );
}
