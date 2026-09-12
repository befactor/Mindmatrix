"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";
import { useContentProtection, Watermark, ProtectionCurtain } from "@/app/components/ContentProtection";

type VideoContent = {
  id: string;
  type: "VIDEO";
  title: string;
  videoUrl: string;
  subjectName: string;
  watermark: { name: string; email: string };
};

export default function VideoViewerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status: authStatus } = useSession();
  const { hidden } = useContentProtection();

  const [item, setItem] = useState<VideoContent | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/learn/video/${id}`);
      return;
    }
    if (authStatus !== "authenticated") return;

    fetch(`/api/content/${id}`).then(async (res) => {
      if (!res.ok) {
        setError(res.status === 403 ? "ما عندك صلاحية توصل لهاد المحتوى بعد." : "المحتوى غير موجود.");
        return;
      }
      setItem(await res.json());
    });
  }, [id, authStatus, router]);

  if (error) {
    return (
      <>
        <Nav />
        <div className="empty-state">{error}</div>
        <Footer />
      </>
    );
  }

  if (!item) {
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
      <ProtectionCurtain hidden={hidden} />
      <div className="narrow">
        <div className="page-head">
          <div>
            <h1 style={{ fontSize: 19 }}>{item.title}</h1>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>{item.subjectName}</p>
          </div>
        </div>
        <div className="viewer-shell">
          <video
            src={item.videoUrl}
            controls
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
          />
          <Watermark name={item.watermark.name} email={item.watermark.email} />
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12, textAlign: "center" }}>
          هاد المحتوى معلّم باسمك — أي مشاركة أو تسريب بينرجع إلك.
        </p>
      </div>
      <Footer />
    </>
  );
}
