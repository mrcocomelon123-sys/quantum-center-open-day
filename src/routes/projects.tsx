import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getProjects, fetchServerProjects, type Project } from "@/lib/projects-store";
import {
  Search,
  UserCheck,
  BookOpen,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ArrowUpRight,
  FileText,
  GraduationCap,
  Library,
} from "lucide-react";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Research Projects — Helen Diller Quantum Center | Technion" },
      {
        name: "description",
        content:
          "Undergraduate, MSc and PhD research projects and opportunities at the Helen Diller Quantum Center, Technion.",
      },
      { property: "og:title", content: "Research Projects — Helen Diller Quantum Center" },
      {
        property: "og:description",
        content:
          "Explore cutting-edge quantum research opportunities for undergraduate and graduate students at the Technion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<6 | 9>(6);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setProjects(getProjects());
      void fetchServerProjects().then((serverList) => {
        if (serverList) setProjects(serverList);
      });

      const handleUpdate = () => {
        setProjects(getProjects());
      };

      window.addEventListener("projects-updated", handleUpdate);
      window.addEventListener("storage", handleUpdate);

      let bc: BroadcastChannel | null = null;
      if ("BroadcastChannel" in window) {
        bc = new BroadcastChannel("quantum_projects_sync");
        bc.onmessage = () => {
          setProjects(getProjects());
        };
      }

      return () => {
        window.removeEventListener("projects-updated", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
        if (bc) bc.close();
      };
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedProject(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.supervisor.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.prerequisites && p.prerequisites.toLowerCase().includes(q)) ||
      (p.references && p.references.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedProjects = filteredProjects.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 180, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#02060d] text-slate-100 selection:bg-cyan-500/30">
      <SiteHeader />

      <main className="flex-1 pb-20">
        {/* Compact Hero Header */}
        <section className="border-b border-white/10 bg-gradient-to-b from-slate-900/90 to-[#02060d] py-10 sm:py-12">
          <div className="mx-auto max-w-6xl px-5">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Technion · Helen Diller Quantum Center</span>
                </div>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Research Projects
                </h1>
                <p className="mt-2 max-w-2xl text-sm sm:text-base text-slate-400">
                  Undergraduate projects, MSc and PhD research opportunities. Click on any project card below to read the full details, references, prerequisites, and figures.
                </p>
              </div>

              {/* Search Input */}
              <div className="w-full md:w-80">
                <div className="relative">
                  <Search className="absolute inset-y-0 start-0 flex items-center ps-3.5 h-full w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search projects or supervisors..."
                    className="w-full rounded-xl border border-white/15 bg-black/50 ps-10 pe-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Projects Square Grid Section */}
        <div className="mx-auto max-w-6xl px-5 pt-8">
          {/* Toolbar: Count & Page Size Toggle (6 or 9) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10 mb-7">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">
                Available Projects ({filteredProjects.length})
              </h2>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="ms-2 text-xs text-cyan-400 hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Per page:</span>
              <div className="inline-flex rounded-lg border border-white/15 bg-slate-900/80 p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setPageSize(6);
                    setCurrentPage(1);
                  }}
                  className={`rounded-md px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                    pageSize === 6
                      ? "bg-cyan-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  6 Cards
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPageSize(9);
                    setCurrentPage(1);
                  }}
                  className={`rounded-md px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                    pageSize === 9
                      ? "bg-cyan-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  9 Cards
                </button>
              </div>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-12 text-center text-slate-400">
              <BookOpen className="h-12 w-12 mx-auto text-slate-600 mb-3" />
              <p className="text-base font-semibold text-slate-300">
                No matching projects found.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Try another search term or check back soon.
              </p>
            </div>
          ) : (
            <>
              {/* Grid of Compact Square-like Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedProjects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => setSelectedProject(proj)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedProject(proj);
                      }
                    }}
                    className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/85 to-slate-950/95 p-5 h-64 shadow-lg backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-cyan-500/10 cursor-pointer overflow-hidden"
                  >
                    {/* Subtle top accent line */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500/60 via-blue-500/60 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

                    <div>
                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-bold text-white leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors">
                        {proj.title}
                      </h3>

                      {/* Supervisor / Person */}
                      {proj.supervisor && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-cyan-400 truncate">
                          <UserCheck className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                          <span className="truncate">{proj.supervisor}</span>
                        </div>
                      )}

                      {/* Short Preview of Description (Beginning only) */}
                      <p className="mt-3 text-xs sm:text-sm text-slate-300/85 line-clamp-3 leading-relaxed">
                        {proj.description}
                      </p>
                    </div>

                    {/* Card Bottom Bar */}
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                      <span className="inline-flex items-center gap-1 font-semibold text-cyan-400 group-hover:text-cyan-300">
                        <span>View full details</span>
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>

                      <div className="flex items-center gap-1.5">
                        {proj.imageUrl && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-slate-300 border border-white/10">
                            <ImageIcon className="h-3 w-3 text-cyan-400" />
                            <span>Figure</span>
                          </span>
                        )}
                        {proj.pdfUrl && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-300 border border-cyan-500/20">
                            <FileText className="h-3 w-3 text-cyan-400" />
                            <span>PDF</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(Math.max(1, safeCurrentPage - 1))}
                    disabled={safeCurrentPage === 1}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-1.5 px-1">
                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`h-9 w-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          pageNum === safeCurrentPage
                            ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 scale-105"
                            : "border border-white/10 bg-slate-900/60 text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePageChange(Math.min(totalPages, safeCurrentPage + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Full Project Details Modal when clicking a square card */}
      {selectedProject && (
        <div
          onClick={() => setSelectedProject(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-slate-950 shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-slate-900/90 px-6 py-4">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                  Research Project Details
                </span>
                <h3 className="mt-1 text-xl sm:text-2xl font-extrabold text-white leading-snug">
                  {selectedProject.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Top Info Bar: Supervisor & Optional PDF Link */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {selectedProject.supervisor && (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-cyan-950/70 border border-cyan-800/50 px-4 py-2 text-sm font-semibold text-cyan-300">
                    <UserCheck className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>{selectedProject.supervisor}</span>
                  </div>
                )}

                {selectedProject.pdfUrl && (
                  <a
                    href={selectedProject.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-2 text-xs sm:text-sm font-semibold text-cyan-300 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-cyan-400" />
                    <span>Open Original PDF</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              {/* Main Content Grid: Text + References on Left, Figure on Right (if image exists) */}
              <div
                className={
                  selectedProject.imageUrl
                    ? "grid grid-cols-1 md:grid-cols-12 gap-6 items-start"
                    : "space-y-6"
                }
              >
                <div
                  className={
                    selectedProject.imageUrl ? "md:col-span-7 space-y-5" : "space-y-5"
                  }
                >
                  {/* Full Description */}
                  <div className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-line">
                    {selectedProject.description}
                  </div>

                  {/* References Section */}
                  {selectedProject.references && (
                    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                        <Library className="h-4 w-4" />
                        <span>References</span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                        {selectedProject.references}
                      </div>
                    </div>
                  )}

                  {/* Prerequisites Section */}
                  {selectedProject.prerequisites && (
                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                        <GraduationCap className="h-4 w-4" />
                        <span>Prerequisites</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 italic leading-relaxed">
                        {selectedProject.prerequisites}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: Scientific Figure / Image */}
                {selectedProject.imageUrl && (
                  <div className="md:col-span-5 flex flex-col items-center">
                    <div className="w-full rounded-xl border border-white/20 bg-white p-3 shadow-xl">
                      <img
                        src={selectedProject.imageUrl}
                        alt={selectedProject.title}
                        className="mx-auto max-h-[520px] w-auto max-w-full rounded-lg object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t border-white/10 bg-slate-900/60 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="rounded-xl bg-cyan-600 hover:bg-cyan-500 px-5 py-2 text-xs sm:text-sm font-bold text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
