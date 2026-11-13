import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, type FormEvent } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  submitPendingProjectAsync,
  compressImageFile,
  normalizeExternalUrl,
} from "@/lib/projects-store";
import {
  Send,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  UserCheck,
  FileText,
  Info,
  ArrowRight,
  RotateCcw,
  Link2,
} from "lucide-react";

export const Route = createFileRoute("/submit-project")({
  head: () => ({
    meta: [
      { title: "Submit a Project — Helen Diller Quantum Center | Technion" },
      {
        name: "description",
        content:
          "Submit a research project proposal for the Helen Diller Quantum Center Open Day.",
      },
    ],
  }),
  component: SubmitProjectPage,
});

function SubmitProjectPage() {
  const [title, setTitle] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WEBP)");
      return;
    }

    try {
      const compressed = await compressImageFile(file);
      setImagePreview(compressed);
      setImageUrlInput("");
    } catch {
      alert("Failed to process image file.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !supervisor.trim() || !description.trim()) {
      alert("Please fill in the Title, Supervisor, and Description fields.");
      return;
    }

    setIsSubmitting(true);
    const finalImage = imagePreview || imageUrlInput.trim();

    try {
      await submitPendingProjectAsync({
        title: title.trim(),
        supervisor: supervisor.trim(),
        description: description.trim(),
        linkUrl: normalizeExternalUrl(linkUrl),
        imageUrl: finalImage || undefined,
      });

      setSubmittedSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTitle("");
    setSupervisor("");
    setDescription("");
    setLinkUrl("");
    setImagePreview("");
    setImageUrlInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSubmittedSuccess(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#02060d] text-slate-100 selection:bg-cyan-500/30">
      <SiteHeader />

      <main className="flex-1 pb-20">
        {/* Header Banner */}
        <section className="border-b border-white/10 bg-gradient-to-b from-slate-900/90 to-[#02060d] py-10 sm:py-12">
          <div className="mx-auto max-w-6xl px-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Technion · Helen Diller Quantum Center</span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Submit a Research Project
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base text-slate-400">
              Fill in your project details below to submit it for the Open Day. Once approved by the administrator, your project will immediately appear under Available Projects.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-5 pt-8">
          {submittedSuccess ? (
            /* Confirmation Message After Submitting */
            <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-8 sm:p-10 text-center shadow-2xl backdrop-blur-md">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/40">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h2 className="mt-5 text-2xl font-extrabold text-white">
                Project Submitted for Approval!
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
                Your project has been sent to the Admin Panel for review. As soon as the administrator approves it, it will automatically be published in{" "}
                <strong className="text-cyan-400">Available Projects</strong>.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4 text-cyan-400" />
                  <span>Submit Another Project</span>
                </button>
                <Link
                  to="/projects"
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/30 transition-colors"
                >
                  <span>Go to Available Projects</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            /* Side-by-Side Layout: Submission Form + Example Template Card */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Submission Form (7 cols) */}
              <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-2.5 border-b border-white/10 pb-4 mb-6">
                  <FileText className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    Project Details Form
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                      Title <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Title here..."
                      className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      required
                    />
                  </div>

                  {/* Supervisor */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                      Supervisor (who made it + mail) <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={supervisor}
                      onChange={(e) => setSupervisor(e.target.value)}
                      placeholder="Supervisor: Name + email (e.g. Prof. David Gelbwaser - dgelbi@technion.ac.il)"
                      className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                      Description <span className="text-cyan-400">*</span>
                    </label>
                    <textarea
                      rows={6}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Description of the research project, goals, methods, and optional prerequisites or references..."
                      className="w-full rounded-xl border border-white/15 bg-black/50 p-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed"
                      required
                    />
                  </div>

                  {/* Link (Optional) */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                      Link (Lab Website / Paper / arXiv — Optional)
                    </label>
                    <div className="relative">
                      <Link2 className="absolute inset-y-0 start-0 flex items-center ps-3.5 h-full w-4 text-cyan-400 pointer-events-none" />
                      <input
                        type="text"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://arxiv.org/abs/... or https://lab.technion.ac.il"
                        className="w-full rounded-xl border border-white/15 bg-black/50 ps-10 pe-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Image Upload / URL */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                      Image (Graph / Diagram / Figure)
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-black/30 p-4 hover:border-cyan-500/50 transition-colors">
                        <Upload className="h-7 w-7 text-cyan-400 mb-1.5" />
                        <span className="text-xs font-semibold text-slate-200">
                          Upload Image File
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5">
                          PNG, JPG, WEBP
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="mt-2.5 w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 file:cursor-pointer"
                        />
                      </div>

                      <div className="flex flex-col justify-center rounded-xl border border-white/15 bg-black/30 p-4">
                        <span className="text-xs font-semibold text-slate-200 mb-1">
                          Or paste an Image URL:
                        </span>
                        <input
                          type="url"
                          value={imageUrlInput}
                          onChange={(e) => {
                            setImageUrlInput(e.target.value);
                            if (e.target.value) setImagePreview(e.target.value);
                          }}
                          placeholder="https://example.com/figure.png"
                          className="mt-2 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold py-3 px-7 shadow-lg shadow-cyan-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                      <span>
                        {isSubmitting ? "Submitting..." : "Submit Project for Approval"}
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Example Guide Card (5 cols) */}
              <div className="lg:col-span-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/95 to-slate-950 p-6 shadow-2xl sticky top-24">
                <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-5">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">
                      Example — How It Looks
                    </span>
                  </div>
                  <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
                    Template Guide
                  </span>
                </div>

                {/* Example Document / Modal Preview Box */}
                <div className="rounded-xl border border-white/15 bg-black/60 p-5 space-y-4">
                  {/* 1. Title here */}
                  <div className="rounded-lg border border-dashed border-cyan-500/40 bg-cyan-500/5 p-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      1. Title
                    </span>
                    <div className="mt-1 text-base sm:text-lg font-extrabold text-white leading-snug">
                      {title.trim() || "Title here"}
                    </div>
                  </div>

                  {/* 2. Supervisor: who made it + mail */}
                  <div className="rounded-lg border border-dashed border-cyan-500/40 bg-cyan-500/5 p-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      2. Supervisor
                    </span>
                    <div className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-cyan-300">
                      <UserCheck className="h-4 w-4 shrink-0 text-cyan-400" />
                      <span>
                        {supervisor.trim() || "Supervisor: who made it + mail"}
                      </span>
                    </div>
                  </div>

                  {/* 3. Description */}
                  <div className="rounded-lg border border-dashed border-cyan-500/40 bg-cyan-500/5 p-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      3. Description
                    </span>
                    <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line line-clamp-5">
                      {description.trim() ||
                        "Description — Write the project abstract, research goals, methods, and what the student will investigate during the project."}
                    </p>
                  </div>

                  {/* 4. Link */}
                  <div className="rounded-lg border border-dashed border-cyan-500/40 bg-cyan-500/5 p-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      4. Link (Optional)
                    </span>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-cyan-300 truncate">
                      <Link2 className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                      <span className="truncate">
                        {linkUrl.trim() || "https://arxiv.org/... or lab website link"}
                      </span>
                    </div>
                  </div>

                  {/* 5. Image */}
                  <div className="rounded-lg border border-dashed border-cyan-500/40 bg-cyan-500/5 p-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-2">
                      5. Image
                    </span>
                    {imagePreview ? (
                      <div className="rounded-lg bg-white p-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-44 w-auto mx-auto rounded object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-slate-900/90 py-8 px-4 text-center">
                        <ImageIcon className="h-8 w-8 text-cyan-400/80 mb-2" />
                        <span className="text-sm font-bold text-white">
                          Image
                        </span>
                        <span className="text-xs text-slate-400 mt-0.5">
                          Scientific graph, experimental setup, or figure
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-400 text-center leading-relaxed">
                  After clicking <strong className="text-slate-200">Submit Project for Approval</strong>, the administrator will review and approve your project in the Admin Panel.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
