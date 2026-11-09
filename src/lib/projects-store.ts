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
  status?: "approved" | "pending";
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
    status: "approved",
  },
  {
    id: "proj-krueger-2",
    title: "Extreme nonlinear optics with bright quantum light",
    supervisor: "Advisor: Prof. Michael Krueger & team (krueger@technion.ac.il | 053-3349694)",
    description:
      "Advisor: Prof. Michael Krueger & team\nContact: krueger@technion.ac.il | 0533349694\n\nExperimental and theoretical research in extreme nonlinear optics driven by bright quantum light sources, high-harmonic generation, and ultrafast quantum light-matter interactions. Contact Prof. Michael Krueger for full project details and lab tour.",
    imageUrl: "/krueger-project.jpg",
    pdfUrl: "/krueger-project.pdf",
    createdAt: "2026-11-09T19:05:00.000Z",
    status: "approved",
  },
  {
    id: "proj-neufeld-3",
    title: "Ultrafast Laser-driven dynamics in 2D material nanoribbons",
    supervisor: "Contact: Ofer Neufeld (ofern@technion.ac.il)",
    description:
      "This project aims to develop theory of laser-driven ultrafast electron dynamics in 2D materials nanoribbons. These are 1D-periodic structures with edge states that can have topological properties and form conducting channels with enhanced transport. Dynamics of exciting and driving currents through these states is largely unexplored on femtosecond timescales (we recently explored this in 2D flakes - https://arxiv.org/abs/2604.21121, in press in ACS Photonics).\n\nStudents will develop theoretical tight-binding models that describe these systems, including the surface and spin-orbit coupling, and use them to explore time-dependent dynamics in the electronic states driven by the laser. We aim to understand how to excite these states effectively, and enhance their robustness to dissipation and scattering.",
    imageUrl: "/neufeld-project.jpg",
    pdfUrl: "/neufeld-project.pdf",
    createdAt: "2026-11-09T19:08:00.000Z",
    status: "approved",
  },
  {
    id: "proj-gelbwaser-4",
    title: "Unveiling the limitations of energy conversion in quantum systems",
    supervisor: "Supervisor: David Gelbwaser (dgelbi@technion.ac.il)",
    description:
      "Quantum energy conversion devices such as solar cells, photosynthetic systems, or molecular junctions exhibit a surprising effect known as the turnover effect: their power increases with the interaction strength with the energy source but drops to zero for very strong interactions (see figure).\n\nAs a consequence of the turnover effect, the performance of several non-equilibrium devices is limited by a bound on the electrical current, heat flow, power, or reaction rate. The potential technological applications of these devices call for devising strategies to prevent or minimize the consequences of the turnover effect.\n\nIn this project, we will develop numerical and/or analytical models to understand the turnover effect and identify strategies to mitigate it, thereby unleashing the full potential of these devices for multiple technological applications.",
    imageUrl: "/sample-project.jpg",
    createdAt: "2026-11-09T18:50:00.000Z",
    status: "approved",
  },
];

const STORAGE_KEY = "quantum_center_projects_v4";
const PENDING_STORAGE_KEY = "quantum_center_pending_projects_v4";
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

export function getPendingProjects(): Project[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(PENDING_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load pending projects from localStorage:", err);
    return [];
  }
}

export async function fetchServerState(): Promise<{
  projects: Project[];
  pendingProjects: Project[];
} | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/projects", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const projects = Array.isArray(data?.projects) ? (data.projects as Project[]) : getProjects();
    const pendingProjects = Array.isArray(data?.pendingProjects)
      ? (data.pendingProjects as Project[])
      : getPendingProjects();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(pendingProjects));
    return { projects, pendingProjects };
  } catch {
    return null;
  }
}

export async function fetchServerProjects(): Promise<Project[] | null> {
  const state = await fetchServerState();
  return state ? state.projects : null;
}

async function syncStateToServer(projects: Project[], pendingProjects: Project[]): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projects, pendingProjects }),
    });
  } catch {
    // Fallback to localStorage only if server endpoint unavailable
  }
}

function broadcastUpdate(projects: Project[], pendingProjects: Project[]): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("projects-updated", { detail: { projects, pendingProjects } })
  );
  if ("BroadcastChannel" in window) {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.postMessage({ type: "PROJECTS_UPDATED", projects, pendingProjects });
    bc.close();
  }
  void syncStateToServer(projects, pendingProjects);
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    const pending = getPendingProjects();
    broadcastUpdate(projects, pending);
  } catch (err) {
    console.error("Failed to save projects:", err);
  }
}

export function savePendingProjects(pendingProjects: Project[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(pendingProjects));
    const approved = getProjects();
    broadcastUpdate(approved, pendingProjects);
  } catch (err) {
    console.error("Failed to save pending projects:", err);
  }
}

export function addProject(newProj: Omit<Project, "id" | "createdAt">): Project {
  const current = getProjects();
  const created: Project = {
    ...newProj,
    id: "proj-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
    status: "approved",
  };
  const updated = [created, ...current];
  saveProjects(updated);
  return created;
}

export function submitPendingProject(newProj: Omit<Project, "id" | "createdAt" | "status">): Project {
  const currentPending = getPendingProjects();
  const created: Project = {
    ...newProj,
    id: "pending-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  const updatedPending = [created, ...currentPending];
  savePendingProjects(updatedPending);
  return created;
}

export function approvePendingProject(id: string): Project | null {
  const currentPending = getPendingProjects();
  const target = currentPending.find((p) => p.id === id);
  if (!target) return null;

  const remainingPending = currentPending.filter((p) => p.id !== id);
  const approvedItem: Project = {
    ...target,
    status: "approved",
  };
  const currentApproved = getProjects();
  const updatedApproved = [approvedItem, ...currentApproved];

  if (typeof window !== "undefined") {
    localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(remainingPending));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedApproved));
    broadcastUpdate(updatedApproved, remainingPending);
  }
  return approvedItem;
}

export function rejectPendingProject(id: string): void {
  const currentPending = getPendingProjects();
  const remainingPending = currentPending.filter((p) => p.id !== id);
  savePendingProjects(remainingPending);
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
