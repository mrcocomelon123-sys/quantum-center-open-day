import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { INITIAL_PROJECTS, type Project } from "./lib/projects-store";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;
let memoryProjects: Project[] | null = null;

async function loadStoredProjects(): Promise<Project[]> {
  if (memoryProjects !== null) {
    return memoryProjects;
  }
  try {
    const fs = await import("node:fs/promises");
    const raw = await fs.readFile("/tmp/quantum_projects_store.json", "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryProjects = parsed;
      return parsed;
    }
  } catch {
    // Use initial projects if /tmp file does not exist yet
  }
  memoryProjects = INITIAL_PROJECTS;
  return memoryProjects;
}

async function persistStoredProjects(projects: Project[]): Promise<void> {
  memoryProjects = projects;
  try {
    const fs = await import("node:fs/promises");
    await fs.writeFile("/tmp/quantum_projects_store.json", JSON.stringify(projects), "utf-8");
  } catch {
    // Ignore fs errors in environments without /tmp write access
  }
}

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
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
          const projects = await loadStoredProjects();
          return new Response(JSON.stringify({ projects }), {
            status: 200,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          });
        }
        if (request.method === "POST") {
          const body = (await request.json()) as { projects?: Project[] };
          if (body && Array.isArray(body.projects)) {
            await persistStoredProjects(body.projects);
            return new Response(JSON.stringify({ ok: true, count: body.projects.length }), {
              status: 200,
              headers: { "content-type": "application/json; charset=utf-8" },
            });
          }
          return new Response(JSON.stringify({ error: "Invalid payload" }), {
            status: 400,
            headers: { "content-type": "application/json; charset=utf-8" },
          });
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
