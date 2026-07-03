import Link from "next/link";

const GROUPS = [
  {
    title: "Protocol",
    links: [
      { label: "Overview", href: "/protocol" },
      { label: "Identity Layer", href: "/protocol/identity-layer" },
      { label: "Motion Pipeline", href: "/protocol/motion-pipeline" },
      { label: "Whitepaper", href: "/whitepaper" },
      { label: "Roadmap", href: "/roadmap" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Docs", href: "/docs" },
      { label: "Compare", href: "/compare" },
      { label: "Glossary", href: "/glossary" },
      { label: "Papers", href: "/papers" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "GitHub", href: "https://github.com/myshapeprotocol" },
      { label: "X", href: "https://x.com/myshapeprotocol" },
      { label: "Discord", href: "https://discord.gg/zr8Tczard" },
      { label: "LinkedIn", href: "https://www.linkedin.com/company/111557251/" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export default function ProtocolFooter() {
  return (
    <footer className="relative z-10 w-full bg-transparent font-mono">
      {/* Desktop: 3-column nav */}
      <div className="hidden md:grid max-w-4xl mx-auto px-6 grid-cols-3 gap-8 py-16 border-t border-white/[0.04]">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <h4 className="text-white/25 text-[9px] tracking-[0.3em] uppercase mb-5">{g.title}</h4>
            <div className="space-y-2.5">
              {g.links.map((l) =>
                l.href.startsWith("http") ? (
                  <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="block text-white/20 text-[9px] tracking-[0.08em] hover:text-white/45 transition-colors">
                    {l.label}
                  </a>
                ) : (
                  <Link key={l.label} href={l.href} className="block text-white/20 text-[9px] tracking-[0.08em] hover:text-white/45 transition-colors">
                    {l.label}
                  </Link>
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Copyright — both mobile and desktop */}
      <div className="border-t border-white/[0.04] py-6 text-center">
        <span className="text-white/10 text-[8px] tracking-[0.2em] uppercase">
          &copy; {new Date().getFullYear()} MyShape Protocol
        </span>
      </div>
    </footer>
  );
}
