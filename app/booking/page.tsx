import Link from "next/link";
import Nav from "@/app/components/Nav";
import Footer from "@/app/components/Footer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BookingSubjectPicker() {
  const subjects = await prisma.subject.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <Nav />
      <div className="container" style={{ padding: "40px 20px 80px" }}>
        <div className="page-head">
          <h1>اختار المادة</h1>
        </div>
        <div className="grid grid-3">
          {subjects.map((s) => (
            <Link href={`/booking/${s.slug}`} key={s.id} className="card subject-card">
              <span className="track-tag">{s.track}</span>
              <h3>{s.name}</h3>
              <p>{s.description}</p>
              <div className="row">
                <span className="price">{Number(s.priceJod)} د.أ / جلسة</span>
                <span className="btn btn-navy btn-sm">اختر المواعيد</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
