export interface Project {
  id: string;
  title: string;
  supervisor: string;
  description: string;
  prerequisites?: string;
  references?: string;
  imageUrl?: string;
  pdfUrl?: string;
  createdAt: string;
}

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-mpemba-1",
    title: "Quantum Mpemba effect: why hot water can make ice faster than cold water",
    supervisor: "Supervisor: David Gelbwaser (dgelbi@technion.ac.il)",
    description:
      "It is generally expected that a hotter system will take longer to cool than a colder system. Nevertheless, this is not always true. Sometimes, a hotter system cools down faster than a cold system. This unusual phenomenon is known as the Mpemba effect, and it has been documented since the time of Aristotle, when people used hot water to melt ice more quickly than cold water.\n\nMoreover, the microscopic mechanisms underlying this unusual effect remain under debate. This project aims to study the Mpemba effect in quantum systems. Using a microscopic thermalization model, we will explore the conditions under which the Mpemba effect occurs and elucidate the underlying microscopic mechanism.\n\nDuring the project, the students will learn open quantum systems theory, the basic theoretical framework for describing thermalization processes, noise, and decoherence in quantum computers.",
    references:
      '• Mpemba, Erasto B., and Denis G. Osborne. "Cool?." Physics Education 4.3 (1969): 172-175.\n• Lu, Z., & Raz, O. (2017). Nonequilibrium thermodynamics of the Markovian Mpemba effect and its inverse. Proceedings of the National Academy of Sciences, 114(20), 5083-5088.\n• Avitan, Ido, Roee Factor, and David Gelbwaser-Klimovsky. "Necessary conditions for the Markovian Mpemba effect." arXiv:2603.04567 (2026).',
    prerequisites:
      "Basic programming skills in any language (python, mathematica, matlab, etc) and basic quantum mechanics",
    imageUrl: "/mpemba-project.png",
    pdfUrl: "/quantum-mpemba-effect.pdf",
    createdAt: "2026-11-09T18:55:00.000Z",
  },
];

const STORAGE_KEY = "quantum_center_projects_v3";
const CHANNEL_NAME = "quantum_projects_sync";

export function getProjects(): Project[] {
  if (typeof window === "undefined") {
    return INITIAL_PROJECTS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
      return INITIAL_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_PROJECTS;
  } catch (err) {
    console.error("Failed to load projects from localStorage:", err);
    return INITIAL_PROJECTS;
  }
}

export async function fetchServerProjects(): Promise<Project[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/projects", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && Array.isArray(data.projects)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.projects));
      return data.projects as Project[];
    }
  } catch {
    // Ignore network error and use localStorage fallback
  }
  return null;
}

async function syncProjectsToServer(projects: Project[]): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projects }),
    });
  } catch {
    // Fallback to localStorage only if server endpoint unavailable
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    window.dispatchEvent(new CustomEvent("projects-updated", { detail: projects }));
    if ("BroadcastChannel" in window) {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.postMessage({ type: "PROJECTS_UPDATED", projects });
      bc.close();
    }
    void syncProjectsToServer(projects);
  } catch (err) {
    console.error("Failed to save projects:", err);
  }
}

export function addProject(newProj: Omit<Project, "id" | "createdAt">): Project {
  const current = getProjects();
  const created: Project = {
    ...newProj,
    id: "proj-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
  };
  const updated = [created, ...current];
  saveProjects(updated);
  return created;
}

export function deleteProject(id: string): void {
  const current = getProjects();
  const updated = current.filter((p) => p.id !== id);
  saveProjects(updated);
}

export function updateProject(id: string, updates: Partial<Omit<Project, "id" | "createdAt">>): void {
  const current = getProjects();
  const updated = current.map((p) => (p.id === id ? { ...p, ...updates } : p));
  saveProjects(updated);
}

export function clearAllProjects(): void {
  saveProjects([]);
}
