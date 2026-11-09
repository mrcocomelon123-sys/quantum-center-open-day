import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { INITIAL_PROJECTS, type Project } from "./lib/projects-store";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

type StoredState = {
  projects: Project[];
  pendingProjects: Project[];
};

let serverEntryPromise: Promise<ServerEntry> | undefined;
let memoryState: StoredState | null = null;
const TMP_FILE = "/tmp/quantum_projects_store_v4.json";

async function loadStoredState(): Promise<StoredState> {
  if (memoryState !== null) {
    return memoryState;
  }
  try {
    const fs = await import("node:fs/promises");
    const raw = await fs.readFile(TMP_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.projects)) {
      memoryState = {
        projects: parsed.projects,
        pendingProjects: Array.isArray(parsed.pendingProjects) ? parsed.pendingProjects : [],
      };
      return memoryState;
    }
  } catch {
    // Use initial projects if /tmp file does not exist yet
  }
  memoryState = {
    projects: INITIAL_PROJECTS,
    pendingProjects: [],
  };
  return memoryState;
}

async function persistStoredState(state: StoredState): Promise<void> {
  memoryState = state;
  try {
    const fs = await import("node:fs/promises");
    await fs.writeFile(TMP_FILE, JSON.stringify(state), "utf-8");
  } catch {
    // Ignore fs errors in environments without /tmp write access
  }
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
          const state = await loadStoredState();
          return new Response(JSON.stringify(state), {
            status: 200,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          });
        }
        if (request.method === "POST") {
          const body = (await request.json()) as {
            projects?: Project[];
            pendingProjects?: Project[];
          };
          const current = await loadStoredState();
          const nextState: StoredState = {
            projects: Array.isArray(body?.projects) ? body.projects : current.projects,
            pendingProjects: Array.isArray(body?.pendingProjects)
              ? body.pendingProjects
              : current.pendingProjects,
          };
          await persistStoredState(nextState);
          return new Response(
            JSON.stringify({
              ok: true,
              count: nextState.projects.length,
              pendingCount: nextState.pendingProjects.length,
            }),
            {
              status: 200,
              headers: { "content-type": "application/json; charset=utf-8" },
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
