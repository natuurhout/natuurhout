// Keeps free-plan Supabase projects from pausing, and brings one back if it
// paused anyway. Run daily by .github/workflows/supabase-keepalive.yml.
//
// Supabase pauses a free project after 7 days without activity. A ping that
// only reaches the API gateway is not reliably counted, so this runs a real
// SQL statement inside the database through the Management API. If a project
// is already paused (status INACTIVE) it requests a restore and exits non-zero
// so the workflow fails loudly instead of "succeeding" against a dead project.
//
// Env:
//   SUPABASE_ACCESS_TOKEN  personal access token (dashboard → Account → Access Tokens)
//   SUPABASE_PROJECT_REFS  one or more project refs, comma or space separated
//   SUPABASE_API_BASE      optional, defaults to https://api.supabase.com (tests point it elsewhere)

const API = (process.env.SUPABASE_API_BASE || "https://api.supabase.com").replace(/\/+$/, "");
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const REFS = (process.env.SUPABASE_PROJECT_REFS || "")
  .split(/[\s,]+/)
  .map((ref) => ref.trim())
  .filter(Boolean);

const HEALTHY = "ACTIVE_HEALTHY";
const PAUSED = "INACTIVE";
// Transitional states: the project is already on its way up, so neither a
// query nor a second restore request would help. Report and check tomorrow.
const IN_PROGRESS = new Set(["COMING_UP", "RESTORING", "RESTARTING", "UPGRADING", "RESIZING"]);

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function call(method, path, body, attempt = 1) {
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "natuurhout-supabase-keepalive",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    if (attempt < 3) return retry(method, path, body, attempt, error.message);
    throw new ApiError(`${method} ${path} failed: ${error.message}`, 0);
  }

  // 429 and 5xx are worth another try; 4xx (bad token, unknown ref) are not.
  if ((response.status === 429 || response.status >= 500) && attempt < 3) {
    return retry(method, path, body, attempt, `HTTP ${response.status}`);
  }

  const text = await response.text();
  if (!response.ok) {
    const hint =
      response.status === 401 ? " (token missing, revoked or expired)" :
      response.status === 403 ? " (token has no access to this project)" :
      response.status === 404 ? " (no project with this ref)" : "";
    throw new ApiError(`${method} ${path} → HTTP ${response.status}${hint}: ${text.slice(0, 300)}`, response.status);
  }
  return text ? JSON.parse(text) : null;
}

async function retry(method, path, body, attempt, reason) {
  const wait = 5_000 * attempt;
  console.log(`  ${method} ${path}: ${reason}, retrying in ${wait / 1000}s`);
  await new Promise((resolve) => setTimeout(resolve, wait));
  return call(method, path, body, attempt + 1);
}

async function keepAlive(ref) {
  const project = await call("GET", `/v1/projects/${ref}`);
  const name = project?.name ? `${project.name} (${ref})` : ref;
  const status = project?.status ?? "UNKNOWN";
  console.log(`${name}: status ${status}`);

  if (status === PAUSED) {
    await call("POST", `/v1/projects/${ref}/restore`);
    return { ref, ok: false, note: `was PAUSED — restore requested. It should be back within a few minutes.` };
  }

  if (IN_PROGRESS.has(status)) {
    return { ref, ok: true, note: `${status}, already coming up — nothing to do` };
  }

  // A real round trip through Postgres: this is the activity that counts.
  const rows = await call("POST", `/v1/projects/${ref}/database/query`, {
    query: "select now() as pinged_at",
  });
  const pingedAt = Array.isArray(rows) ? rows[0]?.pinged_at : undefined;
  if (!pingedAt) {
    return { ref, ok: false, note: `database query returned no row: ${JSON.stringify(rows).slice(0, 200)}` };
  }

  if (status !== HEALTHY) {
    return { ref, ok: false, note: `database answered at ${pingedAt}, but status is ${status}` };
  }
  return { ref, ok: true, note: `database answered at ${pingedAt}` };
}

async function main() {
  if (!TOKEN) throw new Error("SUPABASE_ACCESS_TOKEN is not set.");
  if (!REFS.length) throw new Error("SUPABASE_PROJECT_REFS is not set.");

  const results = [];
  for (const ref of REFS) {
    try {
      results.push(await keepAlive(ref));
    } catch (error) {
      results.push({ ref, ok: false, note: error.message });
    }
  }

  console.log("");
  for (const { ref, ok, note } of results) console.log(`${ok ? "OK  " : "FAIL"} ${ref}: ${note}`);

  // The workflow reads this to write the alert issue.
  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = ["| Project | Result | Detail |", "|---|---|---|"];
    for (const { ref, ok, note } of results) lines.push(`| \`${ref}\` | ${ok ? "✅" : "❌"} | ${note.replace(/\|/g, "\\|")} |`);
    const { appendFileSync } = await import("node:fs");
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`);
  }

  if (results.some((result) => !result.ok)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
