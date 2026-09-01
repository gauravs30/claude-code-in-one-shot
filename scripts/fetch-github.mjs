#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Build-time GitHub data fetch.
//
//   node scripts/fetch-github.mjs        (or: npm run fetch)
//
// Reads   content/projects.yml   (the curated allowlist)
// Calls   api.github.com          (unauthenticated, or with $GITHUB_TOKEN)
// Writes  site/data/projects.json
//
// On any network/API failure the existing site/data/projects.json is left
// untouched and the process still exits 0, so Docker builds stay reproducible
// offline.  Requires Node 18.14+ (built-in fetch). No npm dependencies.
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OWNER = "gauravs30";
const CURATED_FILE = join(ROOT, "content", "projects.yml");
const OUT_FILE = join(ROOT, "site", "data", "projects.json");
const TOKEN = process.env.GITHUB_TOKEN?.trim();

// --- tiny YAML reader -------------------------------------------------------
// Handles only what content/projects.yml uses: a top-level `projects:` key,
// a list of maps ("- key: value"), scalar values (quoted/bare string, bool,
// number) and inline arrays (["a", "b"]). Comments and blank lines ignored.
function parseCuratedYaml(text) {
  const lines = text.split(/\r?\n/);
  const items = [];
  let cur = null;
  let inProjects = false;

  const coerce = (raw) => {
    let v = raw.trim();
    if (v === "" ) return "";
    if (v.startsWith("[") && v.endsWith("]")) {
      return v
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }
    if (/^(true|false)$/i.test(v)) return v.toLowerCase() === "true";
    if (/^-?\d+$/.test(v)) return Number(v);
    return v.replace(/^["']|["']$/g, "");
  };

  for (let line of lines) {
    const stripped = line.replace(/\s+#.*$/, "").replace(/^\s*#.*$/, "");
    if (!stripped.trim()) continue;

    if (/^projects:\s*$/.test(stripped.trim())) { inProjects = true; continue; }
    if (!inProjects) continue;

    const listMatch = stripped.match(/^(\s*)-\s+(.*)$/);
    if (listMatch) {
      if (cur) items.push(cur);
      cur = {};
      const rest = listMatch[2];
      const kv = rest.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
      if (kv) cur[kv[1]] = coerce(kv[2]);
      continue;
    }

    const kv = stripped.match(/^\s+([A-Za-z0-9_]+):\s*(.*)$/);
    if (kv && cur) cur[kv[1]] = coerce(kv[2]);
  }
  if (cur) items.push(cur);
  return items;
}

// --- GitHub API ------------------------------------------------------------
async function gh(path) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": `${OWNER}-portfolio-build`,
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) {
    throw new Error(`GitHub ${path} -> ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function fetchRepo(name) {
  const slug = name.includes("/") ? name : `${OWNER}/${name}`;
  const repo = await gh(`/repos/${slug}`);
  let languages = {};
  try {
    languages = await gh(`/repos/${slug}/languages`);
  } catch {
    /* languages are best-effort */
  }
  return {
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description || "",
    url: repo.html_url,
    homepage: repo.homepage || "",
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    language: repo.language || Object.keys(languages)[0] || "",
    languages: Object.keys(languages),
    topics: repo.topics || [],
    pushed_at: repo.pushed_at || null,
    archived: !!repo.archived,
  };
}

// --- main ----------------------------------------------------------------
async function main() {
  const curated = parseCuratedYaml(readFileSync(CURATED_FILE, "utf8")).filter(
    (e) => e && e.repo && e.hide !== true,
  );
  if (curated.length === 0) {
    console.warn("[fetch-github] no repos in content/projects.yml — nothing to do");
    return;
  }
  console.log(`[fetch-github] ${curated.length} curated repo(s); token: ${TOKEN ? "yes" : "no"}`);

  const projects = [];
  for (const entry of curated) {
    try {
      const data = await fetchRepo(entry.repo);
      projects.push({
        ...data,
        description: entry.blurb || data.description,
        homepage: entry.homepage || data.homepage,
        tags: entry.tags && entry.tags.length ? entry.tags : data.topics,
        featured: entry.featured === true,
      });
      console.log(`  ok  ${data.full_name}`);
    } catch (err) {
      console.warn(`  skip ${entry.repo}: ${err.message}`);
      throw err; // bail to the offline-safe fallback below
    }
  }

  projects.sort((a, b) => (b.featured === true) - (a.featured === true));

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(
    OUT_FILE,
    JSON.stringify({ generatedAt: new Date().toISOString(), owner: OWNER, projects }, null, 2) + "\n",
  );
  console.log(`[fetch-github] wrote ${OUT_FILE} (${projects.length} projects)`);
}

main().catch((err) => {
  console.warn(`[fetch-github] fetch failed: ${err.message}`);
  if (existsSync(OUT_FILE)) {
    console.warn("[fetch-github] keeping existing site/data/projects.json — continuing");
  } else {
    console.warn("[fetch-github] no existing projects.json; writing an empty placeholder");
    mkdirSync(dirname(OUT_FILE), { recursive: true });
    writeFileSync(
      OUT_FILE,
      JSON.stringify({ generatedAt: null, owner: OWNER, projects: [] }, null, 2) + "\n",
    );
  }
  process.exit(0);
});
