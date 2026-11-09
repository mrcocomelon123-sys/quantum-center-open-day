export interface Project {
  id: string;
  title: string;
  supervisor: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
}

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-1",
    title: "Unveiling the limitations of energy conversion in quantum systems",
    supervisor: "Prof. David Gelbwaser (dgelbi@technion.ac.il)",
    description:
      "Quantum energy conversion devices such as solar cells, photosynthetic systems, or molecular junctions exhibit a surprising effect known as the turnover effect: their power increases with the interaction strength with the energy source but drops to zero for very strong interactions.\n\nAs a consequence of the turnover effect, the performance of several non-equilibrium devices is limited by a bound on the electrical current, heat flow, power, or reaction rate. The potential technological applications of these devices call for devising strategies to prevent or minimize the consequences of the turnover effect.\n\nIn this project, we will develop numerical and/or analytical models to understand the turnover effect and identify strategies to mitigate it, thereby unleashing the full potential of these devices for multiple technological applications.",
    imageUrl: "/sample-project.jpg",
    createdAt: "2026-11-09T08:00:00.000Z",
  },
  {
    id: "proj-2",
    title: "Quantum Photonics & Entangled Light Sources on Chip",
    supervisor: "Helen Diller Quantum Center Faculty",
    description:
      "Integrated quantum photonics enables the generation, manipulation, and detection of entangled photon pairs directly on silicon-nitride and lithium-niobate chips.\n\nIn this project, students will design and characterize nanoscale optical resonators and waveguide circuits for room-temperature quantum communication and photonic quantum computing.",
    imageUrl: "",
    createdAt: "2026-11-09T08:05:00.000Z",
  },
  {
    id: "proj-3",
    title: "Superconducting Qubits & Quantum Error Correction",
    supervisor: "Quantum Computing Lab — Technion",
    description:
      "Fault-tolerant quantum computation requires suppressing decoherence and gate errors below the surface-code threshold.\n\nThis project explores novel superconducting circuit architectures, bosonic cat-qubits, and real-time syndrome decoding algorithms using microwave control pulses.",
    imageUrl: "",
    createdAt: "2026-11-09T08:10:00.000Z",
  },
  {
    id: "proj-4",
    title: "Quantum Sensing with Nitrogen-Vacancy Centers in Diamond",
    supervisor: "Spin Physics & Nanomagnetometry Group",
    description:
      "Nitrogen-Vacancy (NV) centers in diamond act as atomic-scale quantum sensors capable of detecting magnetic and electric fields with nanoscale spatial resolution.\n\nStudents will work on optical spin initialization, dynamical decoupling sequences, and sensing biological or condensed-matter samples.",
    imageUrl: "",
    createdAt: "2026-11-09T08:15:00.000Z",
  },
  {
    id: "proj-5",
    title: "Ultracold Atoms & Quantum Simulation in Optical Lattices",
    supervisor: "Atomic & Molecular Physics Lab",
    description:
      "By cooling atoms to nanokelvin temperatures and trapping them in laser-formed optical lattices, we simulate strongly correlated quantum many-body Hamiltonians.\n\nThe project involves quantum gas microscopy, topological band structures, and out-of-equilibrium quantum dynamics.",
    imageUrl: "",
    createdAt: "2026-11-09T08:20:00.000Z",
  },
  {
    id: "proj-6",
    title: "Quantum Algorithms & Variational Many-Body Solvers",
    supervisor: "Quantum Information Theory Group",
    description:
      "Near-term intermediate-scale quantum (NISQ) processors offer new avenues for simulating quantum chemistry and optimization problems.\n\nIn this theoretical and computational project, we investigate barren-plateau mitigation, tensor-network preconditioning, and hybrid quantum-classical algorithms.",
    imageUrl: "",
    createdAt: "2026-11-09T08:25:00.000Z",
  },
  {
    id: "proj-7",
    title: "Topological Quantum Matter & 2D Van der Waals Heterostructures",
    supervisor: "Quantum Materials & Condensed Matter Group",
    description:
      "Atomically thin 2D materials and twisted moiré superlattices host exotic emergent quantum phases including fractional Chern insulators and unconventional superconductivity.\n\nStudents will participate in device nanofabrication, cryogenic magneto-transport measurements, and scanning tunneling spectroscopy.",
    imageUrl: "",
    createdAt: "2026-11-09T08:30:00.000Z",
  },
];

const STORAGE_KEY = "quantum_center_projects_v2";
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
