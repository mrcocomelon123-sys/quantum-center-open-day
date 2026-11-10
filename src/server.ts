import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  INITIAL_PROJECTS,
  INITIAL_PENDING_PROJECTS,
  type Project,
  type StoredState,
} from "./lib/projects-store";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;
let memoryState: StoredState | null = null;
let lastCloudCheckMs = 0;

const TMP_FILE = "/tmp/quantum_projects_store_v6.json";
const POINTER_API_URL = "https://api.restful-api.dev/objects/ff808181a09d98f701a1c5b93a6f7e73";
const NTFY_TOPIC_URL = "https://ntfy.sh/hdqc_open_day_store_2026_v6";

function createDefaultState(): StoredState {
  return {
    projects: [...INITIAL_PROJECTS],
    pendingProjects: [...INITIAL_PENDING_PROJECTS],
    deletedIds: [],
    rejectedIds: [],
    version: 1,
    updatedAt: 1794317000000,
  };
}

function sanitizeState(raw: unknown): StoredState | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Partial<StoredState>;
  if (!Array.isArray(obj.projects)) return null;
  const deletedIds = Array.isArray(obj.deletedIds) ? obj.deletedIds : [];
  const deletedSet = new Set(deletedIds);
  const existingIds = new Set(obj.projects.map((p) => p.id));
  const mergedProjects = [...obj.projects];
  for (const initProj of INITIAL_PROJECTS) {
    if (!existingIds.has(initProj.id) && !deletedSet.has(initProj.id)) {
      mergedProjects.push(initProj);
    }
  }
  return {
    projects: mergedProjects,
    pendingProjects: Array.isArray(obj.pendingProjects) ? obj.pendingProjects : [],
    deletedIds,
    rejectedIds: Array.isArray(obj.rejectedIds) ? obj.rejectedIds : [],
    version: typeof obj.version === "number" ? obj.version : 1,
    updatedAt: typeof obj.updatedAt === "number" ? obj.updatedAt : Date.now(),
  };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 3500
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function readCloudState(): Promise<StoredState | null> {
  // 1. Try reading pointer from restful-api.dev
  try {
    const ptrRes = await fetchWithTimeout(POINTER_API_URL, { cache: "no-store" }, 2800);
    if (ptrRes.ok) {
      const ptrJson = (await ptrRes.json()) as {
        data?: {
          ntfyUrl?: string;
          catboxUrl?: string;
          version?: number;
          updatedAt?: number;
        };
      };
      const ptrData = ptrJson?.data;
      if (
        ptrData &&
        memoryState &&
        typeof ptrData.version === "number" &&
        ptrData.version <= memoryState.version &&
        (ptrData.updatedAt ?? 0) <= memoryState.updatedAt
      ) {
        return memoryState;
      }

      const urlsToTry = [ptrData?.ntfyUrl, ptrData?.catboxUrl].filter(
        (u): u is string => typeof u === "string" && u.startsWith("https://")
      );
      for (const blobUrl of urlsToTry) {
        try {
          const blobRes = await fetchWithTimeout(blobUrl, { cache: "no-store" }, 3200);
          if (blobRes.ok) {
            const parsed = sanitizeState(await blobRes.json());
            if (parsed) return parsed;
          }
        } catch {
          // Try next backup URL
        }
      }
    }
  } catch {
    // Fallback to ntfy topic history poll
  }

  // 2. Fallback: poll latest attachment on ntfy topic directly
  try {
    const pollRes = await fetchWithTimeout(
      `${NTFY_TOPIC_URL}/json?poll=1&since=all`,
      { cache: "no-store" },
      3000
    );
    if (pollRes.ok) {
      const text = await pollRes.text();
      const lines = text.trim().split("\n").filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const event = JSON.parse(lines[i]);
          const attUrl = event?.attachment?.url;
          if (typeof attUrl === "string" && attUrl.startsWith("https://")) {
            const attRes = await fetchWithTimeout(attUrl, { cache: "no-store" }, 3000);
            if (attRes.ok) {
              const parsed = sanitizeState(await attRes.json());
              if (parsed) return parsed;
            }
          }
        } catch {
          // continue searching earlier messages
        }
      }
    }
  } catch {
    // ignore network errors
  }

  return null;
}

async function writeCloudState(state: StoredState): Promise<void> {
  const jsonBody = JSON.stringify(state);
  let ntfyUrl = "";
  let catboxUrl = "";

  // Upload to ntfy.sh (fast primary blob store)
  try {
    const ntfyRes = await fetchWithTimeout(
      NTFY_TOPIC_URL,
      {
        method: "PUT",
        headers: { Filename: "state.json" },
        body: jsonBody,
      },
      4000
    );
    if (ntfyRes.ok) {
      const ntfyData = (await ntfyRes.json()) as { attachment?: { url?: string } };
      if (ntfyData?.attachment?.url) {
        ntfyUrl = ntfyData.attachment.url;
      }
    }
  } catch {
    // ignore ntfy error
  }

  // Also upload to catbox.moe (permanent non-expiring backup)
  try {
    const fd = new FormData();
    fd.append("reqtype", "fileupload");
    fd.append("fileToUpload", new Blob([jsonBody], { type: "application/json" }), "state.json");
    const cbRes = await fetchWithTimeout(
      "https://catbox.moe/user/api.php",
      { method: "POST", body: fd },
      3500
    );
    if (cbRes.ok) {
      const urlText = (await cbRes.text()).trim();
      if (urlText.startsWith("https://")) {
        catboxUrl = urlText;
      }
    }
  } catch {
    // ignore catbox timeout/error
  }

  // Update pointer in restful-api.dev
  if (ntfyUrl || catboxUrl) {
    try {
      await fetchWithTimeout(
        POINTER_API_URL,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: "quantum-center-db-v6",
            data: {
              ntfyUrl,
              catboxUrl,
              version: state.version,
              updatedAt: state.updatedAt,
            },
          }),
        },
        3000
      );
    } catch {
      // ignore pointer update error
    }
  }
}

async function loadStoredState(forceCloud = false): Promise<StoredState> {
  const now = Date.now();
  if (memoryState !== null && !forceCloud && now - lastCloudCheckMs < 1500) {
    return memoryState;
  }

  // Try /tmp first if memoryState is null
  if (memoryState === null) {
    try {
      const fs = await import("node:fs/promises");
      const raw = await fs.readFile(TMP_FILE, "utf-8");
      const parsed = sanitizeState(JSON.parse(raw));
      if (parsed) {
        memoryState = parsed;
      }
    } catch {
      // /tmp not written yet on this instance
    }
  }

  // Check cloud state
  lastCloudCheckMs = now;
  const cloudState = await readCloudState();
  if (cloudState) {
    if (
      !memoryState ||
      cloudState.version >= memoryState.version ||
      cloudState.updatedAt >= memoryState.updatedAt
    ) {
      memoryState = cloudState;
      try {
        const fs = await import("node:fs/promises");
        await fs.writeFile(TMP_FILE, JSON.stringify(memoryState), "utf-8");
      } catch {
        // ignore fs error
      }
      return memoryState;
    }
  }

  if (!memoryState) {
    memoryState = createDefaultState();
  }
  return memoryState;
}

async function persistStoredState(nextState: StoredState): Promise<StoredState> {
  const updated: StoredState = {
    ...nextState,
    deletedIds: Array.from(new Set(nextState.deletedIds)),
    rejectedIds: Array.from(new Set(nextState.rejectedIds)),
    version: (nextState.version || 1) + 1,
    updatedAt: Date.now(),
  };
  memoryState = updated;
  lastCloudCheckMs = updated.updatedAt;

  try {
    const fs = await import("node:fs/promises");
    await fs.writeFile(TMP_FILE, JSON.stringify(updated), "utf-8");
  } catch {
    // ignore fs errors
  }

  await writeCloudState(updated);
  return updated;
}

function mergeListsById(primary: Project[], secondary: Project[], exclude: Set<string>): Project[] {
  const map = new Map<string, Project>();
  for (const item of primary) {
    if (item && item.id && !exclude.has(item.id)) {
      map.set(item.id, item);
    }
  }
  for (const item of secondary) {
    if (!item || !item.id || exclude.has(item.id)) continue;
    const existing = map.get(item.id);
    if (!existing || (item.updatedAt ?? 0) > (existing.updatedAt ?? 0)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/projects") {
        if (request.method === "GET") {
          const state = await loadStoredState(false);
          return new Response(JSON.stringify(state), {
            status: 200,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store, no-cache, must-revalidate",
            },
          });
        }

        if (request.method === "POST") {
          const body = (await request.json()) as Record<string, unknown>;
          const current = await loadStoredState(true);
          const action = typeof body.action === "string" ? body.action : "legacy_sync";

          let projects = [...current.projects];
          let pendingProjects = [...current.pendingProjects];
          let deletedIds = [...current.deletedIds];
          let rejectedIds = [...current.rejectedIds];

          if (action === "submit_pending" && body.project) {
            const newPending = body.project as Project;
            if (!pendingProjects.some((p) => p.id === newPending.id)) {
              pendingProjects = [newPending, ...pendingProjects];
            }
          } else if (action === "approve_pending" && typeof body.id === "string") {
            const targetId = body.id;
            const found =
              pendingProjects.find((p) => p.id === targetId) || (body.project as Project | undefined);
            pendingProjects = pendingProjects.filter((p) => p.id !== targetId);
            if (!rejectedIds.includes(targetId)) {
              rejectedIds.push(targetId);
            }
            if (found) {
              const approvedProj: Project = {
                ...found,
                status: "approved",
                updatedAt: Date.now(),
              };
              projects = [approvedProj, ...projects.filter((p) => p.id !== targetId)];
              deletedIds = deletedIds.filter((id) => id !== targetId);
            }
          } else if (action === "reject_pending" && typeof body.id === "string") {
            const targetId = body.id;
            pendingProjects = pendingProjects.filter((p) => p.id !== targetId);
            if (!rejectedIds.includes(targetId)) {
              rejectedIds.push(targetId);
            }
          } else if (action === "add_project" && body.project) {
            const newProj = body.project as Project;
            projects = [newProj, ...projects.filter((p) => p.id !== newProj.id)];
            deletedIds = deletedIds.filter((id) => id !== newProj.id);
          } else if (action === "update_project" && typeof body.id === "string") {
            const targetId = body.id;
            const updates = (body.updates as Partial<Project>) || {};
            const fallbackProject = body.project as Project | undefined;
            const exists = projects.some((p) => p.id === targetId);
            if (exists) {
              projects = projects.map((p) =>
                p.id === targetId ? { ...p, ...updates, updatedAt: Date.now() } : p
              );
            } else if (fallbackProject) {
              projects = [{ ...fallbackProject, updatedAt: Date.now() }, ...projects];
            }
          } else if (action === "delete_project" && typeof body.id === "string") {
            const targetId = body.id;
            projects = projects.filter((p) => p.id !== targetId);
            if (!deletedIds.includes(targetId)) {
              deletedIds.push(targetId);
            }
          } else if (action === "clear_all") {
            const extraDeleted = Array.isArray(body.deletedIds) ? (body.deletedIds as string[]) : [];
            const currentIds = projects.map((p) => p.id);
            const initIds = INITIAL_PROJECTS.map((p) => p.id);
            deletedIds = Array.from(new Set([...deletedIds, ...currentIds, ...initIds, ...extraDeleted]));
            projects = [];
          } else if (action === "reset_defaults") {
            deletedIds = [];
            projects = [...INITIAL_PROJECTS];
          } else {
            // sync_merge or legacy_sync
            const clientDeleted = Array.isArray(body.deletedIds) ? (body.deletedIds as string[]) : [];
            const clientRejected = Array.isArray(body.rejectedIds)
              ? (body.rejectedIds as string[])
              : [];
            deletedIds = Array.from(new Set([...deletedIds, ...clientDeleted]));
            rejectedIds = Array.from(new Set([...rejectedIds, ...clientRejected]));

            const delSet = new Set(deletedIds);
            const clientProjects = Array.isArray(body.projects) ? (body.projects as Project[]) : [];
            projects = mergeListsById(projects, clientProjects, delSet);

            const approvedSet = new Set(projects.map((p) => p.id));
            const pendExclude = new Set([...rejectedIds, ...deletedIds, ...approvedSet]);
            const clientPending = Array.isArray(body.pendingProjects)
              ? (body.pendingProjects as Project[])
              : [];
            pendingProjects = mergeListsById(pendingProjects, clientPending, pendExclude);
          }

          const saved = await persistStoredState({
            projects,
            pendingProjects,
            deletedIds,
            rejectedIds,
            version: current.version,
            updatedAt: Date.now(),
          });

          return new Response(
            JSON.stringify({
              ok: true,
              ...saved,
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json; charset=utf-8",
                "cache-control": "no-store",
              },
            }
          );
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
