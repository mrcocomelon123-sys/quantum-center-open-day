import "./lib/error-capture";
import zlib from "node:zlib";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  INITIAL_PROJECTS,
  INITIAL_PENDING_PROJECTS,
  LIVE_NOTIFY_POST_URL,
  type Project,
  type StoredState,
} from "./lib/projects-store";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

interface CloudDelta {
  customProjects: Project[];
  pendingProjects: Project[];
  deletedIds: string[];
  rejectedIds: string[];
  version: number;
  updatedAt: number;
}

let serverEntryPromise: Promise<ServerEntry> | undefined;
let memoryState: StoredState | null = null;
let lastCloudCheckMs = 0;
let lastRefreshPostMs = 0;

const TMP_FILE = "/tmp/quantum_projects_store_v7.json";
const NTFY_STATE_TOPIC_URL = "https://ntfy.sh/hdqc_state_stream_v7";
const NTFY_IMG_TOPIC_URL = "https://ntfy.sh/hdqc_img_blobs_v7";
const KV_BACKUP_SET_URL =
  "https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/rqpv286a/hdqc_v7_backup";
const KV_BACKUP_GET_URL =
  "https://keyvalue.immanuel.co/api/KeyVal/GetValue/rqpv286a/hdqc_v7_backup";

const initialProjectsMap = new Map<string, Project>(INITIAL_PROJECTS.map((p) => [p.id, p]));

function createDefaultState(): StoredState {
  return {
    projects: [...INITIAL_PROJECTS],
    pendingProjects: [...INITIAL_PENDING_PROJECTS],
    deletedIds: [],
    rejectedIds: [],
    version: 1,
    updatedAt: 1794566000000,
  };
}

function reconstructStateFromDelta(delta: Partial<CloudDelta>): StoredState {
  const deletedIds = Array.isArray(delta.deletedIds)
    ? Array.from(new Set(delta.deletedIds))
    : [];
  const rejectedIds = Array.isArray(delta.rejectedIds)
    ? Array.from(new Set(delta.rejectedIds))
    : [];
  const deletedSet = new Set(deletedIds);
  const rejectedSet = new Set(rejectedIds);

  const customProjects = Array.isArray(delta.customProjects) ? delta.customProjects : [];
  const customMap = new Map<string, Project>();
  const finalProjects: Project[] = [];

  // First put custom/newly added projects in order
  for (const cp of customProjects) {
    if (cp && cp.id && !deletedSet.has(cp.id)) {
      customMap.set(cp.id, cp);
      if (!initialProjectsMap.has(cp.id)) {
        finalProjects.push(cp);
      }
    }
  }

  // Then include INITIAL_PROJECTS (using edited version if present in customMap)
  for (const initProj of INITIAL_PROJECTS) {
    if (deletedSet.has(initProj.id)) continue;
    const edited = customMap.get(initProj.id);
    finalProjects.push(edited || initProj);
  }

  const approvedIds = new Set(finalProjects.map((p) => p.id));
  const rawPending = Array.isArray(delta.pendingProjects) ? delta.pendingProjects : [];
  const finalPending: Project[] = [];
  const seenPending = new Set<string>();

  for (const pp of rawPending) {
    if (
      pp &&
      pp.id &&
      !seenPending.has(pp.id) &&
      !deletedSet.has(pp.id) &&
      !rejectedSet.has(pp.id) &&
      !approvedIds.has(pp.id)
    ) {
      seenPending.add(pp.id);
      finalPending.push(pp);
    }
  }

  return {
    projects: finalProjects,
    pendingProjects: finalPending,
    deletedIds,
    rejectedIds,
    version: typeof delta.version === "number" ? delta.version : 1,
    updatedAt: typeof delta.updatedAt === "number" ? delta.updatedAt : Date.now(),
  };
}

function extractDeltaFromState(state: StoredState): CloudDelta {
  const customProjects: Project[] = [];
  for (const p of state.projects) {
    const initP = initialProjectsMap.get(p.id);
    if (!initP) {
      customProjects.push(p);
    } else if (
      p.title !== initP.title ||
      p.supervisor !== initP.supervisor ||
      p.description !== initP.description ||
      p.linkUrl !== initP.linkUrl ||
      p.imageUrl !== initP.imageUrl ||
      p.pdfUrl !== initP.pdfUrl ||
      p.prerequisites !== initP.prerequisites ||
      p.references !== initP.references
    ) {
      customProjects.push(p);
    }
  }

  return {
    customProjects,
    pendingProjects: state.pendingProjects,
    deletedIds: Array.from(new Set(state.deletedIds)),
    rejectedIds: Array.from(new Set(state.rejectedIds)),
    version: state.version,
    updatedAt: state.updatedAt,
  };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 4500
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function externalizeDataUrlImage(imageUrl?: string): Promise<string | undefined> {
  if (!imageUrl) return undefined;
  if (!imageUrl.startsWith("data:image/")) return imageUrl;

  const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return undefined;

  const mimeType = match[1];
  const base64Data = match[2];
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  const binaryBuffer = Buffer.from(base64Data, "base64");
  const blob = new Blob([binaryBuffer], { type: mimeType });
  const filename = `project-${Date.now()}.${ext}`;

  // Upload to 3 independent hosts in parallel and pick the best permanent/long-lived URL
  const uploadCatbox = async (): Promise<string> => {
    const fd = new FormData();
    fd.append("reqtype", "fileupload");
    fd.append("fileToUpload", blob, filename);
    const res = await fetchWithTimeout(
      "https://catbox.moe/user/api.php",
      { method: "POST", body: fd },
      5000
    );
    if (!res.ok) throw new Error("catbox failed");
    const url = (await res.text()).trim();
    if (!url.startsWith("https://")) throw new Error("invalid catbox url");
    return url;
  };

  const uploadLitterbox = async (): Promise<string> => {
    const fd = new FormData();
    fd.append("reqtype", "fileupload");
    fd.append("time", "72h");
    fd.append("fileToUpload", blob, filename);
    const res = await fetchWithTimeout(
      "https://litterbox.catbox.moe/resources/internals/api.php",
      { method: "POST", body: fd },
      4500
    );
    if (!res.ok) throw new Error("litterbox failed");
    const url = (await res.text()).trim();
    if (!url.startsWith("https://")) throw new Error("invalid litterbox url");
    return url;
  };

  const uploadNtfyImage = async (): Promise<string> => {
    const res = await fetchWithTimeout(
      NTFY_IMG_TOPIC_URL,
      {
        method: "PUT",
        headers: { Filename: filename },
        body: binaryBuffer,
      },
      4500
    );
    if (!res.ok) throw new Error("ntfy image failed");
    const j = (await res.json()) as { attachment?: { url?: string } };
    if (!j?.attachment?.url) throw new Error("no ntfy attachment url");
    return j.attachment.url;
  };

  const results = await Promise.allSettled([
    uploadCatbox(),
    uploadLitterbox(),
    uploadNtfyImage(),
  ]);

  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      return r.value;
    }
  }

  return undefined;
}

async function sanitizeProjectImages(proj: Project): Promise<Project> {
  if (proj.imageUrl && proj.imageUrl.startsWith("data:image/")) {
    const extUrl = await externalizeDataUrlImage(proj.imageUrl);
    return {
      ...proj,
      imageUrl: extUrl,
    };
  }
  return proj;
}

function compressDelta(delta: CloudDelta): string {
  const json = JSON.stringify(delta);
  return zlib.deflateRawSync(Buffer.from(json, "utf-8")).toString("base64");
}

function decompressDelta(b64: string): CloudDelta | null {
  try {
    const raw = zlib.inflateRawSync(Buffer.from(b64, "base64")).toString("utf-8");
    return JSON.parse(raw) as CloudDelta;
  } catch {
    return null;
  }
}

async function writeNtfyInlineState(delta: CloudDelta): Promise<void> {
  const compressed = compressDelta(delta);
  const MAX_CHUNK = 3200;

  if (compressed.length <= MAX_CHUNK) {
    const msg = `V7_SINGLE:${delta.version}:${delta.updatedAt}:${compressed}`;
    await fetchWithTimeout(
      NTFY_STATE_TOPIC_URL,
      {
        method: "POST",
        body: msg,
      },
      4000
    );
  } else {
    const chunks: string[] = [];
    for (let i = 0; i < compressed.length; i += MAX_CHUNK) {
      chunks.push(compressed.slice(i, i + MAX_CHUNK));
    }
    for (let idx = 0; idx < chunks.length; idx++) {
      const msg = `V7_PART:${delta.version}:${delta.updatedAt}:${idx}:${chunks.length}:${chunks[idx]}`;
      await fetchWithTimeout(
        NTFY_STATE_TOPIC_URL,
        {
          method: "POST",
          body: msg,
        },
        4000
      );
    }
  }
}

async function writePermanentBackup(delta: CloudDelta): Promise<void> {
  const json = JSON.stringify(delta);
  const blob = new Blob([json], { type: "application/json" });
  let backupUrl = "";

  try {
    const fd = new FormData();
    fd.append("reqtype", "fileupload");
    fd.append("fileToUpload", blob, "delta_v7.json");
    const cbRes = await fetchWithTimeout(
      "https://catbox.moe/user/api.php",
      { method: "POST", body: fd },
      4500
    );
    if (cbRes.ok) {
      const txt = (await cbRes.text()).trim();
      if (txt.startsWith("https://")) backupUrl = txt;
    }
  } catch {
    // ignore catbox error
  }

  if (!backupUrl) {
    try {
      const fd = new FormData();
      fd.append("reqtype", "fileupload");
      fd.append("time", "72h");
      fd.append("fileToUpload", blob, "delta_v7.json");
      const lbRes = await fetchWithTimeout(
        "https://litterbox.catbox.moe/resources/internals/api.php",
        { method: "POST", body: fd },
        4000
      );
      if (lbRes.ok) {
        const txt = (await lbRes.text()).trim();
        if (txt.startsWith("https://")) backupUrl = txt;
      }
    } catch {
      // ignore litterbox error
    }
  }

  if (backupUrl) {
    try {
      const encoded = Buffer.from(backupUrl, "utf-8").toString("base64url");
      await fetchWithTimeout(`${KV_BACKUP_SET_URL}/${encoded}`, { method: "POST" }, 3500);
    } catch {
      // ignore kv pointer error
    }
  }
}

async function readCloudDelta(): Promise<CloudDelta | null> {
  // 1. Primary: Read inline text messages from ntfy.sh in ONE single GET request
  try {
    const pollRes = await fetchWithTimeout(
      `${NTFY_STATE_TOPIC_URL}/json?poll=1&since=all`,
      { cache: "no-store" },
      3500
    );
    if (pollRes.ok) {
      const text = await pollRes.text();
      const lines = text.trim().split("\n").filter(Boolean);

      let bestSingle: { version: number; updatedAt: number; b64: string; timeSec: number } | null =
        null;
      const multiParts = new Map<
        string,
        { version: number; updatedAt: number; total: number; parts: Map<number, string>; timeSec: number }
      >();

      for (const line of lines) {
        try {
          const ev = JSON.parse(line) as { event?: string; message?: string; time?: number };
          if (ev.event !== "message" || typeof ev.message !== "string") continue;
          const msg = ev.message;
          const timeSec = typeof ev.time === "number" ? ev.time : 0;

          if (msg.startsWith("V7_SINGLE:")) {
            const firstColon = msg.indexOf(":", 10);
            const secondColon = msg.indexOf(":", firstColon + 1);
            if (firstColon > 0 && secondColon > 0) {
              const version = Number(msg.slice(10, firstColon));
              const updatedAt = Number(msg.slice(firstColon + 1, secondColon));
              const b64 = msg.slice(secondColon + 1);
              if (
                !bestSingle ||
                updatedAt > bestSingle.updatedAt ||
                (updatedAt === bestSingle.updatedAt && version >= bestSingle.version)
              ) {
                bestSingle = { version, updatedAt, b64, timeSec };
              }
            }
          } else if (msg.startsWith("V7_PART:")) {
            const parts = msg.split(":");
            if (parts.length >= 6) {
              const version = Number(parts[1]);
              const updatedAt = Number(parts[2]);
              const idx = Number(parts[3]);
              const total = Number(parts[4]);
              const chunk = parts.slice(5).join(":");
              const key = `${version}:${updatedAt}`;
              let entry = multiParts.get(key);
              if (!entry) {
                entry = { version, updatedAt, total, parts: new Map(), timeSec };
                multiParts.set(key, entry);
              }
              entry.parts.set(idx, chunk);
            }
          }
        } catch {
          // ignore malformed line
        }
      }

      let bestCandidate: { updatedAt: number; b64: string; timeSec: number } | null = bestSingle
        ? { updatedAt: bestSingle.updatedAt, b64: bestSingle.b64, timeSec: bestSingle.timeSec }
        : null;

      for (const entry of multiParts.values()) {
        if (entry.parts.size === entry.total) {
          let combined = "";
          let complete = true;
          for (let i = 0; i < entry.total; i++) {
            const c = entry.parts.get(i);
            if (c === undefined) {
              complete = false;
              break;
            }
            combined += c;
          }
          if (complete && (!bestCandidate || entry.updatedAt >= bestCandidate.updatedAt)) {
            bestCandidate = {
              updatedAt: entry.updatedAt,
              b64: combined,
              timeSec: entry.timeSec,
            };
          }
        }
      }

      if (bestCandidate) {
        const delta = decompressDelta(bestCandidate.b64);
        if (delta) {
          // Auto-renew ntfy 12-hour TTL if latest message is > 2 hours old
          const ageSec = Date.now() / 1000 - bestCandidate.timeSec;
          if (
            bestCandidate.timeSec > 0 &&
            ageSec > 7200 &&
            Date.now() - lastRefreshPostMs > 300_000
          ) {
            lastRefreshPostMs = Date.now();
            void writeNtfyInlineState(delta);
          }
          return delta;
        }
      }
    }
  } catch {
    // fallback to permanent backup
  }

  // 2. Fallback: If ntfy stream was empty (e.g. >12h of zero visitors), read permanent backup pointer
  try {
    const kvRes = await fetchWithTimeout(KV_BACKUP_GET_URL, { cache: "no-store" }, 3000);
    if (kvRes.ok) {
      const encoded = (await kvRes.text()).replace(/"/g, "").trim();
      if (encoded) {
        const backupUrl = Buffer.from(encoded, "base64url").toString("utf-8");
        if (backupUrl.startsWith("https://")) {
          const blobRes = await fetchWithTimeout(backupUrl, { cache: "no-store" }, 4000);
          if (blobRes.ok) {
            const delta = (await blobRes.json()) as CloudDelta;
            if (delta && typeof delta === "object") {
              // Re-seed ntfy inline stream so subsequent reads are fast 1-hop
              void writeNtfyInlineState(delta);
              return delta;
            }
          }
        }
      }
    }
  } catch {
    // ignore fallback error
  }

  return null;
}

async function loadStoredState(forceCloud = false): Promise<StoredState> {
  const now = Date.now();
  const cacheTtlMs = forceCloud ? 400 : 1200;

  if (memoryState !== null && now - lastCloudCheckMs < cacheTtlMs) {
    return memoryState;
  }

  if (memoryState === null) {
    try {
      const fs = await import("node:fs/promises");
      const raw = await fs.readFile(TMP_FILE, "utf-8");
      const parsed = JSON.parse(raw) as StoredState;
      if (parsed && Array.isArray(parsed.projects)) {
        memoryState = reconstructStateFromDelta(extractDeltaFromState(parsed));
      }
    } catch {
      // /tmp not written yet on this instance
    }
  }

  lastCloudCheckMs = now;
  const cloudDelta = await readCloudDelta();
  if (cloudDelta) {
    const cloudState = reconstructStateFromDelta(cloudDelta);
    // Keep memoryState only if THIS lambda wrote a newer state within the last 4 seconds
    const localIsVeryRecentWrite =
      memoryState !== null &&
      memoryState.updatedAt > cloudState.updatedAt &&
      now - memoryState.updatedAt < 4000;

    if (!localIsVeryRecentWrite) {
      memoryState = cloudState;
      try {
        const fs = await import("node:fs/promises");
        await fs.writeFile(TMP_FILE, JSON.stringify(memoryState), "utf-8");
      } catch {
        // ignore /tmp error
      }
    }
    return memoryState!;
  }

  if (!memoryState) {
    memoryState = createDefaultState();
  }
  return memoryState;
}

async function persistStoredState(
  nextState: StoredState,
  actionName: string
): Promise<StoredState> {
  const now = Date.now();
  const sanitizedProjects = await Promise.all(nextState.projects.map(sanitizeProjectImages));
  const sanitizedPending = await Promise.all(
    nextState.pendingProjects.map(sanitizeProjectImages)
  );

  const updated: StoredState = reconstructStateFromDelta({
    customProjects: extractDeltaFromState({
      ...nextState,
      projects: sanitizedProjects,
      pendingProjects: sanitizedPending,
    }).customProjects,
    pendingProjects: sanitizedPending,
    deletedIds: nextState.deletedIds,
    rejectedIds: nextState.rejectedIds,
    version: (nextState.version || 1) + 1,
    updatedAt: now,
  });

  memoryState = updated;
  lastCloudCheckMs = now;
  lastRefreshPostMs = now;

  try {
    const fs = await import("node:fs/promises");
    await fs.writeFile(TMP_FILE, JSON.stringify(updated), "utf-8");
  } catch {
    // ignore /tmp errors
  }

  const delta = extractDeltaFromState(updated);

  await Promise.allSettled([
    writeNtfyInlineState(delta),
    writePermanentBackup(delta),
    fetchWithTimeout(
      LIVE_NOTIFY_POST_URL,
      {
        method: "POST",
        body: JSON.stringify({
          action: actionName,
          v: updated.version,
          t: updated.updatedAt,
          pendingCount: updated.pendingProjects.length,
        }),
      },
      2500
    ),
  ]);

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
          const isFresh = url.searchParams.get("fresh") === "1";
          const state = await loadStoredState(isFresh);
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
            rejectedIds = rejectedIds.filter((id) => id !== newPending.id);
            deletedIds = deletedIds.filter((id) => id !== newPending.id);
            if (!pendingProjects.some((p) => p.id === newPending.id)) {
              pendingProjects = [newPending, ...pendingProjects];
            }
          } else if (action === "approve_pending" && typeof body.id === "string") {
            const targetId = body.id;
            const found =
              pendingProjects.find((p) => p.id === targetId) ||
              (body.project as Project | undefined);
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
            const extraDeleted = Array.isArray(body.deletedIds)
              ? (body.deletedIds as string[])
              : [];
            const currentIds = projects.map((p) => p.id);
            const initIds = INITIAL_PROJECTS.map((p) => p.id);
            deletedIds = Array.from(
              new Set([...deletedIds, ...currentIds, ...initIds, ...extraDeleted])
            );
            projects = [];
          } else if (action === "reset_defaults") {
            deletedIds = [];
            projects = [...INITIAL_PROJECTS];
          } else {
            const clientDeleted = Array.isArray(body.deletedIds)
              ? (body.deletedIds as string[])
              : [];
            const clientRejected = Array.isArray(body.rejectedIds)
              ? (body.rejectedIds as string[])
              : [];
            deletedIds = Array.from(new Set([...deletedIds, ...clientDeleted]));
            rejectedIds = Array.from(new Set([...rejectedIds, ...clientRejected]));

            const delSet = new Set(deletedIds);
            const clientProjects = Array.isArray(body.projects)
              ? (body.projects as Project[])
              : [];
            projects = mergeListsById(projects, clientProjects, delSet);

            const approvedSet = new Set(projects.map((p) => p.id));
            const pendExclude = new Set([...rejectedIds, ...deletedIds, ...approvedSet]);
            const clientPending = Array.isArray(body.pendingProjects)
              ? (body.pendingProjects as Project[])
              : [];
            pendingProjects = mergeListsById(pendingProjects, clientPending, pendExclude);
          }

          const saved = await persistStoredState(
            {
              projects,
              pendingProjects,
              deletedIds,
              rejectedIds,
              version: current.version,
              updatedAt: Date.now(),
            },
            action
          );

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
