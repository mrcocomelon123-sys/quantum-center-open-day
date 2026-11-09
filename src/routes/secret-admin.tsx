import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import logoImg from "@/assets/logo.png";
import {
  getProjects,
  fetchServerProjects,
  addProject,
  deleteProject,
  updateProject,
  saveProjects,
  clearAllProjects,
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
  KeyRound,
  Eye,
  EyeOff,
  X,
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
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(AUTH_KEY);
      if (stored === "authenticated") {
        setIsAuthenticated(true);
      }
      setProjects(getProjects());
      void fetchServerProjects().then((serverList) => {
        if (serverList) setProjects(serverList);
      });
    }
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "authenticated");
      setIsAuthenticated(true);
      setErrorMsg("");
      setProjects(getProjects());
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
        imageUrl: finalImage,
      });
      setStatusMsg("הפרויקט עודכן בהצלחה!");
      setEditingId(null);
    } else {
      addProject({
        title: title.trim(),
        supervisor: supervisor.trim(),
        description: description.trim(),
        imageUrl: finalImage,
      });
      setStatusMsg("הפרויקט נוסף בהצלחה למערכת!");
    }

    // Reset form
    setTitle("");
    setSupervisor("");
    setDescription("");
    setImagePreview("");
    setImageUrlInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setProjects(getProjects());

    setTimeout(() => setStatusMsg(""), 4000);
  };

  const handleStartEdit = (proj: Project) => {
    setEditingId(proj.id);
    setTitle(proj.title);
    setSupervisor(proj.supervisor);
    setDescription(proj.description);
    setImagePreview(proj.imageUrl || "");
    setImageUrlInput("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setSupervisor("");
    setDescription("");
    setImagePreview("");
    setImageUrlInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = (id: string, projTitle: string) => {
    if (confirm(`האם אתה בטוח שברצונך למחוק את הפרויקט "${projTitle}"?`)) {
      deleteProject(id);
      setProjects(getProjects());
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projects, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `quantum-projects-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetDefaults = () => {
    if (confirm("האם לאפס את רשימת הפרויקטים לפרויקט ברירת המחדל לדוגמה?")) {
      saveProjects(INITIAL_PROJECTS);
      setProjects(INITIAL_PROJECTS);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#030712] text-slate-100 selection:bg-cyan-500/30">
      <SiteHeader />

      <main className="flex-1 py-10 px-4 sm:px-6 max-w-5xl mx-auto w-full">
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
                הכנס סיסמה כדי להעלות או לערוך פרויקטים שיוצגו באתר
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
                className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-4 shadow-lg shadow-cyan-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                התחבר למערכת
              </button>
            </form>

            <div className="mt-6 border-t border-white/10 pt-4 text-center">
              <span className="text-xs text-slate-500">
                סיסמת ברירת מחדל: <code className="text-cyan-400 font-mono">quantum2026</code>
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
                  <span className="text-xs text-slate-400 font-mono">Admin Panel</span>
                </div>
                <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
                  ניהול פרויקטי מחקר — Open Day
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/projects"
                  target="_blank"
                  className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                  <span>צפה בעמוד Projects באתר</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
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

            {/* Project Upload / Edit Form */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {editingId ? "עריכת פרויקט קיים" : "העלאת פרויקט חדש"}
                  </h2>
                </div>
                {editingId && (
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" /> ביטול עריכה
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveProject} className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    כותרת הפרויקט (Project Title) <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="לדוגמה: Unveiling the limitations of energy conversion in quantum systems"
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>

                {/* Supervisor */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    מנחה ופרטי יצירת קשר (Supervisor)
                  </label>
                  <input
                    type="text"
                    value={supervisor}
                    onChange={(e) => setSupervisor(e.target.value)}
                    placeholder="לדוגמה: Supervisor: David Gelbwaser (dgelbi@technion.ac.il)"
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    תיאור הפרויקט (Description) <span className="text-cyan-400">*</span>
                  </label>
                  <textarea
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="תיאור מלא של הפרויקט, מטרות המחקר, שאלות מדעיות ודרישות..."
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed"
                    required
                  />
                </div>

                {/* Image Upload Area */}
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    תמונה לפרויקט (גרפים / דיאגרמה / פוסטר)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* File upload */}
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-black/30 p-5 hover:border-cyan-500/50 transition-colors">
                      <Upload className="h-8 w-8 text-cyan-400 mb-2" />
                      <span className="text-xs font-semibold text-slate-200">העלה קובץ תמונה מהמכשיר</span>
                      <span className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, WEBP</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="mt-3 text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 file:cursor-pointer"
                      />
                    </div>

                    {/* Image URL input */}
                    <div className="flex flex-col justify-center rounded-xl border border-white/15 bg-black/30 p-5">
                      <span className="text-xs font-semibold text-slate-200 mb-1">או הזן קישור ישיר לתמונה (URL):</span>
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => {
                          setImageUrlInput(e.target.value);
                          if (e.target.value) setImagePreview(e.target.value);
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="mt-2 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Image preview */}
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
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          הסר תמונה
                        </button>
                      </div>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-60 w-auto rounded-lg object-contain mx-auto"
                      />
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-6 shadow-lg shadow-cyan-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2"
                  >
                    <PlusCircle className="h-5 w-5" />
                    <span>{editingId ? "שמור שינויים בפרויקט" : "העלה פרויקט חדש לאתר"}</span>
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-xl border border-white/20 bg-white/5 py-3 px-5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-colors"
                    >
                      ביטול
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Existing Projects List */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">פרויקטים מוצגים באתר ({projects.length})</h2>
                  <p className="text-xs text-slate-400 mt-1">כל פרויקט שמופיע כאן יוצג באופן מיידי בלשונית Projects</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
                    title="הורד קובץ JSON של כל הפרויקטים לגיבוי"
                  >
                    <Download className="h-3.5 w-3.5 text-cyan-400" />
                    <span>הורד גיבוי JSON</span>
                  </button>
                  <button
                    onClick={handleResetDefaults}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    איפוס לדוגמאות
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("האם למחוק את כל הפרויקטים מהאתר?")) {
                        clearAllProjects();
                        setProjects([]);
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
                  <p>אין כרגע פרויקטים במערכת. השתמש בטופס שלמעלה כדי להוסיף את הפרויקט הראשון!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/40 p-4 hover:border-cyan-500/30 transition-all"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        {proj.imageUrl ? (
                          <img
                            src={proj.imageUrl}
                            alt=""
                            className="h-20 w-28 rounded-lg object-cover ring-1 ring-white/10 shrink-0 bg-black"
                          />
                        ) : (
                          <div className="h-20 w-28 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
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
                          className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-cyan-400" />
                          <span>ערוך</span>
                        </button>
                        <button
                          onClick={() => handleDelete(proj.id, proj.title)}
                          className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
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
