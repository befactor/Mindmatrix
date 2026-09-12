// One-time seed for the subject catalog. Prices are placeholders (JOD per
// session) — edit them here (or via `npm run db:studio`) to match real
// pricing, then re-run `npm run db:seed`.
import { PrismaClient, Track } from "@prisma/client";

const prisma = new PrismaClient();

const subjects: {
  track: Track;
  name: string;
  slug: string;
  description: string;
  priceJod: number;
  sortOrder: number;
}[] = [
  {
    track: "IB",
    name: "IB Business Management (SL/HL)",
    slug: "ib-business-management",
    description: "Full IB Business Management syllabus, SL and HL, with IA and case-study exam prep.",
    priceJod: 15,
    sortOrder: 1,
  },
  {
    track: "SAT",
    name: "SAT Preparation (Math & Reading/Writing)",
    slug: "sat-preparation",
    description: "Digital SAT prep: math, evidence-based reading & writing, pacing and full-length practice review.",
    priceJod: 15,
    sortOrder: 2,
  },
  {
    track: "AP",
    name: "AP Microeconomics",
    slug: "ap-microeconomics",
    description: "AP Microeconomics: supply & demand, elasticity, market structures, exam-style FRQ practice.",
    priceJod: 15,
    sortOrder: 3,
  },
  {
    track: "AP",
    name: "AP Macroeconomics",
    slug: "ap-macroeconomics",
    description: "AP Macroeconomics: fiscal & monetary policy, GDP, inflation, exam-style FRQ practice.",
    priceJod: 15,
    sortOrder: 4,
  },
  {
    track: "AP",
    name: "AP Business",
    slug: "ap-business",
    description: "AP-level business concepts and case-study analysis.",
    priceJod: 15,
    sortOrder: 5,
  },
  {
    track: "IGCSE",
    name: "IGCSE Business Studies",
    slug: "igcse-business-studies",
    description: "IGCSE Business Studies syllabus coverage with past-paper practice and mark-scheme walkthroughs.",
    priceJod: 12,
    sortOrder: 6,
  },
  {
    track: "BTEC",
    name: "BTEC International Level 3 Business",
    slug: "btec-business",
    description: "Pearson BTEC International Level 3 Business coursework and assignment support.",
    priceJod: 12,
    sortOrder: 7,
  },
  {
    track: "EST",
    name: "EST Business",
    slug: "est-business",
    description: "Egyptian Scholastic Test — Business section prep.",
    priceJod: 12,
    sortOrder: 8,
  },
  {
    track: "EST",
    name: "EST Economics",
    slug: "est-economics",
    description: "Egyptian Scholastic Test — Economics section prep.",
    priceJod: 12,
    sortOrder: 9,
  },
];

async function main() {
  for (const s of subjects) {
    await prisma.subject.upsert({
      where: { slug: s.slug },
      update: {
        track: s.track,
        name: s.name,
        description: s.description,
        priceJod: s.priceJod,
        sortOrder: s.sortOrder,
      },
      create: s,
    });
  }
  console.log(`Seeded ${subjects.length} subjects.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
