const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const http = require("http");
const path = require("path");
const readline = require("readline");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });
const PORT = Number(process.env.PORT) || 3000;

const INGAME_BASE =
  "https://esportsdata-sg.mobilelegends.com/battledata?authkey=1c7c9de5798a010e8f7da8ab5b82d953&battleid=";
const POSTGAME_BASE =
  "https://esportsdata-sg.mobilelegends.com/postdata?authkey=1c7c9de5798a010e8f7da8ab5b82d953&battleid=";

app.use("/images", express.static("C:/Users/User/Desktop/vmixData/images"));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json());

let cachedData = null;
let ingameData = null;
let postgameData = null;
let roleAssignments = {};
let currentState = "unknown";
let BATTLE_ID = "";
let INGAME_URL = "";
let POSTGAME_URL = "";
let refreshInterval = null;
let timerInterval = null;
let storedRuneIds = {};

let localGameTime = 0;
let lastApiGameTime = 0;
let lastApiSyncTime = Date.now();
let gameRunning = false;

// Raw API responses stored so roles can be re-applied after assignment
let lastIngameRaw = null;
let lastPostgameRaw = null;

const WS_ENDPOINTS = new Set([
  "data",
  "ingame",
  "postgame",
  "players",
  "players/left",
  "players/right",
  "postgame/players",
  "postgame/players/left",
  "postgame/players/right",
  "golddiff",
  "postgame/golddiff",
]);

const ROLE_ORDER = ["exp", "mid", "roam", "jungle", "gold"];
const TXT_DIR = __dirname;

const lastKnown = {
  left_gold: "0",
  right_gold: "0",
  leftdiff: "",
  rightdiff: "",
  left_score: "0",
  right_score: "0",
  left_lord: "0",
  right_lord: "0",
  left_tower: "0",
  right_tower: "0",
  left_turtle: "0",
  right_turtle: "0",
};

const turtleState = {
  left_turtle: "0",
  right_turtle: "0",
  last_left_turtle_time: Date.now(),
  last_right_turtle_time: Date.now(),
};
const TURTLE_TIMEOUT = 8000;

// ================================================================
// READLINE
// ================================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askBattleId() {
  rl.question("\n🎮 Enter Battle ID: ", (id) => {
    id = id.trim();
    if (!id) {
      console.log("❌ Battle ID cannot be empty.");
      return askBattleId();
    }
    BATTLE_ID = id;
    INGAME_URL = INGAME_BASE + BATTLE_ID;
    POSTGAME_URL = POSTGAME_BASE + BATTLE_ID;
    console.log(`\n✅ Battle ID set → ${BATTLE_ID}`);
    console.log(`\n🚀 Starting...\n`);
    startRefresh();
    startLocalTimer();
    rl.close();
  });
}

// ================================================================
// HELPERS
// ================================================================

function formatGold(val) {
  const n = Number(val) || 0;
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function formatTeamGold(val) {
  const n = Number(val) || 0;
  if (n >= 10000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins} : ${String(secs).padStart(2, "0")}`;
}

function formatTimeTxt(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function writeTxtSafe(filename, value, key) {
  const val = String(value ?? "").trim();
  if (val !== "" && val !== "undefined" && val !== "null") lastKnown[key] = val;
  try {
    fs.writeFileSync(path.join(TXT_DIR, filename), lastKnown[key]);
  } catch (e) {}
}

function writeTxt(filename, value) {
  try {
    fs.writeFileSync(path.join(TXT_DIR, filename), String(value ?? ""));
  } catch (e) {}
}

function updateTurtle(value, stateKey, timeKey, filename, key) {
  if (value !== null && value !== undefined) {
    turtleState[stateKey] = String(value);
    turtleState[timeKey] = Date.now();
  } else {
    if (Date.now() - turtleState[timeKey] > TURTLE_TIMEOUT)
      turtleState[stateKey] = "0";
  }
  writeTxtSafe(filename, turtleState[stateKey], key);
}

function calcGoldDiffs(leftPlayers, rightPlayers, goldField = "gold") {
  const diffs = {};
  ROLE_ORDER.forEach((role, i) => {
    const leftGold = Number(leftPlayers[i]?.[goldField]) || 0;
    const rightGold = Number(rightPlayers[i]?.[goldField]) || 0;
    const diff = leftGold - rightGold;
    diffs[role] = {
      left_gold: leftGold,
      right_gold: rightGold,
      left_gold_diff: diff > 0 ? "+" + formatGold(diff) : "",
      right_gold_diff: diff < 0 ? "+" + formatGold(-diff) : "",
      diff_raw: diff,
      leader: diff > 0 ? "left" : diff < 0 ? "right" : "even",
    };
  });
  return diffs;
}

function sortByRole(players) {
  return ROLE_ORDER.map(
    (role) =>
      players.find((p) => roleAssignments[String(p.roleid)] === role) ||
      emptyPlayer(),
  );
}

function sortByRolePost(players) {
  return ROLE_ORDER.map(
    (role) =>
      players.find((p) => roleAssignments[String(p.roleid)] === role) ||
      emptyPostgamePlayer(),
  );
}

// ================================================================
// IMAGE HELPERS — all return local file paths for internal use
// ================================================================

function heroImg(heroid) {
  if (!heroid) return "";
  const base = `C:/Users/User/Desktop/vmixData/images/heroes/${heroid}`;
  if (fs.existsSync(base + ".jpg")) return base + ".jpg";
  if (fs.existsSync(base + ".png")) return base + ".png";
  return base + ".jpg";
}

function postHeroImg(heroid) {
  if (!heroid) return "";
  const base = `C:/Users/User/Desktop/vmixData/images/postheros/${heroid}`;
  if (fs.existsSync(base + ".jpg")) return base + ".jpg";
  if (fs.existsSync(base + ".png")) return base + ".png";
  return base + ".png";
}

function itemImg(id) {
  if (!id) return `C:/Users/User/Desktop/vmixData/images/items/blank.png`;
  return `C:/Users/User/Desktop/vmixData/images/items/${id}.png`;
}

function emblemImg(rune_id) {
  if (!rune_id) return "";
  return `C:/Users/User/Desktop/vmixData/images/emblems/${rune_id}.png`;
}

function talentImg(talent_id) {
  if (!talent_id) return "";
  return `C:/Users/User/Desktop/vmixData/images/emblems/talents/${talent_id}.png`;
}

function spellImg(skillid) {
  if (!skillid) return "";
  return `C:/Users/User/Desktop/vmixData/images/spells/${skillid}.png`;
}

function playerpicImg(roleid) {
  if (!roleid) return "";
  return `C:/Users/User/Desktop/vmixData/images/playerpic/${roleid}.png`;
}

// ================================================================
// LOCAL TIMER
// ================================================================

function startLocalTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!gameRunning) return;
    const elapsed = (Date.now() - lastApiSyncTime) / 1000;
    const estimated = Math.floor(lastApiGameTime + elapsed);
    if (estimated !== localGameTime) {
      localGameTime = estimated;
      writeTxt("timer.txt", formatTimeTxt(localGameTime));
    }
  }, 100);
}

// ================================================================
// TEXT FILE UPDATER
// ================================================================

function updateTextFiles(raw) {
  try {
    const game = raw?.data;
    if (!game) return;
    lastApiGameTime = game.game_time || 0;
    lastApiSyncTime = Date.now();
    gameRunning = true;

    const left = (game.camp_list || []).find((c) => c.campid === 1);
    const right = (game.camp_list || []).find((c) => c.campid === 2);

    if (left && right) {
      const lg = left.total_money || 0;
      const rg = right.total_money || 0;
      writeTxtSafe("left_gold.txt", formatTeamGold(lg), "left_gold");
      writeTxtSafe("right_gold.txt", formatTeamGold(rg), "right_gold");
      try {
        fs.writeFileSync(
          path.join(TXT_DIR, "leftdiff.txt"),
          lg > rg ? "+" + (lg - rg) : "",
        );
      } catch (e) {}
      try {
        fs.writeFileSync(
          path.join(TXT_DIR, "rightdiff.txt"),
          rg > lg ? "+" + (rg - lg) : "",
        );
      } catch (e) {}
    }
    if (left) {
      writeTxtSafe("left_score.txt", left.score ?? "0", "left_score");
      writeTxtSafe("left_lord.txt", left.kill_lord ?? "0", "left_lord");
      writeTxtSafe("left_tower.txt", left.kill_tower ?? "0", "left_tower");
      updateTurtle(
        left.kill_tortoise ?? left.kill_turtoise ?? null,
        "left_turtle",
        "last_left_turtle_time",
        "left_turtle.txt",
        "left_turtle",
      );
    }
    if (right) {
      writeTxtSafe("right_score.txt", right.score ?? "0", "right_score");
      writeTxtSafe("right_lord.txt", right.kill_lord ?? "0", "right_lord");
      writeTxtSafe("right_tower.txt", right.kill_tower ?? "0", "right_tower");
      updateTurtle(
        right.kill_tortoise ?? right.kill_turtoise ?? null,
        "right_turtle",
        "last_right_turtle_time",
        "right_turtle.txt",
        "right_turtle",
      );
    }
  } catch (err) {
    console.error("Text file update error:", err.message);
  }
}

// ================================================================
// MAIN REFRESH LOOP
// ================================================================

function startRefresh() {
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(async () => {
    try {
      const ingameRes = await fetch(INGAME_URL, {
        headers: { Authorization: "Bearer 1c7c9de5798a010e8f7da8ab5b82d953" },
      });
      const ingameRaw = await ingameRes.json();
      const state = ingameRaw?.data?.state ?? "";

      if (state === "end" || state === "") {
        gameRunning = false;
        currentState = "postgame";
        const hasIngamePlayers = (ingameRaw?.data?.camp_list || []).some(
          (camp) => Array.isArray(camp.player_list) && camp.player_list.length > 0,
        );
        if (hasIngamePlayers) {
          lastIngameRaw = ingameRaw;
          ingameData = cleanIngame(ingameRaw);
        }
        const postRes = await fetch(POSTGAME_URL, {
          headers: { Authorization: "Bearer 1c7c9de5798a010e8f7da8ab5b82d953" },
        });
        const postRaw = await postRes.json();
        lastPostgameRaw = postRaw;
        postgameData = cleanPostgame(postRaw);
        cachedData = postgameData;
        // Keep the last real ingame snapshot so live-only fields like death timers survive after state=end.
        // If server started fresh in postgame, build ingameData from postgame with /heroes/ paths.
        if (!ingameData) ingameData = buildIngameFallback(postgameData);

        writeTxt("timer.txt", "00:00");
        writeTxt("left_gold.txt", "0");
        writeTxt("right_gold.txt", "0");
        writeTxt("leftdiff.txt", "");
        writeTxt("rightdiff.txt", "");
        writeTxt("left_score.txt", "0");
        writeTxt("right_score.txt", "0");
        writeTxt("left_lord.txt", "0");
        writeTxt("right_lord.txt", "0");
        writeTxt("left_tower.txt", "0");
        writeTxt("right_tower.txt", "0");
        writeTxt("left_turtle.txt", "0");
        writeTxt("right_turtle.txt", "0");
        Object.keys(lastKnown).forEach((k) => {
          lastKnown[k] = k.includes("diff") ? "" : "0";
        });
        broadcastWsPayloads();
      } else {
        currentState = "ingame";
        lastIngameRaw = ingameRaw;
        ingameData = cleanIngame(ingameRaw);
        cachedData = ingameData;
        updateTextFiles(ingameRaw);
        broadcastWsPayloads();
      }
    } catch (err) {
      console.error("Refresh error:", err.message);
    }
  }, 1000);
}

// ================================================================
// FALLBACK: build /players-compatible data from postgame
// uses /images/heroes/ paths so /players never shows wrong images
// ================================================================

function buildIngameFallback(pgData) {
  const remap = (p) => ({
    ...p,
    hero_image: heroImg(p.heroid),
    ingame_hero_image: heroImg(p.heroid),
    draft_hero_image: p.heroid
      ? `http://localhost:${PORT}/drafthero-image/${String(p.heroid).trim()}.png`
      : "",
  });
  const left = pgData.left_team.players.map(remap);
  const right = pgData.right_team.players.map(remap);
  return {
    ...pgData,
    left_team: { ...pgData.left_team, players: left },
    right_team: { ...pgData.right_team, players: right },
    all_players: [...left, ...right],
  };
}

// ================================================================
// WEBSOCKET HELPERS
// ================================================================

function normalizeWsEndpoint(endpoint) {
  const normalized = String(endpoint || "data")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  return WS_ENDPOINTS.has(normalized) ? normalized : "data";
}

function getWsPayload(endpoint) {
  const d =
    ingameData || (postgameData ? buildIngameFallback(postgameData) : null);

  switch (endpoint) {
    case "data":
      return cachedData
        ? { ok: true, data: cachedData }
        : { ok: false, error: "Data not ready yet" };
    case "ingame":
      return ingameData
        ? { ok: true, data: ingameData }
        : { ok: false, error: "No ingame data yet" };
    case "postgame":
      return postgameData
        ? { ok: true, data: postgameData }
        : { ok: false, error: "No postgame data yet" };
    case "players":
      return d
        ? { ok: true, data: d.all_players }
        : { ok: false, error: "Data not ready yet" };
    case "players/left":
      return d
        ? { ok: true, data: d.left_team.players }
        : { ok: false, error: "Data not ready yet" };
    case "players/right":
      return d
        ? { ok: true, data: d.right_team.players }
        : { ok: false, error: "Data not ready yet" };
    case "postgame/players":
      return postgameData
        ? { ok: true, data: postgameData.all_players }
        : { ok: false, error: "No postgame data yet" };
    case "postgame/players/left":
      return postgameData
        ? { ok: true, data: postgameData.left_team.players }
        : { ok: false, error: "No postgame data yet" };
    case "postgame/players/right":
      return postgameData
        ? { ok: true, data: postgameData.right_team.players }
        : { ok: false, error: "No postgame data yet" };
    case "golddiff":
      return cachedData?.gold_diff
        ? { ok: true, data: cachedData.gold_diff }
        : { ok: false, error: "No gold diff data yet" };
    case "postgame/golddiff":
      return postgameData?.gold_diff
        ? { ok: true, data: postgameData.gold_diff }
        : { ok: false, error: "No postgame gold diff yet" };
    default:
      return { ok: false, error: "Unknown websocket endpoint" };
  }
}

function sendWsPayload(ws) {
  const endpoint = normalizeWsEndpoint(ws.endpoint);
  const payload = getWsPayload(endpoint);
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(
    JSON.stringify({
      type: endpoint,
      state: currentState,
      battle_id: BATTLE_ID,
      updated_at: new Date().toISOString(),
      ...payload,
    }),
  );
}

function broadcastWsPayloads() {
  wss.clients.forEach(sendWsPayload);
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  ws.endpoint = normalizeWsEndpoint(url.searchParams.get("endpoint"));

  sendWsPayload(ws);

  ws.on("message", (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === "subscribe") {
        ws.endpoint = normalizeWsEndpoint(parsed.endpoint);
        sendWsPayload(ws);
      }
    } catch (err) {
      ws.send(
        JSON.stringify({ ok: false, error: "Invalid websocket message" }),
      );
    }
  });
});

// ================================================================
// ENDPOINTS
// ================================================================

app.get("/raw", async (req, res) => {
  if (!INGAME_URL)
    return res.status(503).json({ error: "Battle ID not set yet" });
  try {
    const r = await fetch(INGAME_URL, {
      headers: { Authorization: "Bearer 1c7c9de5798a010e8f7da8ab5b82d953" },
    });
    res.json(await r.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/raw/post", async (req, res) => {
  if (!POSTGAME_URL)
    return res.status(503).json({ error: "Battle ID not set yet" });
  try {
    const r = await fetch(POSTGAME_URL, {
      headers: { Authorization: "Bearer 1c7c9de5798a010e8f7da8ab5b82d953" },
    });
    res.json(await r.json());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/data", (req, res) => {
  if (cachedData) res.json(cachedData);
  else res.status(503).json({ error: "Data not ready yet" });
});
app.get("/ingame", (req, res) => {
  if (ingameData) res.json(ingameData);
  else res.status(503).json({ error: "No ingame data yet" });
});
app.get("/postgame", (req, res) => {
  if (postgameData) res.json(postgameData);
  else res.status(503).json({ error: "No postgame data yet" });
});

// ✅ /players — ingameData if available, falls back to postgame-built ingame snapshot
//              hero_image + ingame_hero_image = /images/heroes/
//              draft_hero_image = /images/drafthero-image/
app.get("/players", (req, res) => {
  const d =
    ingameData || (postgameData ? buildIngameFallback(postgameData) : null);
  if (d) res.json(d.all_players);
  else res.status(503).json({ error: "Data not ready yet" });
});
app.get("/players/left", (req, res) => {
  const d =
    ingameData || (postgameData ? buildIngameFallback(postgameData) : null);
  if (d) res.json(d.left_team.players);
  else res.status(503).json({ error: "Data not ready yet" });
});
app.get("/players/right", (req, res) => {
  const d =
    ingameData || (postgameData ? buildIngameFallback(postgameData) : null);
  if (d) res.json(d.right_team.players);
  else res.status(503).json({ error: "Data not ready yet" });
});

// ✅ /postgame/players — always postgameData — hero_image = /images/postheros/
app.get("/postgame/players", (req, res) => {
  if (postgameData) res.json(postgameData.all_players);
  else res.status(503).json({ error: "No postgame data yet" });
});
app.get("/postgame/players/left", (req, res) => {
  if (postgameData) res.json(postgameData.left_team.players);
  else res.status(503).json({ error: "No postgame data yet" });
});
app.get("/postgame/players/right", (req, res) => {
  if (postgameData) res.json(postgameData.right_team.players);
  else res.status(503).json({ error: "No postgame data yet" });
});

app.get("/golddiff", (req, res) => {
  if (cachedData?.gold_diff) res.json(cachedData.gold_diff);
  else res.status(503).json({ error: "No gold diff data yet" });
});
app.get("/postgame/golddiff", (req, res) => {
  if (postgameData?.gold_diff) res.json(postgameData.gold_diff);
  else res.status(503).json({ error: "No postgame gold diff yet" });
});

app.post("/assign", (req, res) => {
  roleAssignments = req.body;
  console.log("✅ Roles saved:", roleAssignments);

  // Re-clean cached data immediately so role shows up in JSON right away
  if (lastIngameRaw) {
    ingameData = cleanIngame(lastIngameRaw);
    if (currentState === "ingame") cachedData = ingameData;
  }
  if (lastPostgameRaw) {
    postgameData = cleanPostgame(lastPostgameRaw);
    if (currentState === "postgame") {
      cachedData = postgameData;
      ingameData = buildIngameFallback(postgameData);
    }
  }

  broadcastWsPayloads();
  res.json({ success: true });
});

app.get("/hero-image/:heroid", (req, res) => {
  const jpg = `C:/Users/User/Desktop/vmixData/images/heroes/${req.params.heroid}.jpg`;
  const png = `C:/Users/User/Desktop/vmixData/images/heroes/${req.params.heroid}.png`;
  if (fs.existsSync(jpg)) res.sendFile(jpg);
  else if (fs.existsSync(png)) res.sendFile(png);
  else res.status(404).send("Not found");
});

app.get("/posthero-image/:heroid", (req, res) => {
  const jpg = `C:/Users/User/Desktop/vmixData/images/postheros/${req.params.heroid}.jpg`;
  const png = `C:/Users/User/Desktop/vmixData/images/postheros/${req.params.heroid}.png`;
  if (fs.existsSync(jpg)) res.sendFile(jpg);
  else if (fs.existsSync(png)) res.sendFile(png);
  else res.status(404).send("Not found");
});

// ✅ FIXED: supports both /drafthero-image/:heroid and /drafthero-image/:heroid.png
app.get("/drafthero-image/:heroid", (req, res) => {
  const heroid = req.params.heroid
    .replace(/\.png$/i, "")
    .replace(/\.jpg$/i, "");
  const jpg = `C:/Users/User/Desktop/vmixData/images/drafthero-image/${heroid}.jpg`;
  const png = `C:/Users/User/Desktop/vmixData/images/drafthero-image/${heroid}.png`;
  if (fs.existsSync(jpg)) res.sendFile(jpg);
  else if (fs.existsSync(png)) res.sendFile(png);
  else res.status(404).send("Not found");
});

app.get("/emblem-image/:runeid", (req, res) => {
  const p = `C:/Users/User/Desktop/vmixData/images/emblems/${req.params.runeid}.png`;
  fs.existsSync(p) ? res.sendFile(p) : res.status(404).send("Not found");
});
app.get("/talent-image/:talentid", (req, res) => {
  const p = `C:/Users/User/Desktop/vmixData/images/emblems/talents/${req.params.talentid}.png`;
  fs.existsSync(p) ? res.sendFile(p) : res.status(404).send("Not found");
});
app.get("/spell-image/:skillid", (req, res) => {
  const p = `C:/Users/User/Desktop/vmixData/images/spells/${req.params.skillid}.png`;
  fs.existsSync(p) ? res.sendFile(p) : res.status(404).send("Not found");
});
app.get("/playerpic/:roleid", (req, res) => {
  const p = `C:/Users/User/Desktop/vmixData/images/playerpic/${req.params.roleid}.png`;
  fs.existsSync(p) ? res.sendFile(p) : res.status(404).send("Not found");
});
app.get("/txt/:filename", (req, res) => {
  const f = path.join(TXT_DIR, req.params.filename);
  fs.existsSync(f) ? res.sendFile(f) : res.status(404).send("Not found");
});

app.get("/assign", (req, res) => {
  if (!cachedData)
    return res.send(
      `<html><body style="background:#1a1a2e;color:white;font-family:Arial;padding:30px;"><h2>⏳ Data not ready yet. Please refresh.</h2></body></html>`,
    );
  const roles = ["exp", "mid", "roam", "jungle", "gold"];
  const makeRows = (players) =>
    players
      .filter((p) => p.heroid)
      .map(
        (p) => `
    <tr>
      <td><img src="http://localhost:${PORT}/hero-image/${p.heroid}" width="55" height="55" style="border-radius:8px;object-fit:cover;border:2px solid #e94560;" onerror="this.style.display='none'"/></td>
      <td style="font-weight:bold;">${p.name}</td>
      <td><select name="${p.roleid}" id="${p.roleid}">
        <option value="">-- Select Role --</option>
        ${roles.map((r) => `<option value="${r}" ${roleAssignments[p.roleid] === r ? "selected" : ""}>${r.toUpperCase()}</option>`).join("")}
      </select></td>
    </tr>`,
      )
      .join("");
  res.send(`<!DOCTYPE html><html><head><title>Role Assignment</title><style>
    *{box-sizing:border-box;}body{font-family:Arial,sans-serif;background:#1a1a2e;color:white;padding:30px;}
    h1{color:#e94560;margin-bottom:5px;}p{color:#aaa;margin-top:0;}
    .info{background:#0f3460;padding:10px 15px;border-radius:5px;margin-bottom:20px;font-size:14px;color:#4ecca3;}
    h2{color:white;background:#e94560;padding:8px 15px;border-radius:5px;display:inline-block;margin-top:30px;}
    table{width:100%;border-collapse:collapse;margin-top:10px;margin-bottom:10px;}
    th{background:#0f3460;padding:10px 12px;text-align:left;font-size:13px;text-transform:uppercase;}
    td{padding:10px 12px;border-bottom:1px solid #2a2a4a;vertical-align:middle;}
    tr:hover td{background:#1f1f3a;}
    select{background:#0f3460;color:white;padding:7px 12px;border:1px solid #e94560;border-radius:4px;font-size:14px;cursor:pointer;width:160px;}
    button{background:#e94560;color:white;padding:13px 35px;border:none;border-radius:5px;font-size:16px;cursor:pointer;margin-top:20px;}
    button:hover{background:#c73652;}#status{margin-top:15px;font-size:16px;color:#4ecca3;font-weight:bold;}
    .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:bold;margin-left:10px;background:${currentState === "ingame" ? "#4ecca3" : "#e94560"};color:#1a1a2e;}
  </style></head><body>
    <h1>🎮 MLBB Role Assignment <span class="badge">${currentState.toUpperCase()}</span></h1>
    <div class="info">🔑 Battle ID: ${BATTLE_ID}</div>
    <p>Assign roles once — applies to both ingame and postgame automatically.</p>
    <h2>LEFT TEAM — ${cachedData.left_team.name}</h2>
    <table><tr><th>Hero</th><th>Player</th><th>Role</th></tr>${makeRows(cachedData.left_team.players)}</table>
    <h2>RIGHT TEAM — ${cachedData.right_team.name}</h2>
    <table><tr><th>Hero</th><th>Player</th><th>Role</th></tr>${makeRows(cachedData.right_team.players)}</table>
    <button onclick="saveRoles()">💾 Save Role Assignments</button>
    <div id="status"></div>
    <script>
      function saveRoles() {
        const selects = document.querySelectorAll("select");
        const assignments = {}; let missing = false;
        selects.forEach(s => { if (!s.value) missing = true; else assignments[s.name] = s.value; });
        if (missing) { document.getElementById("status").style.color="#e94560"; document.getElementById("status").innerText="⚠️ Please assign all roles before saving!"; return; }
        fetch("/assign", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(assignments) })
        .then(r=>r.json()).then(()=>{ document.getElementById("status").style.color="#4ecca3"; document.getElementById("status").innerText="✅ Roles saved!"; })
        .catch(()=>{ document.getElementById("status").style.color="#e94560"; document.getElementById("status").innerText="❌ Error saving."; });
      }
    </script>
  </body></html>`);
});

// ================================================================
// INGAME PLAYER CLEANER
// ================================================================

function cleanIngamePlayer(p) {
  const equips = Array.isArray(p.equip_list) ? p.equip_list : [];
  const equipSlots = Array.from({ length: 6 }, (_, i) => {
    const id = equips[i] ?? null;
    return { id: id ?? "blank", image: itemImg(id) };
  });
  const maxHp = p.max_health_point || 0;
  const curHp = p.cur_health_point || 0;
  const hpPct = maxHp > 0 ? Math.round((curHp / maxHp) * 100) : 0;
  const maxMana = p.max_mana || 0;
  const curMana = p.cur_mana || 0;
  const manaPct = maxMana > 0 ? Math.round((curMana / maxMana) * 100) : 0;
  const runeId = p.rune_id || "";
  const runeMap = p.rune_map || {};
  const talent1 = runeMap["1"] ?? "";
  const talent2 = runeMap["2"] ?? "";
  const talent3 = runeMap["3"] ?? "";
  if (runeId && p.roleid) storedRuneIds[String(p.roleid)] = runeId;
  const reviveLeftTime =
    p.revive_left_time ??
    p.revive_time ??
    p.reviveTime ??
    p.relive_left_time ??
    p.dead_left_time ??
    0;
  const isDead = Boolean(p.dead) || Number(reviveLeftTime) > 0;

  return {
    name: p.name ?? "",
    role: roleAssignments[String(p.roleid)] ?? "unassigned",
    roleid: String(p.roleid ?? ""),
    playerpic_image: playerpicImg(p.roleid),
    heroid: p.heroid ?? "",
    hero_image: heroImg(p.heroid), // ✅ /images/heroes/
    ingame_hero_image: heroImg(p.heroid), // ✅ /images/heroes/
    draft_hero_image: p.heroid
      ? `http://localhost:${PORT}/drafthero-image/${String(p.heroid).trim()}.png`
      : "", // ✅ /images/drafthero-image/ with .png
    campid: p.campid ?? "",
    pos: p.pos ?? 0,
    kill_num: p.kill_num ?? 0,
    dead_num: p.dead_num ?? 0,
    assist_num: p.assist_num ?? 0,
    kda: `${p.kill_num ?? 0} / ${p.dead_num ?? 0} / ${p.assist_num ?? 0}`,
    gold: p.gold ?? 0,
    gold_k: formatGold(p.gold),
    max_hp: maxHp,
    cur_hp: curHp,
    hp_pct: hpPct,
    hp_bar: `${hpPct}%`,
    max_mana: maxMana,
    cur_mana: curMana,
    mana_pct: manaPct,
    mana_bar: `${manaPct}%`,
    dead: isDead,
    revive_left_time: reviveLeftTime,
    level: p.level ?? 0,
    total_damage: p.total_damage ?? 0,
    total_hurt: p.total_hurt ?? 0,
    total_heal: p.total_heal ?? 0,
    total_damage_tower: p.total_damage_tower ?? 0,
    total_heal_other: p.total_heal_other ?? 0,
    xpm: p.xpm ?? 0,
    skillid: p.skillid ?? "",
    spell_image: spellImg(p.skillid),
    skill_left_time: p.skill_left_time ?? 0,
    control_time_ms: p.control_time_ms ?? 0,
    physical_defense: p.physical_defense ?? 0,
    magic_defense: p.magic_defense ?? 0,
    map_pos_x: p.map_pos?.x ?? 0,
    map_pos_y: p.map_pos?.y ?? 0,
    rune_id: runeId,
    rune_image: emblemImg(runeId),
    rune_talent_1: talent1,
    rune_talent_2: talent2,
    rune_talent_3: talent3,
    rune_talent_1_image: talentImg(talent1),
    rune_talent_2_image: talentImg(talent2),
    rune_talent_3_image: talentImg(talent3),
    equips: equipSlots,
  };
}

function emptyPlayer() {
  return {
    name: "",
    role: "unassigned",
    roleid: "",
    playerpic_image: "",
    heroid: "",
    hero_image: "",
    ingame_hero_image: "",
    draft_hero_image: "",
    campid: "",
    pos: 0,
    kill_num: 0,
    dead_num: 0,
    assist_num: 0,
    kda: "0 / 0 / 0",
    gold: 0,
    gold_k: "0",
    max_hp: 0,
    cur_hp: 0,
    hp_pct: 0,
    hp_bar: "0%",
    max_mana: 0,
    cur_mana: 0,
    mana_pct: 0,
    mana_bar: "0%",
    dead: false,
    revive_left_time: 0,
    level: 0,
    total_damage: 0,
    total_hurt: 0,
    total_heal: 0,
    total_damage_tower: 0,
    total_heal_other: 0,
    xpm: 0,
    skillid: "",
    spell_image: "",
    skill_left_time: 0,
    control_time_ms: 0,
    physical_defense: 0,
    magic_defense: 0,
    map_pos_x: 0,
    map_pos_y: 0,
    rune_id: "",
    rune_image: "",
    rune_talent_1: "",
    rune_talent_2: "",
    rune_talent_3: "",
    rune_talent_1_image: "",
    rune_talent_2_image: "",
    rune_talent_3_image: "",
    left_gold_diff: "",
    right_gold_diff: "",
    gold_leader: "even",
    equips: Array.from({ length: 6 }, () => ({
      id: "blank",
      image: itemImg(null),
    })),
  };
}

function cleanIngame(raw) {
  const campList = raw?.data?.camp_list || [];
  const gameTime = raw?.data?.game_time || 0;
  const eventList = raw?.data?.incre_event_list || [];
  const leftCamp = campList.find((c) => c.campid === 1) || {};
  const rightCamp = campList.find((c) => c.campid === 2) || {};

  let leftPlayers = (leftCamp.player_list || []).map(cleanIngamePlayer);
  let rightPlayers = (rightCamp.player_list || []).map(cleanIngamePlayer);

  if (Object.keys(roleAssignments).length > 0) {
    leftPlayers = sortByRole(leftPlayers);
    rightPlayers = sortByRole(rightPlayers);
  } else {
    while (leftPlayers.length < 5) leftPlayers.push(emptyPlayer());
    while (rightPlayers.length < 5) rightPlayers.push(emptyPlayer());
  }

  const leftKills = eventList.filter(
    (e) => e.event_type === "camp_kill_hero" && e.campid === 1,
  ).length;
  const rightKills = eventList.filter(
    (e) => e.event_type === "camp_kill_hero" && e.campid === 2,
  ).length;
  const goldDiff = calcGoldDiffs(leftPlayers, rightPlayers, "gold");

  leftPlayers = leftPlayers.map((p, i) => ({
    ...p,
    left_gold_diff: goldDiff[ROLE_ORDER[i]]?.left_gold_diff ?? "",
    right_gold_diff: goldDiff[ROLE_ORDER[i]]?.right_gold_diff ?? "",
    gold_leader: goldDiff[ROLE_ORDER[i]]?.leader ?? "even",
  }));
  rightPlayers = rightPlayers.map((p, i) => ({
    ...p,
    left_gold_diff: goldDiff[ROLE_ORDER[i]]?.left_gold_diff ?? "",
    right_gold_diff: goldDiff[ROLE_ORDER[i]]?.right_gold_diff ?? "",
    gold_leader: goldDiff[ROLE_ORDER[i]]?.leader ?? "even",
  }));

  return {
    state: "ingame",
    game_time: gameTime,
    game_time_fmt: formatTime(gameTime),
    gold_diff: {
      exp: goldDiff["exp"],
      mid: goldDiff["mid"],
      roam: goldDiff["roam"],
      jungle: goldDiff["jungle"],
      gold: goldDiff["gold"],
    },
    left_team: {
      name: leftCamp.team_name ?? "LEFT",
      total_kills: leftKills,
      kill_lord: leftCamp.kill_lord ?? 0,
      kill_tower: leftCamp.kill_tower ?? 0,
      kill_tortoise: leftCamp.kill_tortoise ?? 0,
      players: leftPlayers,
    },
    right_team: {
      name: rightCamp.team_name ?? "RIGHT",
      total_kills: rightKills,
      kill_lord: rightCamp.kill_lord ?? 0,
      kill_tower: rightCamp.kill_tower ?? 0,
      kill_tortoise: rightCamp.kill_tortoise ?? 0,
      players: rightPlayers,
    },
    all_players: [...leftPlayers, ...rightPlayers],
  };
}

// ================================================================
// POSTGAME PLAYER CLEANER
// ================================================================

function cleanPostgamePlayer(p) {
  const equips = Array.isArray(p.equip_list) ? p.equip_list.slice(0, 6) : [];
  const equipSlots = Array.from({ length: 6 }, (_, i) => {
    const id = equips[i] ?? null;
    return { id: id ?? "blank", image: itemImg(id) };
  });
  const runeMap = p.rune_map || {};
  const talent1 = runeMap["1"] ?? "";
  const talent2 = runeMap["2"] ?? "";
  const talent3 = runeMap["3"] ?? "";
  const runeId = p.rune_id || storedRuneIds[String(p.roleid)] || "";
  const reviveLeftTime =
    p.revive_left_time ??
    p.revive_time ??
    p.reviveTime ??
    p.relive_left_time ??
    p.dead_left_time ??
    0;
  const isDead = Boolean(p.dead) || Number(reviveLeftTime) > 0;

  return {
    name: p.name ?? "",
    role: roleAssignments[String(p.roleid)] ?? "unassigned",
    roleid: String(p.roleid ?? ""),
    playerpic_image: playerpicImg(p.roleid),
    heroid: p.heroid ?? "",
    hero_image: postHeroImg(p.heroid), // ✅ /images/postheros/
    draft_hero_image: p.heroid
      ? `http://localhost:${PORT}/drafthero-image/${String(p.heroid).trim()}.png`
      : "", // ✅ /images/drafthero-image/ with .png
    campid: p.campid ?? "",
    kill_num: p.kill_num ?? 0,
    dead_num: p.dead_num ?? 0,
    assist_num: p.assist_num ?? 0,
    kda: `${p.kill_num ?? 0} / ${p.dead_num ?? 0} / ${p.assist_num ?? 0}`,
    total_money: p.total_money ?? p.gold ?? 0,
    total_money_k: formatGold(p.total_money ?? p.gold),
    min_money: p.min_money ?? 0,
    total_damage: p.total_damage ?? 0,
    total_hurt: p.total_hurt ?? 0,
    total_heal: p.total_heal ?? 0,
    total_damage_tower: p.total_damage_tower ?? 0,
    total_heal_other: p.total_heal_other ?? 0,
    min_damage: p.min_damage ?? 0,
    level: p.level ?? 0,
    dead: isDead,
    revive_left_time: reviveLeftTime,
    score: p.score ?? 0,
    mvp: p.mvp ?? false,
    money_percent: p.money_percent ?? 0,
    offered_rate: p.offered_rate ?? 0,
    skillid: p.skillid ?? "",
    spell_image: spellImg(p.skillid),
    skill_use_times: p.skill_use_times ?? 0,
    xpm: p.xpm ?? 0,
    rune_id: runeId,
    rune_image: emblemImg(runeId),
    rune_talent_1: talent1,
    rune_talent_2: talent2,
    rune_talent_3: talent3,
    rune_talent_1_image: talentImg(talent1),
    rune_talent_2_image: talentImg(talent2),
    rune_talent_3_image: talentImg(talent3),
    equips: equipSlots,
  };
}

function emptyPostgamePlayer() {
  return {
    name: "",
    role: "unassigned",
    roleid: "",
    playerpic_image: "",
    heroid: "",
    hero_image: "",
    draft_hero_image: "",
    campid: "",
    kill_num: 0,
    dead_num: 0,
    assist_num: 0,
    kda: "0 / 0 / 0",
    total_money: 0,
    total_money_k: "0",
    min_money: 0,
    total_damage: 0,
    total_hurt: 0,
    total_heal: 0,
    total_damage_tower: 0,
    total_heal_other: 0,
    min_damage: 0,
    level: 0,
    dead: false,
    revive_left_time: 0,
    score: 0,
    mvp: false,
    money_percent: 0,
    offered_rate: 0,
    skillid: "",
    spell_image: "",
    skill_use_times: 0,
    xpm: 0,
    rune_id: "",
    rune_image: "",
    rune_talent_1: "",
    rune_talent_2: "",
    rune_talent_3: "",
    rune_talent_1_image: "",
    rune_talent_2_image: "",
    rune_talent_3_image: "",
    left_gold_diff: "",
    right_gold_diff: "",
    gold_leader: "even",
    equips: Array.from({ length: 6 }, () => ({
      id: "blank",
      image: itemImg(null),
    })),
  };
}

function cleanPostgame(raw) {
  const campList = raw?.data?.camp_list || [];
  const gameTime = raw?.data?.game_time || 0;
  const winCamp = raw?.data?.win_camp || 0;
  const leftCamp = campList.find((c) => c.campid === 1) || {};
  const rightCamp = campList.find((c) => c.campid === 2) || {};
  const heroList = raw?.data?.hero_list || [
    ...(leftCamp.player_list || []),
    ...(rightCamp.player_list || []),
  ];

  let leftPlayers = heroList
    .filter((p) => p.campid === 1)
    .map(cleanPostgamePlayer);
  let rightPlayers = heroList
    .filter((p) => p.campid === 2)
    .map(cleanPostgamePlayer);

  if (Object.keys(roleAssignments).length > 0) {
    leftPlayers = sortByRolePost(leftPlayers);
    rightPlayers = sortByRolePost(rightPlayers);
  } else {
    while (leftPlayers.length < 5) leftPlayers.push(emptyPostgamePlayer());
    while (rightPlayers.length < 5) rightPlayers.push(emptyPostgamePlayer());
  }

  const leftGoldRaw = leftPlayers.reduce(
    (s, p) => s + (Number(p.total_money) || 0),
    0,
  );
  const rightGoldRaw = rightPlayers.reduce(
    (s, p) => s + (Number(p.total_money) || 0),
    0,
  );
  const leftKills = rightPlayers.reduce(
    (s, p) => s + (Number(p.dead_num) || 0),
    0,
  );
  const rightKills = leftPlayers.reduce(
    (s, p) => s + (Number(p.dead_num) || 0),
    0,
  );
  const goldDiff = calcGoldDiffs(leftPlayers, rightPlayers, "total_money");

  leftPlayers = leftPlayers.map((p, i) => ({
    ...p,
    left_gold_diff: goldDiff[ROLE_ORDER[i]]?.left_gold_diff ?? "",
    right_gold_diff: goldDiff[ROLE_ORDER[i]]?.right_gold_diff ?? "",
    gold_leader: goldDiff[ROLE_ORDER[i]]?.leader ?? "even",
  }));
  rightPlayers = rightPlayers.map((p, i) => ({
    ...p,
    left_gold_diff: goldDiff[ROLE_ORDER[i]]?.left_gold_diff ?? "",
    right_gold_diff: goldDiff[ROLE_ORDER[i]]?.right_gold_diff ?? "",
    gold_leader: goldDiff[ROLE_ORDER[i]]?.leader ?? "even",
  }));

  return {
    state: "postgame",
    game_time: gameTime,
    game_time_fmt: formatTime(gameTime),
    win_camp: winCamp,
    gold_diff: {
      exp: goldDiff["exp"],
      mid: goldDiff["mid"],
      roam: goldDiff["roam"],
      jungle: goldDiff["jungle"],
      gold: goldDiff["gold"],
    },
    left_team: {
      name: leftCamp.team_name ?? "LEFT",
      win: winCamp === 1,
      total_kills: leftKills,
      total_gold: formatGold(leftGoldRaw),
      kill_lord: leftCamp.kill_lord ?? 0,
      kill_tower: leftCamp.kill_tower ?? 0,
      kill_tortoise: leftCamp.kill_totoise ?? 0,
      players: leftPlayers,
    },
    right_team: {
      name: rightCamp.team_name ?? "RIGHT",
      win: winCamp === 2,
      total_kills: rightKills,
      total_gold: formatGold(rightGoldRaw),
      kill_lord: rightCamp.kill_lord ?? 0,
      kill_tower: rightCamp.kill_tower ?? 0,
      kill_tortoise: rightCamp.kill_totoise ?? 0,
      players: rightPlayers,
    },
    all_players: [...leftPlayers, ...rightPlayers],
  };
}

// ================================================================
// START
// ================================================================

server.listen(PORT, () => {
  const B = `http://localhost:${PORT}`;
  const W = `ws://localhost:${PORT}/ws`;
  console.log(`\n✅ Server started on port ${PORT}`);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📋  ALL ENDPOINTS — copy these into vMix`);
  console.log(`${"=".repeat(60)}`);
  console.log(`\n🎮  ROLE ASSIGNMENT (open in browser)`);
  console.log(`   ${B}/assign`);
  console.log(`\n📡  INGAME DATA`);
  console.log(`   ${B}/ingame                   → full ingame snapshot`);
  console.log(`   ${B}/players                  → all 10 players (ingame)`);
  console.log(`   ${B}/players/left             → left team players`);
  console.log(`   ${B}/players/right            → right team players`);
  console.log(`   ${B}/golddiff                 → per-role gold diff`);
  console.log(`\n🏆  POSTGAME DATA`);
  console.log(`   ${B}/postgame                 → full postgame snapshot`);
  console.log(`   ${B}/postgame/players         → all 10 players (postgame)`);
  console.log(`   ${B}/postgame/players/left    → left team players`);
  console.log(`   ${B}/postgame/players/right   → right team players`);
  console.log(`   ${B}/postgame/golddiff        → per-role gold diff`);
  console.log(`\n🔄  LIVE / COMBINED`);
  console.log(
    `   ${B}/data                     → current state (ingame or postgame)`,
  );
  console.log(`   ${W}?endpoint=data            → websocket current state`);
  console.log(`   ${W}?endpoint=postgame        → websocket postgame state`);
  console.log(`\n🖼️   IMAGE ENDPOINTS`);
  console.log(`   ${B}/hero-image/:heroid        → ingame hero image`);
  console.log(`   ${B}/posthero-image/:heroid    → postgame hero image`);
  console.log(
    `   ${B}/drafthero-image/:heroid.png → draft hero image (.png supported)`,
  );
  console.log(`   ${B}/emblem-image/:runeid      → emblem / rune image`);
  console.log(`   ${B}/talent-image/:talentid    → talent image`);
  console.log(`   ${B}/spell-image/:skillid      → spell image`);
  console.log(`   ${B}/playerpic/:roleid         → player picture`);
  console.log(`\n📝  TXT FILES (for vMix text sources)`);
  console.log(`   ${B}/txt/timer.txt`);
  console.log(`   ${B}/txt/left_gold.txt         ${B}/txt/right_gold.txt`);
  console.log(`   ${B}/txt/leftdiff.txt          ${B}/txt/rightdiff.txt`);
  console.log(`   ${B}/txt/left_score.txt        ${B}/txt/right_score.txt`);
  console.log(`   ${B}/txt/left_lord.txt         ${B}/txt/right_lord.txt`);
  console.log(`   ${B}/txt/left_tower.txt        ${B}/txt/right_tower.txt`);
  console.log(`   ${B}/txt/left_turtle.txt       ${B}/txt/right_turtle.txt`);
  console.log(`\n🔬  RAW API (debug)`);
  console.log(`   ${B}/raw                       → raw ingame API response`);
  console.log(`   ${B}/raw/post                  → raw postgame API response`);
  console.log(`\n${"=".repeat(60)}\n`);
  askBattleId();
});
