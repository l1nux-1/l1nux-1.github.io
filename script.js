(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const numberFormat = new Intl.NumberFormat("en-US");
  const estimatedTryHackMeUsers = 8_000_000;

  const profile = {
    username: "l1nux",
    rank: 97,
    badges: 95,
    streak: 52,
    followers: 118,
    completedRooms: 1151,
    level: 21,
    levelHex: "0x15",
    levelTitle: "GRANDMASTER",
  };

  const levelTitles = [
    "NEOPHYTE", "APPRENTICE", "PATHFINDER", "SEEKER", "VISIONARY",
    "VOYAGER", "ADEPT", "HACKER", "MAGE", "WIZARD", "MASTER", "GURU",
    "LEGEND", "GUARDIAN", "TITAN", "SAGE", "VANGUARD", "SHOGUN",
    "ASCENDED", "MYTHIC", "GRANDMASTER",
  ];

  function normalizeStats(payload, source = "local") {
    const raw = payload?.data || payload || {};
    const level = Number(raw.level ?? profile.level);
    const safeLevel = Number.isFinite(level) && level > 0 ? level : profile.level;
    const apiStreak = raw.streak ?? raw.currentStreak ?? raw.streakDays ?? raw.dailyStreak;
    const apiFollowers = raw.followersNumber ?? raw.followersCount ?? raw.followers_count ?? raw.followers;
    const followers = Array.isArray(apiFollowers)
      ? apiFollowers.length
      : Number(apiFollowers ?? profile.followers);

    return {
      username: raw.username || profile.username,
      rank: Number(raw.rank ?? profile.rank),
      badges: Number(raw.badgesNumber ?? raw.badges ?? profile.badges),
      streak: Number(apiStreak ?? profile.streak),
      followers: Number.isFinite(followers) ? followers : profile.followers,
      completedRooms: Number(raw.completedRoomsNumber ?? raw.completedRooms ?? raw.rooms ?? profile.completedRooms),
      level: safeLevel,
      levelHex: raw.levelHex || `0x${safeLevel.toString(16).toUpperCase()}`,
      levelTitle: raw.levelTitle || levelTitles[safeLevel - 1] || profile.levelTitle,
      updatedAt: raw.updatedAt || new Date().toISOString(),
      source,
    };
  }

  function renderStats(stats) {
    profile.rank = stats.rank;
    profile.badges = stats.badges;
    profile.streak = stats.streak;
    profile.followers = stats.followers;
    profile.completedRooms = stats.completedRooms;
    profile.level = stats.level;
    profile.levelHex = stats.levelHex;
    profile.levelTitle = stats.levelTitle;

    $("#rank-value").textContent = numberFormat.format(stats.rank);
    $("#badges-value").textContent = numberFormat.format(stats.badges);
    $("#streak-value").textContent = numberFormat.format(stats.streak);
    $("#followers-value").textContent = stats.followers > 0 ? numberFormat.format(stats.followers) : "—";
    $("#rooms-value").textContent = numberFormat.format(stats.completedRooms);
    const percentile = (stats.rank / estimatedTryHackMeUsers) * 100;
    $("#rank-percentile").textContent = `TOP ${percentile.toFixed(4)}%`;
    $("#level-hex").textContent = `[${stats.levelHex}]`;
    $("#level-title").textContent = `[${stats.levelTitle}]`;

    const updated = new Date(stats.updatedAt);
    $("#stats-updated").textContent = Number.isNaN(updated.valueOf())
      ? "Live profile"
      : `Updated ${updated.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;
  }

  async function fetchJson(url, timeout = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("json")) throw new Error("JSON endpoint unavailable");
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function loadStats() {
    const syncState = $("#sync-state");

    try {
      const local = await fetchJson(`data/stats.json?v=${Date.now()}`, 3500);
      renderStats(normalizeStats(local, "repository"));
    } catch {
      renderStats(profile);
    }

    try {
      const live = await fetchJson("https://tryhackme.com/api/v2/public-profile?username=l1nux", 9000);
      if (live?.status !== "success" || !live?.data) throw new Error("Unexpected TryHackMe response");
      renderStats(normalizeStats(live, "live"));
      syncState.innerHTML = "<i></i> Live from TryHackMe";
    } catch {
      syncState.innerHTML = "<i></i> Daily repository sync";
    }
  }

  const certificateIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 4.5 6.5v5.2c0 4.7 3.2 7.8 7.5 9.3 4.3-1.5 7.5-4.6 7.5-9.3V6.5L12 3Z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>`;

  let certificates = [];
  let certificateFilter = "all";
  let certificatesExpanded = false;

  function renderCertificates() {
    const grid = $("#certificate-grid");
    const filtered = certificates.filter((certificate) => {
      if (certificateFilter === "all") return true;
      return certificate.category === certificateFilter;
    });
    const visible = certificatesExpanded ? filtered : filtered.slice(0, 6);
    grid.replaceChildren();

    visible.forEach((certificate, index) => {
      const hasLink = /^https:\/\//i.test(certificate.url || "");
      const card = document.createElement(hasLink ? "a" : "article");
      card.className = "certificate-card";
      card.dataset.index = String(index + 1).padStart(2, "0");
      if (hasLink) {
        card.href = certificate.url;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
        card.setAttribute("aria-label", `${certificate.title} — view certificate`);
      }

      const head = document.createElement("div");
      head.className = "certificate-card__head";
      head.innerHTML = certificateIcon;
      const provider = document.createElement("span");
      provider.textContent = certificate.provider;
      head.append(provider);

      const title = document.createElement("h3");
      title.textContent = certificate.title;

      const meta = document.createElement("div");
      meta.className = "certificate-card__meta";
      const type = document.createElement("span");
      type.textContent = hasLink ? "Credential available" : "Certificate";
      const status = document.createElement("span");
      status.className = hasLink ? "certificate-card__verified" : "";
      status.textContent = hasLink ? "Verify ↗" : "Link pending";
      meta.append(type, status);
      card.append(head, title, meta);
      grid.append(card);
    });

    $("#certificate-count").textContent = certificates.length;
    const viewAll = $("#view-all-certificates");
    viewAll.hidden = filtered.length <= 6;
    viewAll.setAttribute("aria-expanded", String(certificatesExpanded));
    $("span", viewAll).textContent = certificatesExpanded
      ? "Show fewer certificates"
      : `View all ${filtered.length} certificates`;
  }

  async function loadCertificates() {
    try {
      const response = await fetch("data/certificates.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Certificates unavailable");
      certificates = await response.json();
      renderCertificates();
    } catch {
      $("#certificate-grid").textContent = "Certificates could not be loaded.";
      $("#view-all-certificates").hidden = true;
    }
  }

  function initCertificateControls() {
    $$(".filter-btn").forEach((button) => {
      button.addEventListener("click", () => {
        $$(".filter-btn").forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        certificateFilter = button.dataset.filter;
        certificatesExpanded = false;
        renderCertificates();
      });
    });

    $("#view-all-certificates").addEventListener("click", () => {
      certificatesExpanded = !certificatesExpanded;
      renderCertificates();
    });
  }

  function initReveal() {
    const elements = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    elements.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index * 45, 180)}ms`;
      observer.observe(element);
    });
  }

  function initCursorGlow() {
    const glow = $("#cursor-glow");
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    window.addEventListener("pointermove", (event) => {
      glow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      glow.style.opacity = "1";
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", () => { glow.style.opacity = "0"; });
  }

  function initParticles() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || innerWidth < 700) return;
    const canvas = $("#particle-canvas");
    const context = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let points = [];

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      width = innerWidth;
      height = innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      points = Array.from({ length: Math.min(58, Math.floor(width / 24)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.05 + 0.25,
        speedX: (Math.random() - 0.5) * 0.09,
        speedY: (Math.random() - 0.5) * 0.09,
        alpha: Math.random() * 0.26 + 0.05,
      }));
    }

    function frame() {
      context.clearRect(0, 0, width, height);
      points.forEach((point) => {
        point.x += point.speedX;
        point.y += point.speedY;
        if (point.x < 0) point.x = width;
        if (point.x > width) point.x = 0;
        if (point.y < 0) point.y = height;
        if (point.y > height) point.y = 0;
        context.beginPath();
        context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(216, 180, 254, ${point.alpha})`;
        context.fill();
      });
      requestAnimationFrame(frame);
    }

    resize();
    frame();
    addEventListener("resize", resize, { passive: true });
  }

  function initCopy() {
    const button = $("#copy-discord");
    const toast = $("#toast");
    let toastTimer;
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        toast.textContent = "Discord username copied: atak1n";
      } catch {
        toast.textContent = "Discord: atak1n";
      }
      toast.classList.add("is-visible");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
    });
  }

  function initTerminal() {
    const shell = $("#terminal-shell");
    const output = $("#terminal-output");
    const form = $("#terminal-form");
    const input = $("#terminal-input");
    const history = [];
    let historyIndex = 0;
    let lastFocused = null;

    const files = {
      "about.txt": "Dark Web OSINT specialist focused on cyber security and digital intelligence.",
      "skills.txt": "Cyber Security · OSINT · Scripting · IDS/IPS · NIST · IAM · IR & DFIR · DevOps",
      "contact.txt": "GitHub: github.com/l1nux-1\nDiscord: atak1n",
      ".hint": "The dark side has cookies. Try: order66",
    };

    function line(text = "", type = "") {
      const item = document.createElement("p");
      item.className = `terminal-line${type ? ` terminal-line--${type}` : ""}`;
      item.textContent = text;
      output.append(item);
      output.scrollTop = output.scrollHeight;
    }

    function welcome() {
      output.replaceChildren();
      line("l1nux security terminal v1.0", "accent");
      line("Type 'help' to list available commands.", "dim");
      line();
    }

    function openTerminal() {
      if (!shell.hidden) return;
      lastFocused = document.activeElement;
      shell.hidden = false;
      document.body.style.overflow = "hidden";
      welcome();
      requestAnimationFrame(() => input.focus());
    }

    function closeTerminal() {
      shell.hidden = true;
      document.body.style.overflow = "";
      input.value = "";
      lastFocused?.focus?.();
    }

    function runCommand(rawCommand) {
      const command = rawCommand.trim();
      if (!command) return;
      line(`l1nux@portfolio:~$ ${command}`, "accent");
      const [binary, ...args] = command.split(/\s+/);
      const argument = args.join(" ");

      switch (binary.toLowerCase()) {
        case "help":
          line("AVAILABLE COMMANDS", "green");
          line("help      show this command list");
          line("whoami    print current user");
          line("neofetch  display profile summary");
          line("stats     show TryHackMe progress");
          line("skills    list security skills");
          line("social    show profile links");
          line("certs     show certificate count");
          line("ls [-a]   list available files");
          line("cat FILE  read a file");
          line("pwd       print working directory");
          line("date      show local date and time");
          line("echo TEXT print text");
          line("history   show command history");
          line("clear     clear terminal output");
          line("exit      close terminal");
          break;
        case "whoami":
          line("l1nux");
          break;
        case "id":
          line("uid=1337(l1nux) gid=1337(osint) groups=cyber,dfir,devops");
          break;
        case "pwd":
          line("/home/l1nux/portfolio");
          break;
        case "ls":
          line(argument === "-a" ? Object.keys(files).join("  ") : Object.keys(files).filter((name) => !name.startsWith(".")).join("  "));
          break;
        case "cat":
          if (!argument) line("cat: missing file operand", "error");
          else if (Object.prototype.hasOwnProperty.call(files, argument)) line(files[argument]);
          else line(`cat: ${argument}: No such file`, "error");
          break;
        case "skills":
          line(files["skills.txt"]);
          break;
        case "social":
          line("TryHackMe  https://tryhackme.com/p/l1nux");
          line("GitHub     https://github.com/l1nux-1");
          line("Write-ups  https://github.com/l1nux-1/TryHackMe");
          line("Discord    atak1n");
          break;
        case "stats":
          line(`[${profile.levelHex}] [${profile.levelTitle}]`, "green");
          line(`World rank     #${numberFormat.format(profile.rank)}`);
          line(`Completed      ${numberFormat.format(profile.completedRooms)} rooms`);
          line(`Badges         ${numberFormat.format(profile.badges)}`);
          line(`Current streak ${numberFormat.format(profile.streak)} days`);
          line(`Followers      ${profile.followers > 0 ? numberFormat.format(profile.followers) : "Not available"}`);
          break;
        case "certs":
          line(`${certificates.length || 22} certificates loaded. Scroll to the credentials section to explore.`);
          break;
        case "neofetch":
          line("          .--.          l1nux@portfolio", "accent");
          line("      .-(      ).       ----------------");
          line("     (___.__)__)        Role: Dark Web OSINT");
          line(`      /  /\\  \\         Level: ${profile.levelHex} ${profile.levelTitle}`);
          line(`     /__/  \\__\\        Rank: #${numberFormat.format(profile.rank)}`);
          line("                       Theme: Purple / Black");
          break;
        case "date":
          line(new Date().toString());
          break;
        case "echo":
          line(argument);
          break;
        case "history":
          history.forEach((item, index) => line(`${String(index + 1).padStart(3, " ")}  ${item}`));
          break;
        case "clear":
          output.replaceChildren();
          break;
        case "exit":
        case "quit":
          closeTerminal();
          break;
        case "sudo":
          line("l1nux is not in the sudoers file. This incident will be reported.", "error");
          break;
        case "order66":
          line("Protocol acknowledged. Profile GIF clearance granted.", "green");
          break;
        default:
          line(`${binary}: command not found. Type 'help'.`, "error");
      }
    }

    $("#terminal-launch").addEventListener("click", openTerminal);
    $("#footer-terminal").addEventListener("click", openTerminal);
    $$('[data-terminal-close]').forEach((button) => button.addEventListener("click", closeTerminal));

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const command = input.value;
      if (command.trim()) {
        history.push(command.trim());
        historyIndex = history.length;
      }
      input.value = "";
      runCommand(command);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowUp" && history.length) {
        event.preventDefault();
        historyIndex = Math.max(0, historyIndex - 1);
        input.value = history[historyIndex] || "";
      }
      if (event.key === "ArrowDown" && history.length) {
        event.preventDefault();
        historyIndex = Math.min(history.length, historyIndex + 1);
        input.value = history[historyIndex] || "";
      }
    });

    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        shell.hidden ? openTerminal() : closeTerminal();
      }
      if (event.key === "Escape" && !shell.hidden) closeTerminal();
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    $("#current-year").textContent = new Date().getFullYear();
    initReveal();
    initCursorGlow();
    initParticles();
    initCopy();
    initCertificateControls();
    initTerminal();
    if (location.hash === "#terminal") {
      requestAnimationFrame(() => $("#terminal-launch").click());
    }
    await Promise.allSettled([loadStats(), loadCertificates()]);
  });
})();
