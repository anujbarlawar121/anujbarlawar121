import { mkdir, writeFile } from "node:fs/promises";

const token = process.env.GITHUB_TOKEN;
const owner = process.env.PROFILE_USERNAME || process.env.GITHUB_REPOSITORY_OWNER;

if (!token) {
  throw new Error("GITHUB_TOKEN is required.");
}

if (!owner) {
  throw new Error("PROFILE_USERNAME or GITHUB_REPOSITORY_OWNER is required.");
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "User-Agent": "Codex-Profile-Generator",
  "X-GitHub-Api-Version": "2022-11-28",
};

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${response.status} for ${path}: ${text}`);
  }
  return response.json();
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

async function getAllRepos() {
  const repos = [];
  let page = 1;
  while (true) {
    const chunk = await github(`/users/${owner}/repos?per_page=100&page=${page}&type=owner&sort=updated`);
    repos.push(...chunk);
    if (chunk.length < 100) {
      break;
    }
    page += 1;
  }
  return repos;
}

function renderStatsSvg(stats) {
  const updated = escapeXml(stats.updatedAt);
  const login = escapeXml(stats.login);
  const topLanguageNames = stats.topLanguages.slice(0, 4).map((item) => item.name).join("  //  ") || "No language data yet";
  return `<svg width="900" height="320" viewBox="0 0 900 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="statsBg" x1="0" y1="0" x2="900" y2="320" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#06111F"/>
      <stop offset="1" stop-color="#120A1F"/>
    </linearGradient>
    <linearGradient id="statsAccent" x1="36" y1="0" x2="864" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#00D9FF"/>
      <stop offset="1" stop-color="#8B5CF6"/>
    </linearGradient>
  </defs>
  <rect width="900" height="320" rx="28" fill="url(#statsBg)"/>
  <rect x="18" y="18" width="864" height="284" rx="24" fill="#0A1326" fill-opacity="0.84" stroke="url(#statsAccent)" stroke-opacity="0.52"/>
  <text x="42" y="56" fill="#8BE9FF" font-family="'Segoe UI', Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3">PUBLIC REPOSITORY SNAPSHOT</text>
  <text x="42" y="88" fill="#9BB7E7" font-family="Consolas, 'Courier New', monospace" font-size="15">Public GitHub data for ${login} // Updated ${updated}</text>

  <g>
    <rect x="42" y="116" width="186" height="72" rx="18" fill="#09182C" stroke="#00D9FF" stroke-opacity="0.38"/>
    <text x="60" y="143" fill="#85A6D5" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="600">PUBLIC REPOS</text>
    <text x="60" y="172" fill="#F5F7FF" font-family="'Segoe UI', Arial, sans-serif" font-size="28" font-weight="800">${formatNumber(stats.publicRepos)}</text>
  </g>
  <g>
    <rect x="244" y="116" width="186" height="72" rx="18" fill="#101227" stroke="#8B5CF6" stroke-opacity="0.38"/>
    <text x="262" y="143" fill="#A78BFA" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="600">ORIGINAL REPOS</text>
    <text x="262" y="172" fill="#F5F7FF" font-family="'Segoe UI', Arial, sans-serif" font-size="28" font-weight="800">${formatNumber(stats.originalRepos)}</text>
  </g>
  <g>
    <rect x="446" y="116" width="186" height="72" rx="18" fill="#09182C" stroke="#14F195" stroke-opacity="0.38"/>
    <text x="464" y="143" fill="#7DF6C8" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="600">FORKED REPOS</text>
    <text x="464" y="172" fill="#F5F7FF" font-family="'Segoe UI', Arial, sans-serif" font-size="28" font-weight="800">${formatNumber(stats.forkedRepos)}</text>
  </g>
  <g>
    <rect x="648" y="116" width="210" height="72" rx="18" fill="#101227" stroke="#00D9FF" stroke-opacity="0.38"/>
    <text x="666" y="143" fill="#85A6D5" font-family="'Segoe UI', Arial, sans-serif" font-size="14" font-weight="600">LANGUAGES</text>
    <text x="666" y="172" fill="#F5F7FF" font-family="'Segoe UI', Arial, sans-serif" font-size="28" font-weight="800">${formatNumber(stats.topLanguages.length)}</text>
  </g>

  <g>
    <rect x="42" y="206" width="816" height="74" rx="20" fill="#0A172B" stroke="#224A70"/>
    <text x="62" y="234" fill="#8BE9FF" font-family="'Segoe UI', Arial, sans-serif" font-size="16" font-weight="700">TOP LANGUAGES</text>
    <text fill="#D7E7FF" font-family="Consolas, 'Courier New', monospace" font-size="15">
      <tspan x="62" y="260">${escapeXml(topLanguageNames)}</tspan>
    </text>
  </g>
</svg>`;
}

function renderLanguagesSvg(stats) {
  const total = stats.topLanguages.reduce((sum, item) => sum + item.bytes, 0) || 1;
  const rows = stats.topLanguages
    .slice(0, 5)
    .map((item, index) => {
      const y = 120 + index * 34;
      const percent = (item.bytes / total) * 100;
      const width = Math.max(24, Math.round((percent / 100) * 300));
      const colors = ["#00D9FF", "#8B5CF6", "#14F195", "#38BDF8", "#F472B6"];
      const color = colors[index % colors.length];
      return `
  <text x="44" y="${y}" fill="#DCEBFF" font-family="'Segoe UI', Arial, sans-serif" font-size="15" font-weight="700">${escapeXml(item.name)}</text>
  <rect x="250" y="${y - 14}" width="300" height="16" rx="8" fill="#112038"/>
  <rect x="250" y="${y - 14}" width="${width}" height="16" rx="8" fill="${color}"/>
  <text x="566" y="${y}" fill="#9BB7E7" font-family="Consolas, 'Courier New', monospace" font-size="14">${percent.toFixed(1)}%</text>`;
    })
    .join("");

  return `<svg width="700" height="320" viewBox="0 0 700 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="langBg" x1="0" y1="0" x2="700" y2="320" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#06111F"/>
      <stop offset="1" stop-color="#0E1627"/>
    </linearGradient>
  </defs>
  <rect width="700" height="320" rx="28" fill="url(#langBg)"/>
  <rect x="18" y="18" width="664" height="284" rx="24" fill="#0A1326" fill-opacity="0.84" stroke="#00D9FF" stroke-opacity="0.42"/>
  <text x="42" y="56" fill="#8BE9FF" font-family="'Segoe UI', Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3">LANGUAGES IN PUBLIC REPOS</text>
  <text x="42" y="82" fill="#9BB7E7" font-family="Consolas, 'Courier New', monospace" font-size="14">Based on GitHub language data for ${escapeXml(stats.login)}</text>
  ${rows}
</svg>`;
}

function renderRepoOverviewSvg(stats) {
  const items = [
    { label: "Public Repos", value: formatNumber(stats.publicRepos), note: "visible repositories" },
    { label: "Original Repos", value: formatNumber(stats.originalRepos), note: "not forks" },
    { label: "Forked Repos", value: formatNumber(stats.forkedRepos), note: "public forks" },
    { label: "Languages", value: formatNumber(stats.topLanguages.length), note: "detected by GitHub" },
  ];

  const cards = items
    .map((item, index) => {
      const x = 36 + index * 386;
      const accent = ["#00D9FF", "#8B5CF6", "#14F195", "#F472B6"][index];
      return `
  <g>
    <rect x="${x}" y="76" width="350" height="188" rx="24" fill="#0A1326" fill-opacity="0.84" stroke="${accent}" stroke-opacity="0.42"/>
    <path d="M${x + 38} 110H${x + 112}L${x + 132} 130L${x + 112} 150H${x + 38}L${x + 18} 130L${x + 38} 110Z" fill="#111D35" stroke="${accent}" stroke-opacity="0.56"/>
    <text x="${x + 75}" y="139" fill="#F5F7FF" font-family="'Segoe UI', Arial, sans-serif" font-size="26" font-weight="800" text-anchor="middle">${escapeXml(item.value)}</text>
    <text x="${x + 150}" y="126" fill="${accent}" font-family="'Segoe UI', Arial, sans-serif" font-size="16" font-weight="700">${escapeXml(item.label.toUpperCase())}</text>
    <text x="${x + 150}" y="152" fill="#A4C0EA" font-family="Consolas, 'Courier New', monospace" font-size="17">${escapeXml(item.note)}</text>
  </g>`;
    })
    .join("");

  return `<svg width="1600" height="320" viewBox="0 0 1600 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="repoOverviewBg" x1="0" y1="0" x2="1600" y2="320" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#06111F"/>
      <stop offset="1" stop-color="#120A1F"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="320" rx="28" fill="url(#repoOverviewBg)"/>
  <text x="38" y="46" fill="#8BE9FF" font-family="'Segoe UI', Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3">PUBLIC REPO OVERVIEW</text>
  <text x="38" y="68" fill="#9BB7E7" font-family="Consolas, 'Courier New', monospace" font-size="14">Counts below come from public repository metadata, not vanity profile metrics.</text>
  ${cards}
</svg>`;
}

async function main() {
  const user = await github(`/users/${owner}`);
  const repos = await getAllRepos();

  const publicRepos = Number(user.public_repos || 0);
  const originalRepos = repos.filter((repo) => !repo.fork).length;
  const forkedRepos = repos.filter((repo) => repo.fork).length;

  const languageTotals = new Map();
  for (const repo of repos) {
    if (repo.fork) {
      continue;
    }
    try {
      const languageData = await github(new URL(repo.languages_url).pathname);
      for (const [language, bytes] of Object.entries(languageData)) {
        languageTotals.set(language, (languageTotals.get(language) || 0) + Number(bytes));
      }
    } catch {
      // Ignore per-repo language errors so generation keeps moving.
    }
  }

  const topLanguages = Array.from(languageTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, bytes]) => ({ name, bytes }));

  const stats = {
    login: user.login,
    publicRepos,
    originalRepos,
    forkedRepos,
    topLanguages,
    updatedAt: new Date().toISOString().slice(0, 10),
  };

  await mkdir("assets/generated", { recursive: true });
  await writeFile("assets/generated/github-stats.svg", renderStatsSvg(stats), "utf8");
  await writeFile("assets/generated/top-languages.svg", renderLanguagesSvg(stats), "utf8");
  await writeFile("assets/generated/repo-overview.svg", renderRepoOverviewSvg(stats), "utf8");
}

await main();
