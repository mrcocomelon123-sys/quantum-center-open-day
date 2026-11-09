import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import logoImg from "@/assets/logo.png";
import {
  getProjects,
  getPendingProjects,
  fetchServerState,
  addProject,
  deleteProject,
  updateProject,
  saveProjects,
  clearAllProjects,
  approvePendingProject,
  rejectPendingProject,
  INITIAL_PROJECTS,
  type Project,
} from "@/lib/projects-store";
import {
  Lock,
  PlusCircle,
  Trash2,
  Edit2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  LogOut,
  ExternalLink,
  Download,
  Eye,
  EyeOff,
  X,
  FileText,
  Clock,
  Check,
  XCircle,
} from "lucide-react";

const ADMIN_PASSWORD = "quantum2026";
const AUTH_KEY = "quantum_admin_auth_token";

export const Route = createFileRoute("/secret-admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — Quantum Center Projects" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SecretAdminPage,
});

function SecretAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [description, setDescription] = useState("");
  const [references, setReferences] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const refreshAll = () => {
    setProjects(getProjects());
    setPendingProjects(getPendingProjects());
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(AUTH_KEY);
      if (stored === "authenticated") {
        setIsAuthenticated(true);
      }
      refreshAll();
      void fetchServerState().then((state) => {
        if (state) {
          setProjects(state.projects);
          setPendingProjects(state.pendingProjects);
        }
      });

      const handleUpdate = () => {
        refreshAll();
      };

      window.addEventListener("projects-updated", handleUpdate);
      window.addEventListener("storage", handleUpdate);

      let bc: BroadcastChannel | null = null;
      if ("BroadcastChannel" in window) {
        bc = new BroadcastChannel("quantum_projects_sync");
        bc.onmessage = () => {
          refreshAll();
        };
      }

      return () => {
        window.removeEventListener("projects-updated", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
        if (bc) bc.close();
      };
    }
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "authenticated");
      setIsAuthenticated(true);
      setErrorMsg("");
      refreshAll();
    } else {
      setErrorMsg("סיסמה שגויה. נסה שוב.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setPasswordInput("");
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("נא לבחור קובץ תמונה תקין");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageUrlInput("");
    };
    reader.readAsDataURL(file);
  };

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("נא לבחור קובץ PDF תקין");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPdfUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setTitle("");
    setSupervisor("");
    setDescription("");
    setReferences("");
    setPrerequisites("");
    setImagePreview("");
    setImageUrlInput("");
    setPdfUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const handleSaveProject = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("נא למלא לפחות כותרת ותיאור לפרויקט");
      return;
    }

    const finalImage = imagePreview || imageUrlInput.trim();

    if (editingId) {
      updateProject(editingId, {
        title: title.trim(),
        supervisor: supervisor.trim(),
        description: description.trim(),
        references: references.trim() || undefined,
        prerequisites: prerequisites.trim() || undefined,
        imageUrl: finalImage,
        pdfUrl: pdfUrl.trim() || undefined,
      });
      setStatusMsg("הפרויקט עודכן בהצלחה!");
      setEditingId(null);
    } else {
      addProject({
        title: title.trim(),
        supervisor: supervisor.trim(),
        description: description.trim(),
        references: references.trim() || undefined,
        prerequisites: prerequisites.trim() || undefined,
        imageUrl: finalImage,
        pdfUrl: pdfUrl.trim() || undefined,
      });
      setStatusMsg("הפרויקט נוסף בהצלחה למערכת!");
    }

    resetForm();
    refreshAll();

    setTimeout(() => setStatusMsg(""), 4000);
  };

  const handleApprovePending = (id: string) => {
    const approved = approvePendingProject(id);
    if (approved) {
      refreshAll();
      setStatusMsg(`הפרויקט "${approved.title}" אושר והועלה מיד ל-Available Projects!`);
      setTimeout(() => setStatusMsg(""), 4500);
    }
  };

  const handleRejectPending = (id: string, projTitle: string) => {
    if (confirm(`האם לדחות ולמחוק את בקשת הפרויקט "${projTitle}"?`)) {
      rejectPendingProject(id);
      refreshAll();
      setStatusMsg("בקשת הפרויקט נדחתה והוסרה.");
      setTimeout(() => setStatusMsg(""), 3500);
    }
  };

  const handleStartEdit = (proj: Project) => {
    setEditingId(proj.id);
    setTitle(proj.title);
    setSupervisor(proj.supervisor);
    setDescription(proj.description);
    setReferences(proj.references || "");
    setPrerequisites(proj.prerequisites || "");
    setImagePreview(proj.imageUrl || "");
    setImageUrlInput("");
    setPdfUrl(proj.pdfUrl || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handleDelete = (id: string, projTitle: string) => {
    if (confirm(`האם אתה בטוח שברצונך למחוק את הפרויקט "${projTitle}"?`)) {
      deleteProject(id);
      refreshAll();
    }
  };

  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projects, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `quantum-projects-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetDefaults = () => {
    if (confirm("האם לאפס את רשימת הפרויקטים ל-4 הפרויקטים האמיתיים ההתחלתיים?")) {
      saveProjects(INITIAL_PROJECTS);
      refreshAll();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#030712] text-slate-100 selection:bg-cyan-500/30">
      <SiteHeader />

      <main className="flex-1 py-10 px-4 sm:px-6 max-w-5xl mx-auto w-full" dir="rtl">
        {!isAuthenticated ? (
          /* Password Gateway Card */
          <div className="mx-auto mt-12 max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30">
                <Lock className="h-7 w-7" />
              </div>
              <img src={logoImg} alt="Logo" className="mt-4 h-9 w-auto object-contain" />
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">כניסת מנהל פרויקטים</h1>
              <p className="mt-2 text-sm text-slate-400">
                הכנס סיסמה כדי לאשר פרויקטים ממתינים או להעלות ולערוך פרויקטים באתר
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  סיסמת ניהול:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="הזן סיסמה..."
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 end-0 flex items-center pe-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400 text-center font-medium">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-4 shadow-lg shadow-cyan-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                התחבר למערכת
              </button>
            </form>

            <div className="mt-6 border-t border-white/10 pt-4 text-center">
              <span className="text-xs text-slate-500">
                סיסמת ברירת מחדל: <code className="text-cyan-400 font-mono" dir="ltr">quantum2026</code>
              </span>
            </div>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="space-y-8">
            {/* Admin Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                    <CheckCircle2 className="h-3.5 w-3.5" /> מחובר כמנהל
                  </span>
                  <span className="text-xs text-slate-400 font-mono" dir="ltr">Admin Panel</span>
                </div>
                <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
                  ניהול ואישור פרויקטי מחקר — Open Day
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/projects"
                  target="_blank"
                  className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                  <span>צפה ב-Available Projects</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>התנתק</span>
                </button>
              </div>
            </div>

            {statusMsg && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-400 flex items-center gap-2 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{statusMsg}</span>
              </div>
            )}

            {/* 1. PENDING SUBMISSIONS SECTION (Awaiting Admin Approval) */}
            <div className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-slate-900/80 p-6 sm:p-8 shadow-xl backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-6 w-6 text-amber-400" />
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                      <span>פרויקטים הממתינים לאישור מנהל</span>
                      <span className="inline-flex items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                        {pendingProjects.length}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      פרויקטים שהוגשו על ידי משתמשים בעמוד Submit Project. לחיצה על "אשר פרויקט" תעלה אותם מיד ל-Available Projects.
                    </p>
                  </div>
                </div>
              </div>

              {pendingProjects.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-black/30 py-8 px-4 text-center text-slate-400 text-sm">
                  אין כרגע בקשות פרויקטים הממתינות לאישור.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 rounded-xl border border-amber-500/30 bg-black/60 p-5 shadow-lg"
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-4 flex-1 min-w-0 w-full" dir="ltr">
                        {proj.imageUrl ? (
                          <img
                            src={proj.imageUrl}
                            alt={proj.title}
                            className="h-24 w-32 rounded-lg object-contain bg-white p-1.5 ring-1 ring-white/20 shrink-0"
                          />
                        ) : (
                          <div className="h-24 w-32 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                            <ImageIcon className="h-7 w-7" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="inline-block rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1">
                            Pending Review
                          </span>
                          <h3 className="font-bold text-white text-base sm:text-lg leading-snug">
                            {proj.title}
                          </h3>
                          {proj.supervisor && (
                            <p className="text-xs sm:text-sm font-semibold text-cyan-400 mt-1">
                              {proj.supervisor}
                            </p>
                          )}
                          <p className="text-xs sm:text-sm text-slate-300 mt-2 whitespace-pre-line leading-relaxed">
                            {proj.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => handleApprovePending(proj.id)}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 cursor-pointer"
                        >
                          <Check className="h-4 w-4" />
                          <span>אשר פרויקט</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectPending(proj.id, proj.title)}
                          className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/15 hover:bg-red-500/25 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-red-300 transition-colors cursor-pointer"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>לא מאשר (מחק)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. DIRECT ADMIN UPLOAD / EDIT FORM */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {editingId ? "עריכת פרויקט קיים" : "הוספת פרויקט ישירות על ידי מנהל"}
                  </h2>
                </div>
                {editingId && (
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" /> ביטול עריכה
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveProject} className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    כותרת הפרויקט (Title) <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    dir="ltr"
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
                    מנחה ופרטי קשר (Supervisor: who made it + mail)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={supervisor}
                    onChange={(e) => setSupervisor(e.target.value)}
                    placeholder="Supervisor: Name (email@technion.ac.il)"
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    תיאור הפרויקט (Description) <span className="text-cyan-400">*</span>
                  </label>
                  <textarea
                    rows={5}
                    dir="ltr"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Project description..."
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed"
                    required
                  />
                </div>

                {/* References & Prerequisites (Optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                      מקורות / מאמרים (References — אופציונלי)
                    </label>
                    <textarea
                      rows={3}
                      dir="ltr"
                      value={references}
                      onChange={(e) => setReferences(e.target.value)}
                      placeholder="• Reference 1..."
                      className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                      דרישות קדם (Prerequisites — אופציונלי)
                    </label>
                    <textarea
                      rows={3}
                      dir="ltr"
                      value={prerequisites}
                      onChange={(e) => setPrerequisites(e.target.value)}
                      placeholder="Basic programming skills and quantum mechanics..."
                      className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed"
                    />
                  </div>
                </div>

                {/* Image Upload Area */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    תמונה / גרף לפרויקט (Image) וקובץ PDF אופציונלי
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-black/30 p-4 hover:border-cyan-500/50 transition-colors">
                      <Upload className="h-7 w-7 text-cyan-400 mb-1.5" />
                      <span className="text-xs font-semibold text-slate-200">העלה תמונה מהמכשיר</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="mt-2.5 w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 file:cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col justify-center rounded-xl border border-white/15 bg-black/30 p-4">
                      <span className="text-xs font-semibold text-slate-200 mb-1">או קישור לתמונה (URL):</span>
                      <input
                        type="url"
                        dir="ltr"
                        value={imageUrlInput}
                        onChange={(e) => {
                          setImageUrlInput(e.target.value);
                          if (e.target.value) setImagePreview(e.target.value);
                        }}
                        placeholder="https://example.com/image.png"
                        className="mt-2 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-black/30 p-4 hover:border-cyan-500/50 transition-colors">
                      <FileText className="h-7 w-7 text-cyan-400 mb-1.5" />
                      <span className="text-xs font-semibold text-slate-200">צרף קובץ PDF (אופציונלי)</span>
                      <input
                        ref={pdfInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfFileChange}
                        className="mt-2.5 w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 file:cursor-pointer"
                      />
                    </div>
                  </div>

                  {imagePreview && (
                    <div className="mt-4 relative rounded-xl border border-white/10 bg-black/60 p-3 max-w-md">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs text-slate-300">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <ImageIcon className="h-4 w-4 text-cyan-400" /> תצוגה מקדימה של התמונה
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview("");
                            setImageUrlInput("");
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="text-red-400 hover:text-red-300 text-xs cursor-pointer"
                        >
                          הסר תמונה
                        </button>
                      </div>
                      <div className="rounded-lg bg-white p-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-60 w-auto rounded object-contain mx-auto"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-6 shadow-lg shadow-cyan-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="h-5 w-5" />
                    <span>{editingId ? "שמור שינויים בפרויקט" : "העלה פרויקט ישירות לאתר"}</span>
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-xl border border-white/20 bg-white/5 py-3 px-5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      ביטול
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* 3. APPROVED / LIVE PROJECTS LIST */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    פרויקטים מאושרים המוצגים ב-Available Projects ({projects.length})
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    כל פרויקט ברשימה זו מופיע כרגע בעמוד Projects הפומבי באתר
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-cyan-400" />
                    <span>הורד גיבוי JSON</span>
                  </button>
                  <button
                    onClick={handleResetDefaults}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    איפוס ל-4 הפרויקטים ההתחלתיים
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("האם למחוק את כל הפרויקטים מהאתר?")) {
                        clearAllProjects();
                        refreshAll();
                      }
                    }}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                  >
                    נקה הכל
                  </button>
                </div>
              </div>

              {projects.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p>אין כרגע פרויקטים מאושרים באתר.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/40 p-4 hover:border-cyan-500/30 transition-all"
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0" dir="ltr">
                        {proj.imageUrl ? (
                          <img
                            src={proj.imageUrl}
                            alt=""
                            className="h-20 w-24 rounded-lg object-contain ring-1 ring-white/10 shrink-0 bg-white p-1"
                          />
                        ) : (
                          <div className="h-20 w-24 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                            <ImageIcon className="h-6 w-6" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-base leading-snug truncate">
                            {proj.title}
                          </h3>
                          {proj.supervisor && (
                            <p className="text-xs font-semibold text-cyan-400 mt-1">
                              {proj.supervisor}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {proj.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => handleStartEdit(proj)}
                          className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-cyan-400" />
                          <span>ערוך</span>
                        </button>
                        <button
                          onClick={() => handleDelete(proj.id, proj.title)}
                          className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>מחק</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
