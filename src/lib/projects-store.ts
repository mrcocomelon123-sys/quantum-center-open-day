export interface Project {
  id: string;
  title: string;
  supervisor: string;
  description: string;
  linkUrl?: string;
  prerequisites?: string;
  references?: string;
  imageUrl?: string;
  pdfUrl?: string;
  createdAt: string;
  updatedAt?: number;
  status?: "approved" | "pending";
}

export interface StoredState {
  projects: Project[];
  pendingProjects: Project[];
  deletedIds: string[];
  rejectedIds: string[];
  version: number;
  updatedAt: number;
}

export const LIVE_NOTIFY_SSE_URL = "https://ntfy.sh/hdqc_live_notify_v7/sse";
export const LIVE_NOTIFY_POST_URL = "https://ntfy.sh/hdqc_live_notify_v7";

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
    updatedAt: 1794250500000,
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
    updatedAt: 1794251100000,
    status: "approved",
  },
  {
    id: "proj-neufeld-3",
    title: "Ultrafast Laser-driven dynamics in 2D material nanoribbons",
    supervisor: "Contact: Ofer Neufeld (ofern@technion.ac.il)",
    description:
      "This project aims to develop theory of laser-driven ultrafast electron dynamics in 2D materials nanoribbons. These are 1D-periodic structures with edge states that can have topological properties and form conducting channels with enhanced transport. Dynamics of exciting and driving currents through these states is largely unexplored on femtosecond timescales (we recently explored this in 2D flakes - https://arxiv.org/abs/2604.21121, in press in ACS Photonics).\n\nStudents will develop theoretical tight-binding models that describe these systems, including the surface and spin-orbit coupling, and use them to explore time-dependent dynamics in the electronic states driven by the laser. We aim to understand how to excite these states effectively, and enhance their robustness to dissipation and scattering.",
    linkUrl: "https://arxiv.org/abs/2604.21121",
    imageUrl: "/neufeld-project.jpg",
    pdfUrl: "/neufeld-project.pdf",
    createdAt: "2026-11-09T19:08:00.000Z",
    updatedAt: 1794251280000,
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
    updatedAt: 1794250200000,
    status: "approved",
  },
  {
    id: "proj-time-crystals-5",
    title: "Controlling Light Through Time: Photonic Time Crystals",
    supervisor: "Contact Person: Oded Schiller (odedschiller@campus.technion.ac.il)",
    description:
      "What if we could control light by changing materials in time? Explore the fascinating physics of photonic time crystals, where light can be amplified, reflected in time, and manipulated in ways impossible in conventional optical systems.",
    imageUrl: "/project-photonic-time-crystals.png",
    pdfUrl: "/photonic-time-crystals.pdf",
    createdAt: "2026-11-10T13:50:00.000Z",
    updatedAt: 1794318600000,
    status: "approved",
  },
  {
    id: "proj-topological-photonics-6",
    title: "Light That Defies Defects: Topological Photonics",
    supervisor: "Contact Person: Roey Shafran (roeyshafran@campus.technion.ac.il)",
    description:
      "Imagine light traveling around sharp corners and imperfections without scattering. Discover how topology enables robust, protected states of light and explore the exciting possibilities of topological photonic systems.",
    imageUrl: "/project-topological-photonics.png",
    pdfUrl: "/topological-photonics.pdf",
    createdAt: "2026-11-10T13:51:00.000Z",
    updatedAt: 1794318660000,
    status: "approved",
  },
  {
    id: "proj-entangled-photons-7",
    title: "Engineering Entangled Photons: Quantum Optics and Quantum Light",
    supervisor: "Contact Person: Roey Shafran (roeyshafran@campus.technion.ac.il)",
    description:
      "Explore the strange and fascinating world of quantum light, from single photons to quantum entanglement. Discover how quantum states of light can be generated and controlled, opening new possibilities for quantum communication, computing, and sensing.",
    imageUrl: "/project-entangled-photons.png",
    pdfUrl: "/entangled-photons.pdf",
    createdAt: "2026-11-10T13:52:00.000Z",
    updatedAt: 1794318720000,
    status: "approved",
  },
  {
    id: "proj-ai-quantum-phases-8",
    title: "Can AI Discover Quantum Phases? Machine Learning for Quantum Many-Body Physics",
    supervisor: "Contact Person: Roey Shafran (roeyshafran@campus.technion.ac.il)",
    description:
      "Can artificial intelligence uncover hidden phenomena in complex quantum systems? Combine machine learning with quantum physics to discover patterns, identify phase transitions, and explore the collective behavior of quantum many-body systems.",
    imageUrl: "/project-ai-quantum-phases.png",
    pdfUrl: "/ai-quantum-phases.pdf",
    createdAt: "2026-11-10T13:53:00.000Z",
    updatedAt: 1794318780000,
    status: "approved",
  },
  {
    id: "pending-mwapzaam-np8g",
    title: "Quantum-Secure Multiparty Deep Learning",
    supervisor: "Dr. Kfir Sulimany - kfirsu@technion.ac.il",
    description:
      "The demand for secure computation has become increasingly urgent as deep learning workloads are offloaded to cloud servers, introducing significant vulnerabilities. State-of-the-art solutions are impractical for deep learning due to computational overhead, and they rely on computational assumptions. We leverage the quantum nature of light for information-theoretically secure multiparty inference using telecommunication components. Our approach prevents the server's model from leaking to the client and shields the client's data from leaking to the server.\n\nThe student will explore the fundamental limits of physics-based secure computation. They will develop new protocols, analyze their security with the Lean theorem prover, and implement photonic systems for private inference in quantum networks.\n\nPrerequisites: a strong foundation in at least one of mathematics and formal verification, cryptography, quantum information processing, or photonics.\n\nReferences:\n1. K. Sulimany et al., \"Quantum-secure multiparty deep learning,\" Phys. Rev. X 15, 041056 (2025).\n2. M. Ben-Shahar, Y. Morag, D. Englund, K. Sulimany, \"Quantum cryptography and autoformalization in Lean,\" arXiv:2610.17286 (2026).",
    prerequisites:
      "A strong foundation in at least one of mathematics and formal verification, cryptography, quantum information processing, or photonics.",
    references:
      '1. K. Sulimany et al., "Quantum-secure multiparty deep learning," Phys. Rev. X 15, 041056 (2025).\n2. M. Ben-Shahar, Y. Morag, D. Englund, K. Sulimany, "Quantum cryptography and autoformalization in Lean," arXiv:2610.17286 (2026).',
    linkUrl: "https://arxiv.org/abs/2610.17286",
    createdAt: "2026-11-10T13:22:23.326Z",
    updatedAt: 1794330471315,
    status: "approved",
  },
  {
    id: "pending-mwav7q9d-hzs6",
    title: "Exploring Unconventional Superconductivity at the Atomic Scale",
    supervisor: "Avior Almoalem - avioral@technion.ac.il",
    description:
      "How do electrons pair in unconventional superconductors, and what can atomic defects and material edges reveal about their quantum state? Our group uses low-temperature scanning tunneling microscopy and spectroscopy (STM/STS), device fabrication and transport to explore these questions in layered and kagome quantum materials.\n\nThe project will consist of imaging surfaces with atomic resolution, measuring superconducting gaps and electronic excitations, investigating their response to impurities, magnetic fields, changes in composition and fabricating devices to elucidate transport response under defined geometry. Advanced directions include superconducting tips that probe Cooper-pair tunneling and the development of spin-sensitive probes to investigate connections between superconductivity, magnetism, and topology.\n\nMSc projects will focus on a well-defined experimental question, while PhD projects can combine advanced probe development with systematic investigations of unconventional superconductivity. Hands-on experience in cryogenics, ultrahigh vacuum, precision measurements, scientific programming, and data analysis will be a core part of the project.",
    linkUrl: "https://arxiv.org/abs/2608.28848",
    imageUrl: "/project-avior-superconductivity.jpg",
    createdAt: "2026-11-10T15:48:55.345Z",
    updatedAt: 1794330469718,
    status: "approved",
  },
  {
    id: "proj-mwaz7v5g-b4ma",
    title: "Quantum Information at Its Limits: From One Copy to Many",
    supervisor: "Gilad Gour (giladgour@gmail.com)",
    description:
      "How much can a quantum device achieve when every qubit, channel use, or entangled pair counts? Many fundamental results describe an idealized setting where resources can be used arbitrarily many times. This project explores what becomes possible when only a few resources are available, seeking universal bounds that connect quantum communication, entanglement manipulation, and other information-processing tasks. The student will combine mathematical analysis with numerical exploration to discover these limits and identify states and channels that reach them. A central goal is to uncover principles that connect a single use of a quantum resource to the collective power of many copies. Along the way, the student will learn tools from quantum information and quantum resource theories while investigating the boundary between what quantum physics permits and what it forbids.",
    imageUrl: "/project-gour-quantum-info.jpg",
    createdAt: "2026-11-10T17:41:00.148Z",
    updatedAt: 1794332460148,
    status: "approved",
  },
  {
    id: "pending-mwazrlsd-91j0",
    title: "Photon correlations in superfluorescence",
    supervisor: "Ron Tenne - ron.tenne@technion.ac.il",
    description:
      "The terms nano, quantum and fast (or ultrafast), which we use so often in chemistry and physics, are inherently linked together. Our lab creates unique tools to observe these links in vivid detail. We study nano-sized emitters of quantum states of light –states that cannot be described simply by Maxwell’s equations. To understand their physics, we need to study one nano particle at a time and at very fast rates. Combining “fast” and “small” is very challenging and takes up much of our working time. \nOne of our strategies to accomplish this is to excite nanoparticles with an electron microscope and measure their emission with single photon avalanche detector (SPAD) arrays. The electron microscope meets the condition of observing “small” dimensions, exciting a material within a ~10 nm spot. SPAD arrays allows us to observe the emission of photons with high temporal resolution. In this project our goal is to measure, analyze and understand correlation in the resulting emission. Technically we answer questions such as: “if three photons were already detected what is the probability to also see fourth one”. This new information, never measured before, will serve multiple purposes. We can use it as a contrast to form an image, to understand the dynamics of electrons in the electron source or learn about the transport of electrons within a sample.\nOur lab opened its doors just two years ago, and you will be able to join in and experience experimental optics/materials science at the ground-floor level. We have multiple long-term experiments in which we can establish a short-term project that will keep you challenged throughout your time in the Technion.",
    linkUrl: "https://funspeclab.twix.technion.ac.il/",
    imageUrl: "/project-tenne-superfluorescence.jpg",
    createdAt: "2026-11-10T17:56:21.133Z",
    updatedAt: 1794333451554,
    status: "approved",
  },
];

export const INITIAL_PENDING_PROJECTS: Project[] = [];

const STORAGE_KEY = "quantum_center_projects_v7";
const PENDING_STORAGE_KEY = "quantum_center_pending_projects_v7";
const DELETED_IDS_KEY = "quantum_center_deleted_ids_v7";
const REJECTED_IDS_KEY = "quantum_center_rejected_ids_v7";
const CHANNEL_NAME = "quantum_projects_sync";

let inFlightMutations = 0;
let lastMutationTimeMs = 0;

export function normalizeExternalUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        try {
          const maxDim = 760;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          let compressed = canvas.toDataURL("image/jpeg", 0.74);
          if (compressed.length > 42000) {
            compressed = canvas.toDataURL("image/jpeg", 0.6);
          }
          resolve(compressed);
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function getDeletedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getRejectedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REJECTED_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setDeletedIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {
    // ignore storage errors
  }
}

function setRejectedIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REJECTED_IDS_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {
    // ignore storage errors
  }
}

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
    if (!Array.isArray(parsed)) return INITIAL_PROJECTS;
    const deletedSet = new Set(getDeletedIds());
    const existingIds = new Set(parsed.map((p: Project) => p.id));
    let addedDefault = false;
    const merged = [...parsed];
    for (const initProj of INITIAL_PROJECTS) {
      if (!existingIds.has(initProj.id) && !deletedSet.has(initProj.id)) {
        merged.push(initProj);
        addedDefault = true;
      }
    }
    if (addedDefault) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
    return merged;
  } catch (err) {
    console.error("Failed to load projects from localStorage:", err);
    return INITIAL_PROJECTS;
  }
}

export function getPendingProjects(): Project[] {
  if (typeof window === "undefined") {
    return INITIAL_PENDING_PROJECTS;
  }
  try {
    const raw = localStorage.getItem(PENDING_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(INITIAL_PENDING_PROJECTS));
      return INITIAL_PENDING_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_PENDING_PROJECTS;
  } catch (err) {
    console.error("Failed to load pending projects from localStorage:", err);
    return INITIAL_PENDING_PROJECTS;
  }
}

function notifyLocalListeners(projects: Project[], pendingProjects: Project[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(pendingProjects));
  } catch (err) {
    console.error("Failed to write localStorage:", err);
  }
  window.dispatchEvent(
    new CustomEvent("projects-updated", { detail: { projects, pendingProjects } })
  );
  if ("BroadcastChannel" in window) {
    try {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.postMessage({ type: "PROJECTS_UPDATED", projects, pendingProjects });
      bc.close();
    } catch {
      // ignore BroadcastChannel errors
    }
  }
}

export async function fetchServerState(forceFresh = false): Promise<{
  projects: Project[];
  pendingProjects: Project[];
} | null> {
  if (typeof window === "undefined") return null;
  // Do not overwrite optimistic UI while a local mutation is actively in flight
  if (inFlightMutations > 0 || Date.now() - lastMutationTimeMs < 1500) {
    return {
      projects: getProjects(),
      pendingProjects: getPendingProjects(),
    };
  }
  try {
    const url = `/api/projects?t=${Date.now()}${forceFresh ? "&fresh=1" : ""}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    if (inFlightMutations > 0 || Date.now() - lastMutationTimeMs < 1500) {
      return {
        projects: getProjects(),
        pendingProjects: getPendingProjects(),
      };
    }
    const data = (await res.json()) as Partial<StoredState>;
    const serverDeleted = Array.isArray(data.deletedIds) ? data.deletedIds : [];
    const serverRejected = Array.isArray(data.rejectedIds) ? data.rejectedIds : [];

    setDeletedIds(serverDeleted);
    setRejectedIds(serverRejected);

    const serverProjects = Array.isArray(data.projects) ? data.projects : INITIAL_PROJECTS;
    const serverPending = Array.isArray(data.pendingProjects)
      ? data.pendingProjects
      : INITIAL_PENDING_PROJECTS;

    notifyLocalListeners(serverProjects, serverPending);
    return { projects: serverProjects, pendingProjects: serverPending };
  } catch {
    return null;
  }
}

export async function fetchServerProjects(): Promise<Project[] | null> {
  const state = await fetchServerState(false);
  return state ? state.projects : null;
}

async function pingLiveNotify(action: string, id?: string): Promise<void> {
  try {
    await fetch(LIVE_NOTIFY_POST_URL, {
      method: "POST",
      body: JSON.stringify({ action, id, t: Date.now() }),
    });
  } catch {
    // ignore push ping errors
  }
}

async function sendAtomicMutation(payload: Record<string, unknown>): Promise<boolean> {
  if (typeof window === "undefined") return false;
  inFlightMutations++;
  lastMutationTimeMs = Date.now();
  let success = false;
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = (await res.json()) as Partial<StoredState>;
          if (Array.isArray(data.deletedIds)) setDeletedIds(data.deletedIds);
          if (Array.isArray(data.rejectedIds)) setRejectedIds(data.rejectedIds);
          if (Array.isArray(data.projects) && Array.isArray(data.pendingProjects)) {
            notifyLocalListeners(data.projects, data.pendingProjects);
          }
          success = true;
          break;
        }
      } catch (err) {
        console.error(`Mutation attempt ${attempt + 1} failed:`, err);
      }
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    void pingLiveNotify(String(payload.action || "update"));
    return success;
  } finally {
    inFlightMutations = Math.max(0, inFlightMutations - 1);
    lastMutationTimeMs = Date.now();
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  const pending = getPendingProjects();
  notifyLocalListeners(projects, pending);
  void sendAtomicMutation({
    action: "sync_merge",
    projects,
    pendingProjects: pending,
    deletedIds: getDeletedIds(),
    rejectedIds: getRejectedIds(),
  });
}

export function savePendingProjects(pendingProjects: Project[]): void {
  if (typeof window === "undefined") return;
  const approved = getProjects();
  notifyLocalListeners(approved, pendingProjects);
  void sendAtomicMutation({
    action: "sync_merge",
    projects: approved,
    pendingProjects,
    deletedIds: getDeletedIds(),
    rejectedIds: getRejectedIds(),
  });
}

export function addProject(newProj: Omit<Project, "id" | "createdAt">): Project {
  const current = getProjects();
  const now = Date.now();
  const created: Project = {
    ...newProj,
    linkUrl: normalizeExternalUrl(newProj.linkUrl),
    id: "proj-" + now.toString(36) + "-" + Math.random().toString(36).slice(2, 6),
    createdAt: new Date(now).toISOString(),
    updatedAt: now,
    status: "approved",
  };
  const updated = [created, ...current];
  notifyLocalListeners(updated, getPendingProjects());
  void sendAtomicMutation({ action: "add_project", project: created });
  return created;
}

export async function submitPendingProjectAsync(
  newProj: Omit<Project, "id" | "createdAt" | "status">
): Promise<{ project: Project; synced: boolean }> {
  const currentPending = getPendingProjects();
  const now = Date.now();
  const created: Project = {
    ...newProj,
    linkUrl: normalizeExternalUrl(newProj.linkUrl),
    id: "pending-" + now.toString(36) + "-" + Math.random().toString(36).slice(2, 6),
    createdAt: new Date(now).toISOString(),
    updatedAt: now,
    status: "pending",
  };
  const updatedPending = [created, ...currentPending];
  notifyLocalListeners(getProjects(), updatedPending);
  const synced = await sendAtomicMutation({ action: "submit_pending", project: created });
  return { project: created, synced };
}

export function submitPendingProject(
  newProj: Omit<Project, "id" | "createdAt" | "status">
): Project {
  const currentPending = getPendingProjects();
  const now = Date.now();
  const created: Project = {
    ...newProj,
    linkUrl: normalizeExternalUrl(newProj.linkUrl),
    id: "pending-" + now.toString(36) + "-" + Math.random().toString(36).slice(2, 6),
    createdAt: new Date(now).toISOString(),
    updatedAt: now,
    status: "pending",
  };
  const updatedPending = [created, ...currentPending];
  notifyLocalListeners(getProjects(), updatedPending);
  void sendAtomicMutation({ action: "submit_pending", project: created });
  return created;
}

export function approvePendingProject(id: string): Project | null {
  const currentPending = getPendingProjects();
  const target = currentPending.find((p) => p.id === id);
  if (!target) return null;

  const now = Date.now();
  const remainingPending = currentPending.filter((p) => p.id !== id);
  const approvedItem: Project = {
    ...target,
    updatedAt: now,
    status: "approved",
  };
  const currentApproved = getProjects().filter((p) => p.id !== id);
  const updatedApproved = [approvedItem, ...currentApproved];

  const rejected = [...getRejectedIds(), id];
  setRejectedIds(rejected);

  notifyLocalListeners(updatedApproved, remainingPending);
  void sendAtomicMutation({ action: "approve_pending", id, project: approvedItem });
  return approvedItem;
}

export function rejectPendingProject(id: string): void {
  const currentPending = getPendingProjects();
  const remainingPending = currentPending.filter((p) => p.id !== id);
  const rejected = [...getRejectedIds(), id];
  setRejectedIds(rejected);

  notifyLocalListeners(getProjects(), remainingPending);
  void sendAtomicMutation({ action: "reject_pending", id });
}

export function deleteProject(id: string): void {
  const current = getProjects();
  const updated = current.filter((p) => p.id !== id);
  const deleted = [...getDeletedIds(), id];
  setDeletedIds(deleted);

  notifyLocalListeners(updated, getPendingProjects());
  void sendAtomicMutation({ action: "delete_project", id });
}

export function updateProject(
  id: string,
  updates: Partial<Omit<Project, "id" | "createdAt">>
): void {
  const current = getProjects();
  const now = Date.now();
  let updatedItem: Project | undefined;
  const updated = current.map((p) => {
    if (p.id === id) {
      updatedItem = {
        ...p,
        ...updates,
        linkUrl:
          updates.linkUrl !== undefined ? normalizeExternalUrl(updates.linkUrl) : p.linkUrl,
        updatedAt: now,
      };
      return updatedItem;
    }
    return p;
  });
  notifyLocalListeners(updated, getPendingProjects());
  void sendAtomicMutation({
    action: "update_project",
    id,
    updates: {
      ...updates,
      linkUrl: updates.linkUrl !== undefined ? normalizeExternalUrl(updates.linkUrl) : undefined,
      updatedAt: now,
    },
    project: updatedItem,
  });
}

export function clearAllProjects(): void {
  const currentIds = getProjects().map((p) => p.id);
  const initialIds = INITIAL_PROJECTS.map((p) => p.id);
  const allDeleted = Array.from(new Set([...getDeletedIds(), ...currentIds, ...initialIds]));
  setDeletedIds(allDeleted);

  notifyLocalListeners([], getPendingProjects());
  void sendAtomicMutation({ action: "clear_all", deletedIds: allDeleted });
}

export function resetToDefaultProjects(): void {
  setDeletedIds([]);
  notifyLocalListeners(INITIAL_PROJECTS, getPendingProjects());
  void sendAtomicMutation({ action: "reset_defaults" });
}
