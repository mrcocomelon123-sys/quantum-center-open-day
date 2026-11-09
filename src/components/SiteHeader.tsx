import { Link } from "@tanstack/react-router";
import logoImg from "@/assets/logo.png";

const NAV = [
  { to: "/", label: "Welcome" },
  { to: "/projects", label: "Projects" },
  { to: "/submit-project", label: "Submit Project" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-nav/95 text-nav-foreground backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-3">
        <Link
          to="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <img
            src={logoImg}
            alt="Helen Diller Quantum Center Symbol"
            className="h-7 sm:h-8 w-auto object-contain select-none"
          />
          <span className="text-base sm:text-lg font-bold tracking-tight text-white">
            Helen Diller Quantum Center
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-6 sm:gap-8">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="pb-1 text-base sm:text-lg font-bold text-white/80 transition-all hover:text-cyan-400 hover:scale-105"
              activeProps={{
                className: "border-b-2 border-cyan-400 text-cyan-400 font-extrabold",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
