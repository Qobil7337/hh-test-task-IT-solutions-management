import Link from "next/link";

const TECH_STACK = [
  "Node.js",
  "TypeScript",
  "NestJS",
  "GraphQL",
  "Prisma",
  "PostgreSQL",
  "Docker",
  "Git",
  "Jest",
  "Next.js",
];

const LINKS = [
  { label: "GitHub", href: "https://github.com/Qobil7337" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/qobil-ashurov/" },
];

export default function HomePage() {
  return (
    <section className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-700">
          Backend Developer
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Kobil</h1>

        <p className="mt-6 leading-relaxed text-zinc-600">
          I build production-oriented backend systems with TypeScript and
          Node.js. My focus is on clean API design with NestJS and GraphQL,
          careful data modelling with Prisma and PostgreSQL, transactional
          correctness under concurrency, and thorough automated tests.
          CharityHub, the platform behind this site, is a sample project built
          as a technical test — its campaigns and donations below are served
          live by the API.
        </p>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Technology stack
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {TECH_STACK.map((tech) => (
            <li
              key={tech}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-700"
            >
              {tech}
            </li>
          ))}
        </ul>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Links
        </h2>
        <ul className="mt-3 flex flex-wrap gap-4 text-sm">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-900"
              >
                {link.label} ↗
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700"
          >
            View CharityHub campaigns
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
