const REFRESH_SECONDS = 60;
const NEWS_FETCH_TIMEOUT_MS = 4500;
const MAX_HEADLINES = 16;

const REGION_CONFIG = {
  us: { label: "United States", hl: "en-US", gl: "US", ceid: "US:en", timezone: "America/New_York" },
  in: { label: "India", hl: "en-IN", gl: "IN", ceid: "IN:en", timezone: "Asia/Kolkata" },
  cn: { label: "China", hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans", timezone: "Asia/Shanghai" },
  gb: { label: "United Kingdom", hl: "en-GB", gl: "GB", ceid: "GB:en", timezone: "Europe/London" },
  de: { label: "Germany", hl: "de", gl: "DE", ceid: "DE:de", timezone: "Europe/Berlin" },
  fr: { label: "France", hl: "fr", gl: "FR", ceid: "FR:fr", timezone: "Europe/Paris" },
  it: { label: "Italy", hl: "it", gl: "IT", ceid: "IT:it", timezone: "Europe/Rome" },
  es: { label: "Spain", hl: "es", gl: "ES", ceid: "ES:es", timezone: "Europe/Madrid" }
};

const WEATHER_CODES = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Heavy rain showers",
  82: "Violent rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm and hail",
  99: "Severe hail"
};

const state = {
  region: localStorage.getItem("pulsewire_region") || "us",
  europeCountry: localStorage.getItem("pulsewire_eu_country") || "gb",
  tab: "home",
  countdown: REFRESH_SECONDS,
  currentCoords: null,
  weatherLabel: localStorage.getItem("pulsewire_weather_label") || "",
  calendarDate: new Date()
};

const EMERGENCY_HEADLINES = {
  home: [
    { title: "Markets open mixed as investors watch inflation data", source: "PulseWire Backup", link: "#", pubDate: "" },
    { title: "Transit upgrades announced across major metro regions", source: "PulseWire Backup", link: "#", pubDate: "" },
    { title: "Energy and climate policy updates continue this week", source: "PulseWire Backup", link: "#", pubDate: "" }
  ],
  tech: [
    { title: "AI platform releases focus on speed and reliability", source: "PulseWire Backup", link: "#", pubDate: "" },
    { title: "Browser and mobile engine updates improve battery life", source: "PulseWire Backup", link: "#", pubDate: "" },
    { title: "Cloud tooling shifts toward edge-first deployment", source: "PulseWire Backup", link: "#", pubDate: "" }
  ],
  business: [
    { title: "Global markets monitor central bank signals", source: "PulseWire Backup", link: "#", pubDate: "" },
    { title: "Earnings outlook improves for key service sectors", source: "PulseWire Backup", link: "#", pubDate: "" },
    { title: "Cross-border trade updates influence shipping rates", source: "PulseWire Backup", link: "#", pubDate: "" }
  ],
  sports: [
    { title: "Major league fixtures set for a busy weekend", source: "PulseWire Backup", link: "#", pubDate: "" },
    { title: "Team rankings shift after strong mid-season runs", source: "PulseWire Backup", link: "#", pubDate: "" },
    { title: "International tournaments publish updated schedules", source: "PulseWire Backup", link: "#", pubDate: "" }
  ],
  ipl: [
    { title: "IPL squads announce lineup updates before the next fixture", source: "PulseWire Backup", link: "#", pubDate: "" },
    { title: "Points table race tightens after midweek results", source: "PulseWire Backup", link: "#", pubDate: "" },
    { title: "Pitch and venue reports shape match-day strategy", source: "PulseWire Backup", link: "#", pubDate: "" }
  ]
};

const TAB_FEED_CONFIG = {
  home: { googleTopic: "", fallbackFeed: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", statusLabel: "headlines" },
  tech: { googleTopic: "TECHNOLOGY", fallbackFeed: "https://feeds.arstechnica.com/arstechnica/technology-lab", statusLabel: "tech feed" },
  business: { googleTopic: "BUSINESS", fallbackFeed: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml", statusLabel: "business feed" },
  sports: { googleTopic: "SPORTS", fallbackFeed: "https://www.espn.com/espn/rss/news", statusLabel: "sports feed" },
  ipl: { searchQuery: "IPL OR \"Indian Premier League\"", fallbackFeed: "https://www.espncricinfo.com/rss/content/story/feeds/0.xml", statusLabel: "IPL feed" }
};

const TAB_TITLES = {
  weather: "Local Weather",
  home: "Top Headlines",
  tech: "Technology News",
  business: "Business News",
  sports: "Sports News",
  ipl: "IPL Briefing"
};

const $ = (selector) => document.querySelector(selector);

const elements = {
  date: $("#live-date"),
  time: $("#live-time"),
  panelTitle: $("#panel-title"),
  refreshState: $("#refresh-state"),
  regionSelect: $("#region-select"),
  euWrap: $("#europe-country-wrap"),
  euSelect: $("#europe-country-select"),
  weatherView: $("#weather-view"),
  useLocationBtn: $("#use-location-btn"),
  zipForm: $("#zip-form"),
  zipInput: $("#zip-input"),
  weatherCard: $("#weather-card"),
  weatherMeta: $("#weather-meta"),
  newsList: $("#news-list"),
  template: $("#news-item-template"),
  tabs: Array.from(document.querySelectorAll(".tab")),
  refreshBtn: $("#refresh-btn"),
  calendarTitle: $("#calendar-title"),
  calendarGrid: $("#calendar-grid"),
  monthPrev: $("#month-prev"),
  monthNext: $("#month-next")
};

let clockTimerId = null;

function activeRegionKey() {
  return state.region === "eu" ? state.europeCountry : state.region;
}

function activeRegionConfig() {
  return REGION_CONFIG[activeRegionKey()];
}

function setRefreshText(statusText = "Live updates every 60s") {
  elements.refreshState.textContent = `${statusText} | Next in ${String(state.countdown).padStart(2, "0")}s`;
}

function isWeatherTab() {
  return state.tab === "weather";
}

function updateTabPresentation() {
  elements.panelTitle.textContent = TAB_TITLES[state.tab] || TAB_TITLES.home;
  elements.weatherView.classList.toggle("hidden", !isWeatherTab());
  elements.newsList.classList.toggle("hidden", isWeatherTab());
}

function showNewsLoading() {
  elements.newsList.innerHTML = "";
  for (let i = 0; i < 5; i += 1) {
    const div = document.createElement("div");
    div.className = "loader";
    elements.newsList.appendChild(div);
  }
}

function decodeGoogleLink(link) {
  if (!link.includes("news.google.com/rss/articles")) {
    return link;
  }
  const match = link.match(/\/articles\/(.*?)\?/);
  if (!match) {
    return link;
  }
  try {
    const decoded = atob(match[1].replace(/-/g, "+").replace(/_/g, "/"));
    const urlMatch = decoded.match(/(https?:\/\/[^\s]+)/);
    return urlMatch ? urlMatch[1] : link;
  } catch {
    return link;
  }
}

async function fetchGoogleNewsRss(topic = "home") {
  const region = activeRegionConfig();
  const config = TAB_FEED_CONFIG[topic] || TAB_FEED_CONFIG.home;
  let root = `https://news.google.com/rss?hl=${region.hl}&gl=${region.gl}&ceid=${region.ceid}`;

  if (config.googleTopic) {
    root = `https://news.google.com/rss/headlines/section/topic/${config.googleTopic}?hl=${region.hl}&gl=${region.gl}&ceid=${region.ceid}`;
  }

  if (config.searchQuery) {
    root = `https://news.google.com/rss/search?q=${encodeURIComponent(config.searchQuery)}&hl=${region.hl}&gl=${region.gl}&ceid=${region.ceid}`;
  }

  const fallbackRoot = config.fallbackFeed;

  const urls = [root, fallbackRoot];

  const endpointBuilders = [
    { name: "allorigins-raw", build: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` },
    { name: "allorigins-get", build: (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}` },
    { name: "rss2json", build: (url) => `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}` }
  ];

  const attempts = [];
  for (const url of urls) {
    for (const endpoint of endpointBuilders) {
      attempts.push(fetchNewsAttempt(url, endpoint));
    }
  }

  try {
    const items = await Promise.any(attempts);
    return normalizeHeadlines(items);
  } catch {
    throw new Error("News temporarily unavailable");
  }
}

async function fetchNewsAttempt(feedUrl, endpoint) {
  const requestUrl = endpoint.build(feedUrl);
  const response = await fetchWithTimeout(requestUrl, NEWS_FETCH_TIMEOUT_MS);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (endpoint.name === "rss2json") {
    const data = await response.json();
    const items = (data.items || []).map((item) => ({
      title: item.title || "Untitled",
      link: item.link || "#",
      pubDate: item.pubDate || "",
      source: item.author || new URL(feedUrl).hostname,
      description: "Tap to open full story."
    }));

    if (!items.length) {
      throw new Error("No headlines found");
    }

    return items;
  }

  const text = await response.text();
  const xmlText = endpoint.name === "allorigins-get" ? (JSON.parse(text).contents || "") : text;
  const items = parseXmlHeadlines(xmlText);
  if (!items.length) {
    throw new Error("No headlines found");
  }

  return items;
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { cache: "no-store", signal: controller.signal });
  } finally {
    clearTimeout(timerId);
  }
}

function parseXmlHeadlines(xmlText) {
  if (!xmlText.trim()) {
    return [];
  }

  const xml = new DOMParser().parseFromString(xmlText, "text/xml");
  const items = Array.from(xml.querySelectorAll("item")).slice(0, MAX_HEADLINES);

  return items.map((item) => {
    const title = item.querySelector("title")?.textContent || "Untitled";
    const rawLink = item.querySelector("link")?.textContent || "#";
    const pubDate = item.querySelector("pubDate")?.textContent || "";
    const source = item.querySelector("source")?.textContent || activeRegionConfig().label;
    return {
      title,
      link: decodeGoogleLink(rawLink),
      pubDate,
      source,
      description: "Tap to open full story."
    };
  });
}

function normalizeHeadlines(items) {
  const seen = new Set();
  const clean = [];

  for (const item of items) {
    const title = (item.title || "").trim();
    const link = (item.link || "#").trim();
    const key = `${title.toLowerCase()}|${link}`;
    if (!title || seen.has(key)) {
      continue;
    }

    seen.add(key);
    clean.push({
      title,
      link,
      pubDate: item.pubDate || "",
      source: item.source || activeRegionConfig().label,
      description: item.description || "Tap to open full story."
    });

    if (clean.length >= MAX_HEADLINES) {
      break;
    }
  }

  return clean;
}

function getNewsCacheKey(topic) {
  return `pulsewire_news_cache_${activeRegionKey()}_${topic}`;
}

function saveNewsCache(topic, items) {
  localStorage.setItem(
    getNewsCacheKey(topic),
    JSON.stringify({ savedAt: Date.now(), items: items.slice(0, MAX_HEADLINES) })
  );
}

function readNewsCache(topic) {
  const raw = localStorage.getItem(getNewsCacheKey(topic));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.items) ? normalizeHeadlines(parsed.items) : [];
  } catch {
    return [];
  }
}

function renderNews(items) {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const visibleItems = isMobile ? items.slice(0, 4) : items;

  elements.newsList.innerHTML = "";
  elements.newsList.classList.toggle("compact", isMobile);

  if (!visibleItems.length) {
    elements.newsList.innerHTML = `<p class="muted">No headlines right now.</p>`;
    return;
  }

  visibleItems.forEach((item) => {
    const node = elements.template.content.cloneNode(true);
    node.querySelector(".source").textContent = item.source;

    const date = item.pubDate ? new Date(item.pubDate) : new Date();
    node.querySelector(".published").textContent = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const headline = node.querySelector(".headline");
    headline.textContent = item.title;
    headline.href = item.link;

    node.querySelector(".snippet").textContent = item.description;
    elements.newsList.appendChild(node);
  });
}

function weatherDescription(code) {
  return WEATHER_CODES[code] || "Unknown";
}

async function fetchWeatherByCoords(lat, lon) {
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m" +
    "&timezone=auto";

  const response = await fetch(weatherUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Weather service unavailable");
  }
  return response.json();
}

async function geocodeZipOrCity(inputText) {
  const value = inputText.trim();
  if (!value) {
    throw new Error("Enter zipcode or city");
  }

  const activeRegion = activeRegionKey();
  const usZip = /^\d{5}$/.test(value);

  if ((activeRegion === "us" || activeRegion === "eu") && usZip) {
    const res = await fetch(`https://api.zippopotam.us/us/${value}`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Zipcode not found");
    }
    const data = await res.json();
    const place = data.places?.[0];
    if (!place) {
      throw new Error("Zipcode not found");
    }

    return {
      lat: Number(place.latitude),
      lon: Number(place.longitude),
      label: `${place["place name"]}, ${place["state abbreviation"]} ${value}`
    };
  }

  const q = encodeURIComponent(value);
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=1&language=en&format=json`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    throw new Error("Could not locate this place");
  }

  const data = await res.json();
  const place = data.results?.[0];
  if (!place) {
    throw new Error("Could not locate this place");
  }

  return {
    lat: place.latitude,
    lon: place.longitude,
    label: `${place.name}${place.admin1 ? `, ${place.admin1}` : ""}, ${place.country}`
  };
}

function renderWeather(weather, label) {
  const current = weather.current;
  elements.weatherCard.innerHTML = `
    <p class="weather-temp">${Math.round(current.temperature_2m)}${weather.current_units.temperature_2m}</p>
    <p class="weather-desc">${weatherDescription(current.weather_code)}</p>
    <div class="weather-grid">
      <div>Feels like: ${Math.round(current.apparent_temperature)}${weather.current_units.apparent_temperature}</div>
      <div>Humidity: ${current.relative_humidity_2m}${weather.current_units.relative_humidity_2m}</div>
      <div>Wind: ${Math.round(current.wind_speed_10m)} ${weather.current_units.wind_speed_10m}</div>
      <div>Updated: ${new Date().toLocaleTimeString()}</div>
    </div>
  `;

  elements.weatherMeta.textContent = label ? `Location: ${label}` : "";
}

function renderWeatherError(message) {
  elements.weatherCard.innerHTML = `<p class="muted">${message}</p>`;
}

async function refreshWeather() {
  if (!state.currentCoords) {
    return;
  }

  try {
    const weather = await fetchWeatherByCoords(state.currentCoords.lat, state.currentCoords.lon);
    renderWeather(weather, state.weatherLabel);
  } catch (err) {
    renderWeatherError(err.message || "Could not fetch weather");
  }
}

async function setCoordsAndRefresh(coords, label) {
  state.currentCoords = { lat: coords.lat, lon: coords.lon };
  state.weatherLabel = label;
  localStorage.setItem("pulsewire_weather_label", label);
  await refreshWeather();
}

function regionTimezone() {
  return activeRegionConfig().timezone;
}

function startClock() {
  if (clockTimerId) {
    clearInterval(clockTimerId);
  }

  const update = () => {
    const now = new Date();
    const timezone = regionTimezone();

    elements.date.textContent = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: timezone
    }).format(now);

    elements.time.textContent = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: timezone
    }).format(now);
  };

  update();
  clockTimerId = setInterval(update, 1000);
}

function calendarMonthName(date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function renderCalendar() {
  const date = new Date(state.calendarDate);
  date.setDate(1);

  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  elements.calendarTitle.textContent = calendarMonthName(date);
  elements.calendarGrid.innerHTML = "";

  ["S", "M", "T", "W", "T", "F", "S"].forEach((label) => {
    const head = document.createElement("div");
    head.className = "cal-cell cal-head";
    head.textContent = label;
    elements.calendarGrid.appendChild(head);
  });

  for (let i = 0; i < firstDay; i += 1) {
    const empty = document.createElement("div");
    empty.className = "cal-cell";
    empty.textContent = "";
    elements.calendarGrid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d += 1) {
    const cell = document.createElement("div");
    cell.className = "cal-cell";
    cell.textContent = String(d);

    if (
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      cell.classList.add("cal-today");
    }

    elements.calendarGrid.appendChild(cell);
  }
}

function bindCalendar() {
  elements.monthPrev.addEventListener("click", () => {
    state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
    renderCalendar();
  });

  elements.monthNext.addEventListener("click", () => {
    state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
    renderCalendar();
  });
}

async function refreshNews() {
  if (isWeatherTab()) {
    return;
  }

  const topic = TAB_FEED_CONFIG[state.tab] ? state.tab : "home";
  const cachedItems = readNewsCache(topic);

  if (cachedItems.length) {
    renderNews(cachedItems);
    setRefreshText("Showing cached headlines, refreshing live feed");
  } else {
    showNewsLoading();
  }

  const status = `Refreshing ${TAB_FEED_CONFIG[topic].statusLabel}`;
  setRefreshText(status);

  try {
    const items = await fetchGoogleNewsRss(topic);
    renderNews(items);
    saveNewsCache(topic, items);
    setRefreshText(`Updated at ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    if (cachedItems.length) {
      setRefreshText("Live feed slow, showing cached headlines");
      return;
    }

    const backup = EMERGENCY_HEADLINES[topic] || EMERGENCY_HEADLINES.home;
    renderNews(backup.map((item) => ({ ...item, description: "Live feeds are temporarily unavailable. Try refresh." })));
    setRefreshText("Showing backup headlines");
  }
}

async function fullRefresh() {
  if (document.hidden || !navigator.onLine) {
    setRefreshText("Paused while tab hidden/offline");
    return;
  }

  if (isWeatherTab()) {
    await refreshWeather();
    setRefreshText(`Weather updated at ${new Date().toLocaleTimeString()}`);
    return;
  }

  await Promise.all([refreshNews(), refreshWeather()]);
}

function bindTabSwitching() {
  elements.tabs.forEach((tabButton) => {
    tabButton.addEventListener("click", async () => {
      elements.tabs.forEach((tab) => tab.classList.remove("active"));
      tabButton.classList.add("active");
      state.tab = tabButton.dataset.tab;
      updateTabPresentation();
      state.countdown = REFRESH_SECONDS;
      await fullRefresh();
    });
  });
}

function applyRegionVisibility() {
  elements.euWrap.classList.toggle("hidden", state.region !== "eu");
  if (state.region === "us") {
    elements.zipInput.placeholder = "US zipcode (e.g. 10001)";
  } else {
    elements.zipInput.placeholder = "Zipcode or city";
  }
}

function bindRegionSelection() {
  elements.regionSelect.value = state.region;
  elements.euSelect.value = state.europeCountry;
  applyRegionVisibility();

  elements.regionSelect.addEventListener("change", async (event) => {
    state.region = event.target.value;
    localStorage.setItem("pulsewire_region", state.region);
    applyRegionVisibility();
    state.countdown = REFRESH_SECONDS;
    await fullRefresh();
    startClock();
  });

  elements.euSelect.addEventListener("change", async (event) => {
    state.europeCountry = event.target.value;
    localStorage.setItem("pulsewire_eu_country", state.europeCountry);
    state.countdown = REFRESH_SECONDS;
    await fullRefresh();
    startClock();
  });
}

function bindWeatherControls() {
  elements.useLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      renderWeatherError("Geolocation is not supported by this browser");
      return;
    }

    elements.useLocationBtn.disabled = true;
    elements.useLocationBtn.textContent = "Locating...";

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        elements.useLocationBtn.disabled = false;
        elements.useLocationBtn.textContent = "Use Current Location";
        await setCoordsAndRefresh(
          {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          },
          "Current location"
        );
      },
      (error) => {
        elements.useLocationBtn.disabled = false;
        elements.useLocationBtn.textContent = "Use Current Location";
        renderWeatherError(error.message || "Location access denied");
      },
      { timeout: 10000 }
    );
  });

  elements.zipForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = elements.zipInput.value;

    try {
      const location = await geocodeZipOrCity(input);
      await setCoordsAndRefresh({ lat: location.lat, lon: location.lon }, location.label);
    } catch (err) {
      renderWeatherError(err.message || "Could not update weather location");
    }
  });
}

function startLiveRefresh() {
  setInterval(async () => {
    if (state.countdown <= 1) {
      state.countdown = REFRESH_SECONDS;
      await fullRefresh();
      return;
    }

    state.countdown -= 1;
    setRefreshText();
  }, 1000);
}

function bindManualRefresh() {
  elements.refreshBtn.addEventListener("click", async () => {
    state.countdown = REFRESH_SECONDS;
    await fullRefresh();
  });
}

async function init() {
  bindRegionSelection();
  bindWeatherControls();
  bindTabSwitching();
  bindManualRefresh();
  bindCalendar();

  startClock();
  renderCalendar();
  updateTabPresentation();
  setRefreshText();

  if (state.region === "us") {
    elements.zipInput.value = "10001";
  }

  await fullRefresh();

  if (elements.zipInput.value) {
    try {
      const location = await geocodeZipOrCity(elements.zipInput.value);
      await setCoordsAndRefresh({ lat: location.lat, lon: location.lon }, location.label);
    } catch {
      renderWeatherError("Use current location or enter zipcode/city to load weather");
    }
  }

  startLiveRefresh();

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      state.countdown = 1;
    }
  });

  window.addEventListener("online", () => {
    state.countdown = 1;
  });
}

init();
