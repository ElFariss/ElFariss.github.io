const selectors = {
  identityName: document.querySelector("#identity-name"),
  identityUsername: document.querySelector("#identity-username"),
  identityTagline: document.querySelector("#identity-tagline"),
  identitySummary: document.querySelector("#identity-summary"),
  heroImage: document.querySelector("#hero-image"),
  aboutHeadline: document.querySelector("#about-headline"),
  aboutBody: document.querySelector("#about-body"),
  aboutNow: document.querySelector("#about-now"),
  stackGrid: document.querySelector("#stack-grid"),
  projectsGrid: document.querySelector("#projects-grid"),
  metricFollowers: document.querySelector("#metric-followers"),
  metricRepos: document.querySelector("#metric-repos"),
  metricStars: document.querySelector("#metric-stars"),
  metricForks: document.querySelector("#metric-forks"),
  languageBars: document.querySelector("#language-bars"),
  activityList: document.querySelector("#activity-list"),
  contactLinks: document.querySelector("#contact-links"),
  generatedDate: document.querySelector("#generated-date"),
  year: document.querySelector("#year"),
  footerName: document.querySelector("#footer-name")
};

const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact" });
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit"
});

function formatCompact(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return compactNumber.format(value);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return dateFormatter.format(date);
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

function setText(node, value, fallback = "") {
  if (!node) {
    return;
  }
  node.textContent = value ?? fallback;
}

function renderIdentity(config) {
  const identity = config.identity || {};
  setText(selectors.identityName, identity.name || identity.username);
  setText(selectors.identityUsername, `@${identity.username || "unknown"}`);
  setText(selectors.identityTagline, identity.tagline || "");
  setText(selectors.identitySummary, identity.summary || "");
  setText(selectors.footerName, identity.name || identity.username || "");

  if (identity.hero_image && selectors.heroImage) {
    selectors.heroImage.src = identity.hero_image;
  }
}

function renderAbout(config) {
  const about = config.about || {};
  setText(selectors.aboutHeadline, about.headline || "");
  setText(selectors.aboutBody, about.body || "");
  setText(selectors.aboutNow, about.now || "");
}

function renderStack(config) {
  const stack = Array.isArray(config.stack) ? config.stack : [];
  if (!selectors.stackGrid) {
    return;
  }
  selectors.stackGrid.innerHTML = "";

  if (!stack.length) {
    selectors.stackGrid.innerHTML = "<p>No stack items configured.</p>";
    return;
  }

  for (const item of stack) {
    const chip = document.createElement("article");
    chip.className = "stack-item";

    const title = document.createElement("strong");
    title.textContent = item.name || "Unknown";

    const category = document.createElement("span");
    category.textContent = item.category || "Tool";

    chip.append(title, category);
    selectors.stackGrid.appendChild(chip);
  }
}

function normalizeProjects(config, stats) {
  const projectConfig = config.projects || {};
  const manualItems = Array.isArray(projectConfig.items) ? projectConfig.items : [];

  if (projectConfig.mode === "manual" && manualItems.length) {
    return manualItems.map((item) => ({
      name: item.name,
      description: item.description,
      html_url: item.url,
      language: item.language || "-",
      stargazers_count: item.stars || 0,
      forks_count: item.forks || 0
    }));
  }

  const autoLimit = Number.isFinite(projectConfig.auto_limit) ? projectConfig.auto_limit : 6;
  const featured = stats?.repos?.featured || [];
  return featured.slice(0, autoLimit);
}

function renderProjects(config, stats) {
  if (!selectors.projectsGrid) {
    return;
  }

  const projects = normalizeProjects(config, stats);
  selectors.projectsGrid.innerHTML = "";

  if (!projects.length) {
    selectors.projectsGrid.innerHTML = "<p>No featured projects available yet.</p>";
    return;
  }

  for (const project of projects) {
    const card = document.createElement("article");
    card.className = "project-card";

    const title = document.createElement("h3");
    title.textContent = project.name || "Untitled";

    const description = document.createElement("p");
    description.textContent = project.description || "No description provided.";

    const meta = document.createElement("div");
    meta.className = "project-meta";

    const statsText = document.createElement("span");
    const stars = Number(project.stargazers_count) || 0;
    const forks = Number(project.forks_count) || 0;
    const language = project.language || "Unknown";
    statsText.textContent = `${language} | ★ ${stars} | Forks ${forks}`;

    const link = document.createElement("a");
    link.href = project.html_url || "#";
    link.textContent = "Open";
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    meta.append(statsText, link);
    card.append(title, description, meta);
    selectors.projectsGrid.appendChild(card);
  }
}

function renderMetrics(stats) {
  const profile = stats.profile || {};
  const repoStats = stats.repos || {};

  setText(selectors.metricFollowers, formatCompact(profile.followers));
  setText(selectors.metricRepos, formatCompact(profile.public_repos));
  setText(selectors.metricStars, formatCompact(repoStats.total_stars));
  setText(selectors.metricForks, formatCompact(repoStats.total_forks));
}

function renderLanguages(stats) {
  if (!selectors.languageBars) {
    return;
  }
  selectors.languageBars.innerHTML = "";

  const languages = stats?.languages?.top || [];
  if (!languages.length) {
    selectors.languageBars.innerHTML = "<p>No language data available.</p>";
    return;
  }

  for (const language of languages) {
    const row = document.createElement("article");
    row.className = "language-row";

    const rowHeader = document.createElement("header");
    const label = document.createElement("span");
    label.textContent = language.name || "Unknown";
    const percent = document.createElement("span");
    percent.textContent = `${(language.percent || 0).toFixed(1)}%`;
    rowHeader.append(label, percent);

    const track = document.createElement("div");
    track.className = "language-track";

    const fill = document.createElement("div");
    fill.className = "language-fill";
    fill.style.width = `${Math.max(2, Math.min(100, language.percent || 0))}%`;
    track.appendChild(fill);

    row.append(rowHeader, track);
    selectors.languageBars.appendChild(row);
  }
}

function renderActivity(stats) {
  if (!selectors.activityList) {
    return;
  }

  selectors.activityList.innerHTML = "";
  const pushes = stats?.activity?.recent_pushes || [];

  if (!pushes.length) {
    selectors.activityList.innerHTML = "<li>No recent activity available.</li>";
    return;
  }

  for (const push of pushes.slice(0, 8)) {
    const item = document.createElement("li");

    const link = document.createElement("a");
    link.href = push.html_url || "#";
    link.textContent = push.name || "unknown";
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const date = document.createElement("span");
    date.textContent = formatDate(push.pushed_at);

    item.append(link, date);
    selectors.activityList.appendChild(item);
  }
}

function renderContacts(config) {
  if (!selectors.contactLinks) {
    return;
  }

  const contacts = Array.isArray(config.contact) ? config.contact : [];
  selectors.contactLinks.innerHTML = "";

  for (const contact of contacts) {
    if (!contact.url || !contact.label) {
      continue;
    }
    const link = document.createElement("a");
    link.href = contact.url;
    link.textContent = contact.label;

    if (!contact.url.startsWith("mailto:")) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }

    selectors.contactLinks.appendChild(link);
  }
}

function animatePanels() {
  const panels = document.querySelectorAll(".panel");
  panels.forEach((panel, index) => {
    panel.classList.add("reveal");
    panel.style.animationDelay = `${index * 80}ms`;
  });
}

function renderGeneratedDate(stats) {
  const generatedAt = stats?.generated_at;
  setText(selectors.generatedDate, formatDate(generatedAt));
}

function renderYear() {
  const year = new Date().getFullYear();
  setText(selectors.year, String(year));
}

function renderError(message) {
  if (!selectors.projectsGrid) {
    return;
  }

  selectors.projectsGrid.innerHTML = `<p>${message}</p>`;
}

async function boot() {
  try {
    const [config, stats] = await Promise.all([
      loadJson("data/site-config.json"),
      loadJson("data/stats.json")
    ]);

    renderIdentity(config);
    renderAbout(config);
    renderStack(config);
    renderProjects(config, stats);
    renderMetrics(stats);
    renderLanguages(stats);
    renderActivity(stats);
    renderContacts(config);
    renderGeneratedDate(stats);
    renderYear();
    animatePanels();
  } catch (error) {
    console.error(error);
    renderError("Site data is unavailable. Check workflow logs and data generation.");
  }
}

boot();
