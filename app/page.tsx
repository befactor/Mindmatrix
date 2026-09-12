import Image from "next/image";
import Link from "next/link";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import { prisma } from "@/lib/prisma";
import { ExamIcon, CaseStudyIcon, CheatSheetIcon, ClockIcon, CalendarIcon, ShieldCheckIcon, ChatIcon } from "./components/icons";
import { TRACK_STYLES } from "@/lib/trackStyles";

// Subjects/availability change often and this hits the DB directly (not
// `fetch`), so opt out of static generation at build time — otherwise
// `next build` would try to query a database that isn't reachable at build.
export const dynamic = "force-dynamic";

const HIGHLIGHTS = [
  {
    icon: <ExamIcon />,
    title: "Exam Breakdown",
    body: "شرح مفصل لنموذج الإجابات، كلمات الأسئلة (command words)، وأكتر الأخطاء الشائعة بأسئلة المقال.",
  },
  {
    icon: <CaseStudyIcon />,
    title: "Real-World Case Studies",
    body: "ربط أحداث السوق الحالية بمفاهيم المنهاج: المرونة، السياسة المالية، سلاسل التوريد.",
  },
  {
    icon: <CheatSheetIcon />,
    title: "Formula & Concept Cheat Sheets",
    body: "أوراق مرجعية سريعة للرسومات البيانية والنسب المالية وشرح الدايجرامات.",
  },
  {
    icon: <ClockIcon />,
    title: "Study Hacks & Time Management",
    body: "استراتيجيات لتوزيع الوقت على أسئلة الاختيار من متعدد والأسئلة الإنشائية.",
  },
];

export default async function HomePage() {
  const subjects = await prisma.subject.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  const trackCount = new Set(subjects.map((s) => s.track)).size;

  return (
    <>
      <Nav />

      <section className="hero">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-inner hero-grid">
          <div>
            <span className="eyebrow">AP • IB • IGCSE • BTEC • EST • SAT</span>
            <h1>
              Unlocking Advanced <span>Economics &amp; Business</span> Concepts
            </h1>
            <p>
              تدريس متخصص بمواد الأعمال والاقتصاد لمناهج AP وIB وIGCSE وBTEC وEST، بالإضافة لتحضير
              SAT — نحوّل النظريات المعقدة لاستراتيجيات واضحة توصلك لأعلى العلامات.
            </p>
            <div className="hero-ctas">
              <Link href="/booking" className="btn btn-gold">
                احجز جلسة تجريبية
              </Link>
              <a href="https://wa.me/962799570000" target="_blank" rel="noreferrer" className="btn btn-outline">
                تواصل واتساب
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-logo-ring">
              <Image src="/logo.jpg" alt="MindMatrix Academy" width={220} height={220} priority />
            </div>
            <div className="hero-float-card">
              <CalendarIcon />
              <div>
                <strong>{trackCount || 6} مناهج دراسية</strong>
                <div className="hero-float-sub">جلسات فردية 1:1 حسب جدولك</div>
              </div>
            </div>
            <div className="hero-float-card hero-float-card-2">
              <ShieldCheckIcon />
              <div>
                <strong>دفع موثّق عبر CliQ</strong>
                <div className="hero-float-sub">تأكيد الحجز خلال وقت قصير</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="about">
        <div className="container">
          <div className="section-head">
            <div className="kicker">عن المركز</div>
            <h2>MindMatrix Academy</h2>
            <p>
              مرافقة تعليمية عالية المستوى لطلاب AP وIB وIGCSE وBTEC وEST وSAT بمواد الأعمال
              والاقتصاد — بنحوّل النظرية المعقدة لعلامات متفوقة بالامتحان.
            </p>
          </div>
          <div className="grid grid-2">
            {HIGHLIGHTS.map((h) => (
              <div className="card highlight-card" key={h.title}>
                <div className="highlight-icon">{h.icon}</div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--navy-deep)" }}>
                    {h.title}
                  </h3>
                  <p style={{ color: "var(--muted)", fontSize: 14 }}>{h.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt" id="subjects">
        <div className="container">
          <div className="section-head">
            <div className="kicker">المواد</div>
            <h2>اختار مادتك واحجز موعدك</h2>
            <p>كل الحجوزات بتنعمل أونلاين، والدفع عن طريق CliQ بعد ما تثبّت موعدك.</p>
          </div>
          {subjects.length === 0 ? (
            <div className="empty-state">لسا ما في مواد مضافة — شغّل seed script.</div>
          ) : (
            <div className="grid grid-3">
              {subjects.map((s) => {
                const track = TRACK_STYLES[s.track];
                return (
                  <div className="card subject-card" key={s.id}>
                    <span className="track-tag" style={{ background: track.bg, color: track.fg }}>
                      {track.label}
                    </span>
                    <h3>{s.name}</h3>
                    <p>{s.description}</p>
                    <div className="row">
                      <span className="price">{Number(s.priceJod)} د.أ / جلسة</span>
                      <Link href={`/booking/${s.slug}`} className="btn btn-navy btn-sm">
                        احجز
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ textAlign: "center" }}>
          <div className="section-head">
            <div className="kicker">جاهز تبدأ؟</div>
            <h2>احجز استشارة مجانية اليوم</h2>
            <p>راسلنا على واتساب أو احجز موعدك مباشرة من الموقع.</p>
          </div>
          <div className="hero-ctas">
            <Link href="/booking" className="btn btn-navy">
              احجز موعد
            </Link>
            <a
              href="https://wa.me/962799570000"
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
              style={{ color: "var(--navy)", borderColor: "var(--navy)" }}
            >
              <ChatIcon /> واتساب: 0799570000
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
