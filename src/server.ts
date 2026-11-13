import "./lib/error-capture";

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
const imageMemoryCache = new Map<string, { mime: string; bytes: Uint8Array }>();

const NTFY_STATE_TOPIC_URL = "https://ntfy.sh/hdqc_state_v7_clean";
const KV_BACKUP_SET_URL =
  "https://keyvalue.immanuel.co/api/KeyVal/UpdateValue/rqpv286a/hdqc_v7_state_ver";
const TELEGRAPH_TOKEN = "ec86dd79c2821a23a818aad7447f9de994a843d49f69acbd151e027afe0c";
const TELEGRAPH_MAIN_PATH = "HDQC-Projects-Permanent-Database-v8-11-13";

const initialProjectsMap = new Map<string, Project>(INITIAL_PROJECTS.map((p) => [p.id, p]));

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function createDefaultState(): StoredState {
  return {
    projects: [...INITIAL_PROJECTS],
    pendingProjects: [...INITIAL_PENDING_PROJECTS],
    deletedIds: [],
    rejectedIds: ["pending-mwav7q9d-hzs6", "pending-mwapzaam-np8g", "pending-mwazrlsd-91j0"],
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

  for (const cp of customProjects) {
    if (cp && cp.id && !deletedSet.has(cp.id)) {
      customMap.set(cp.id, cp);
      if (!initialProjectsMap.has(cp.id)) {
        finalProjects.push(cp);
      }
    }
  }

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

async function storePermanentImagePages(dataUrl: string): Promise<string | undefined> {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return undefined;

  const mime = match[1];
  const b64 = match[2];
  const CHUNK_LEN = 45000;
  const chunks: string[] = [];
  for (let i = 0; i < dataUrl.length; i += CHUNK_LEN) {
    chunks.push(dataUrl.slice(i, i + CHUNK_LEN));
  }

  try {
    const paths = await Promise.all(
      chunks.map(async (chunk, idx) => {
        const res = await fetchWithTimeout(
          "https://api.telegra.ph/createPage",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: TELEGRAPH_TOKEN,
              title: `HDQC-IMG-${Date.now()}-${idx}`,
              content: [{ tag: "pre", children: [chunk] }],
            }),
          },
          5000
        );
        if (!res.ok) throw new Error("Telegraph image page HTTP error");
        const j = (await res.json()) as { ok?: boolean; result?: { path?: string } };
        if (!j.ok || !j.result?.path) throw new Error("Telegraph image page failed");
        return j.result.path;
      })
    );

    const tphKey = paths.join(",");
    try {
      imageMemoryCache.set(tphKey, { mime, bytes: base64ToBytes(b64) });
    } catch {
      // ignore memory cache error
    }
    return `/api/projects?tph=${tphKey}`;
  } catch {
    return storeInlineImageChunks(dataUrl);
  }
}

async function loadPermanentImagePages(
  tphKey: string
): Promise<{ mime: string; bytes: Uint8Array } | null> {
  const cached = imageMemoryCache.get(tphKey);
  if (cached) return cached;

  const paths = tphKey
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-zA-Z0-9_-]+$/.test(s));
  if (paths.length === 0 || paths.length > 25) return null;

  try {
    const parts = await Promise.all(
      paths.map(async (p) => {
        const res = await fetchWithTimeout(
          `https://api.telegra.ph/getPage/${p}?return_content=true`,
          {},
          4500
        );
        if (!res.ok) throw new Error("Telegraph getPage failed");
        const j = (await res.json()) as {
          ok?: boolean;
          result?: { content?: Array<{ children?: string[] }> };
        };
        const text = j.result?.content?.[0]?.children?.[0];
        if (!j.ok || typeof text !== "string") throw new Error("Invalid Telegraph image part");
        return text;
      })
    );

    const fullDataUrl = parts.join("");
    const match = fullDataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) return null;
    const result = { mime: match[1], bytes: base64ToBytes(match[2]) };
    imageMemoryCache.set(tphKey, result);
    return result;
  } catch {
    return null;
  }
}

async function storeInlineImageChunks(dataUrl: string): Promise<string | undefined> {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return undefined;

  const mime = match[1];
  const b64 = match[2];
  const imgId =
    "img_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);

  try {
    imageMemoryCache.set(imgId, { mime, bytes: base64ToBytes(b64) });
  } catch {
    // ignore memory cache error
  }

  const CHUNK_LEN = 3400;
  const chunks: string[] = [];
  for (let i = 0; i < b64.length; i += CHUNK_LEN) {
    chunks.push(b64.slice(i, i + CHUNK_LEN));
  }

  const topicUrl = `https://ntfy.sh/hdqc_v7_${imgId}`;
  try {
    const BATCH = 4;
    for (let i = 0; i < chunks.length; i += BATCH) {
      const slice = chunks.slice(i, i + BATCH);
      await Promise.all(
        slice.map((chunk, offset) => {
          const idx = i + offset;
          const body = `IMGPART:${idx}:${chunks.length}:${mime}:${chunk}`;
          return fetchWithTimeout(topicUrl, { method: "POST", body }, 4000);
        })
      );
    }
    return `/api/projects?img=${imgId}`;
  } catch {
    return undefined;
  }
}

async function loadInlineImageChunks(
  imgId: string
): Promise<{ mime: string; bytes: Uint8Array } | null> {
  const cached = imageMemoryCache.get(imgId);
  if (cached) return cached;

  const topicUrl = `https://ntfy.sh/hdqc_v7_${imgId}/json?poll=1&since=all&_=${Date.now()}`;
  try {
    const res = await fetchWithTimeout(
      topicUrl,
      { headers: { "cache-control": "no-cache" } },
      4000
    );
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.trim().split("\n").filter(Boolean);
    let total = 0;
    let mime = "image/jpeg";
    const parts = new Map<number, string>();

    for (const line of lines) {
      try {
        const ev = JSON.parse(line) as { event?: string; message?: string };
        if (ev.event !== "message" || typeof ev.message !== "string") continue;
        if (!ev.message.startsWith("IMGPART:")) continue;
        const first = ev.message.indexOf(":", 8);
        const second = ev.message.indexOf(":", first + 1);
        const third = ev.message.indexOf(":", second + 1);
        if (first > 0 && second > 0 && third > 0) {
          const idx = Number(ev.message.slice(8, first));
          total = Number(ev.message.slice(first + 1, second));
          mime = ev.message.slice(second + 1, third);
          const chunk = ev.message.slice(third + 1);
          parts.set(idx, chunk);
        }
      } catch {
        // ignore line error
      }
    }

    if (total > 0 && parts.size === total) {
      let fullB64 = "";
      for (let i = 0; i < total; i++) {
        const c = parts.get(i);
        if (c === undefined) return null;
        fullB64 += c;
      }
      const result = { mime, bytes: base64ToBytes(fullB64) };
      imageMemoryCache.set(imgId, result);
      return result;
    }
  } catch {
    // ignore fetch error
  }
  return null;
}

async function sanitizeProjectImages(proj: Project): Promise<Project> {
  if (proj.imageUrl && proj.imageUrl.startsWith("data:image/")) {
    const extUrl = await storePermanentImagePages(proj.imageUrl);
    return {
      ...proj,
      imageUrl: extUrl,
    };
  }
  return proj;
}

function encodeDelta(delta: CloudDelta): string {
  return utf8ToBase64(JSON.stringify(delta));
}

function decodeDelta(b64: string): CloudDelta | null {
  try {
    return JSON.parse(base64ToUtf8(b64)) as CloudDelta;
  } catch {
    return null;
  }
}

async function writeTelegraphPermanentState(delta: CloudDelta): Promise<void> {
  const rawJson = JSON.stringify(delta);
  const MAX_PAGE_CHARS = 45000;

  if (rawJson.length <= MAX_PAGE_CHARS) {
    await fetchWithTimeout(
      `https://api.telegra.ph/editPage/${TELEGRAPH_MAIN_PATH}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: TELEGRAPH_TOKEN,
          title: "HDQC Projects Permanent Database v8",
          content: [{ tag: "pre", children: [rawJson] }],
        }),
      },
      4500
    );
  } else {
    const chunks: string[] = [];
    for (let i = 0; i < rawJson.length; i += MAX_PAGE_CHARS) {
      chunks.push(rawJson.slice(i, i + MAX_PAGE_CHARS));
    }
    const extraPaths = await Promise.all(
      chunks.slice(1).map(async (chunk, idx) => {
        const res = await fetchWithTimeout(
          "https://api.telegra.ph/createPage",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: TELEGRAPH_TOKEN,
              title: `HDQC-State-Overflow-${delta.version}-${idx}`,
              content: [{ tag: "pre", children: [chunk] }],
            }),
          },
          4500
        );
        const j = (await res.json()) as { result?: { path?: string } };
        return j.result?.path || "";
      })
    );

    const envelope = JSON.stringify({
      __overflowPaths: extraPaths,
      firstChunk: chunks[0],
    });

    await fetchWithTimeout(
      `https://api.telegra.ph/editPage/${TELEGRAPH_MAIN_PATH}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: TELEGRAPH_TOKEN,
          title: "HDQC Projects Permanent Database v8",
          content: [{ tag: "pre", children: [envelope] }],
        }),
      },
      4500
    );
  }
}

async function readTelegraphPermanentState(): Promise<CloudDelta | null> {
  try {
    const res = await fetchWithTimeout(
      `https://api.telegra.ph/getPage/${TELEGRAPH_MAIN_PATH}?return_content=true&_=${Date.now()}`,
      { headers: { "cache-control": "no-cache" } },
      3500
    );
    if (!res.ok) return null;
    const j = (await res.json()) as {
      ok?: boolean;
      result?: { content?: Array<{ children?: string[] }> };
    };
    const raw = j.result?.content?.[0]?.children?.[0];
    if (!j.ok || typeof raw !== "string") return null;

    const parsed = JSON.parse(raw) as CloudDelta & {
      __overflowPaths?: string[];
      firstChunk?: string;
    };

    if (Array.isArray(parsed.__overflowPaths) && typeof parsed.firstChunk === "string") {
      const restChunks = await Promise.all(
        parsed.__overflowPaths.map(async (p) => {
          const r = await fetchWithTimeout(
            `https://api.telegra.ph/getPage/${p}?return_content=true`,
            {},
            3500
          );
          const rj = (await r.json()) as {
            result?: { content?: Array<{ children?: string[] }> };
          };
          return rj.result?.content?.[0]?.children?.[0] || "";
        })
      );
      return JSON.parse(parsed.firstChunk + restChunks.join("")) as CloudDelta;
    }

    if (typeof parsed.version === "number") {
      return parsed;
    }
  } catch {
    // ignore read error
  }
  return null;
}

async function writeNtfyInlineState(delta: CloudDelta): Promise<void> {
  const encoded = encodeDelta(delta);
  const MAX_CHUNK = 3200;

  if (encoded.length <= MAX_CHUNK) {
    const msg = `V7_SINGLE:${delta.version}:${delta.updatedAt}:${encoded}`;
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
    for (let i = 0; i < encoded.length; i += MAX_CHUNK) {
      chunks.push(encoded.slice(i, i + MAX_CHUNK));
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

  // Record version metadata in keyvalue backup
  try {
    await fetchWithTimeout(
      `${KV_BACKUP_SET_URL}/${delta.version}_${delta.updatedAt}`,
      { method: "POST" },
      2500
    );
  } catch {
    // ignore metadata backup error
  }
}

async function readNtfyInlineState(): Promise<CloudDelta | null> {
  try {
    const pollRes = await fetchWithTimeout(
      `${NTFY_STATE_TOPIC_URL}/json?poll=1&since=all&_=${Date.now()}`,
      { headers: { "cache-control": "no-cache" } },
      3500
    );
    if (pollRes.ok) {
      const text = await pollRes.text();
      const lines = text.trim().split("\n").filter(Boolean);

      let bestSingle: {
        version: number;
        updatedAt: number;
        b64: string;
        timeSec: number;
      } | null = null;
      const multiParts = new Map<
        string,
        {
          version: number;
          updatedAt: number;
          total: number;
          parts: Map<number, string>;
          timeSec: number;
        }
      >();

      for (const line of lines) {
        try {
          const ev = JSON.parse(line) as {
            event?: string;
            message?: string;
            time?: number;
          };
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

      let bestCandidate: { updatedAt: number; b64: string; timeSec: number } | null =
        bestSingle
          ? {
              updatedAt: bestSingle.updatedAt,
              b64: bestSingle.b64,
              timeSec: bestSingle.timeSec,
            }
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
        const delta = decodeDelta(bestCandidate.b64);
        if (delta) {
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
    // ignore read error
  }

  return null;
}

function mergeCloudDeltas(
  tph: CloudDelta | null,
  ntfy: CloudDelta | null
): CloudDelta | null {
  if (!tph && !ntfy) return null;
  if (tph && !ntfy) {
    // Self-heal ntfy stream in background if it expired after 12h
    if (Date.now() - lastRefreshPostMs > 60_000) {
      lastRefreshPostMs = Date.now();
      void writeNtfyInlineState(tph);
    }
    return tph;
  }
  if (!tph && ntfy) {
    if (Date.now() - lastRefreshPostMs > 60_000) {
      lastRefreshPostMs = Date.now();
      void writeTelegraphPermanentState(ntfy);
    }
    return ntfy;
  }

  const primary =
    tph!.updatedAt >= ntfy!.updatedAt ? tph! : ntfy!;
  const secondary = primary === tph! ? ntfy! : tph!;

  const deletedIds = Array.from(new Set(primary.deletedIds || []));
  const rejectedIds = Array.from(new Set(primary.rejectedIds || []));
  const delSet = new Set(deletedIds);

  const customProjects = mergeListsById(
    primary.customProjects || [],
    secondary.customProjects || [],
    delSet
  );

  const approvedSet = new Set([
    ...INITIAL_PROJECTS.filter((p) => !delSet.has(p.id)).map((p) => p.id),
    ...customProjects.map((p) => p.id),
  ]);
  const pendExclude = new Set([...deletedIds, ...rejectedIds, ...approvedSet]);
  const pendingProjects = mergeListsById(
    primary.pendingProjects || [],
    secondary.pendingProjects || [],
    pendExclude
  );

  return {
    customProjects,
    pendingProjects,
    deletedIds,
    rejectedIds,
    version: Math.max(primary.version || 1, secondary.version || 1),
    updatedAt: Math.max(primary.updatedAt || 0, secondary.updatedAt || 0),
  };
}

async function readCloudDelta(): Promise<CloudDelta | null> {
  const [tphDelta, ntfyDelta] = await Promise.all([
    readTelegraphPermanentState(),
    readNtfyInlineState(),
  ]);
  return mergeCloudDeltas(tphDelta, ntfyDelta);
}

async function loadStoredState(forceCloud = false): Promise<StoredState> {
  const now = Date.now();
  const cacheTtlMs = forceCloud ? 300 : 1000;

  if (memoryState !== null && now - lastCloudCheckMs < cacheTtlMs) {
    return memoryState;
  }

  lastCloudCheckMs = now;
  const cloudDelta = await readCloudDelta();
  if (cloudDelta) {
    const cloudState = reconstructStateFromDelta(cloudDelta);
    const localIsVeryRecentWrite =
      memoryState !== null &&
      memoryState.updatedAt > cloudState.updatedAt &&
      now - memoryState.updatedAt < 3500;

    if (!localIsVeryRecentWrite) {
      memoryState = cloudState;
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
  const sanitizedProjects = await Promise.all(
    nextState.projects.map(sanitizeProjectImages)
  );
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

  const delta = extractDeltaFromState(updated);

  await Promise.allSettled([
    writeTelegraphPermanentState(delta),
    writeNtfyInlineState(delta),
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

function mergeListsById(
  primary: Project[],
  secondary: Project[],
  exclude: Set<string>
): Project[] {
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

  console.error(
    consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`)
  );
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
          const tphKey = url.searchParams.get("tph");
          if (tphKey && /^[a-zA-Z0-9_,-]+$/.test(tphKey)) {
            const imgData = await loadPermanentImagePages(tphKey);
            if (!imgData) {
              return new Response("Image not found", { status: 404 });
            }
            return new Response(imgData.bytes, {
              status: 200,
              headers: {
                "content-type": imgData.mime,
                "cache-control":
                  "public, s-maxage=31536000, max-age=31536000, immutable",
              },
            });
          }

          const imgId = url.searchParams.get("img");
          if (imgId && /^img_[a-z0-9_]+$/i.test(imgId)) {
            const imgData = await loadInlineImageChunks(imgId);
            if (!imgData) {
              return new Response("Image not found", { status: 404 });
            }
            return new Response(imgData.bytes, {
              status: 200,
              headers: {
                "content-type": imgData.mime,
                "cache-control":
                  "public, s-maxage=31536000, max-age=31536000, immutable",
              },
            });
          }

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
          const action =
            typeof body.action === "string" ? body.action : "legacy_sync";

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
              projects = [
                approvedProj,
                ...projects.filter((p) => p.id !== targetId),
              ];
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
                p.id === targetId
                  ? { ...p, ...updates, updatedAt: Date.now() }
                  : p
              );
            } else if (fallbackProject) {
              projects = [
                { ...fallbackProject, updatedAt: Date.now() },
                ...projects,
              ];
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
              new Set([
                ...deletedIds,
                ...currentIds,
                ...initIds,
                ...extraDeleted,
              ])
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
            rejectedIds = Array.from(
              new Set([...rejectedIds, ...clientRejected])
            );

            const delSet = new Set(deletedIds);
            const clientProjects = Array.isArray(body.projects)
              ? (body.projects as Project[])
              : [];
            projects = mergeListsById(projects, clientProjects, delSet);

            const approvedSet = new Set(projects.map((p) => p.id));
            const pendExclude = new Set([
              ...rejectedIds,
              ...deletedIds,
              ...approvedSet,
            ]);
            const clientPending = Array.isArray(body.pendingProjects)
              ? (body.pendingProjects as Project[])
              : [];
            pendingProjects = mergeListsById(
              pendingProjects,
              clientPending,
              pendExclude
            );
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
