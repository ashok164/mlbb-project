const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

const API_URL = "https://esportsdata-sg.mobilelegends.com/battledata?authkey=1c7c9de5798a010e8f7da8ab5b82d953&battleid=599509382542789911";

app.use("/images", express.static("C:/vMixData/images"));
app.use(express.json());

let cachedData = null;
let roleAssignments = {};

const ROLE_ORDER = ["exp", "mid", "roam", "jungle", "gold"];

// ✅ Auto-refresh every 1 second
setInterval(async () => {
  try {
    const response = await fetch(API_URL, {
      headers: { "Authorization": "Bearer 1c7c9de5798a010e8f7da8ab5b82d953" }
    });
    const raw = await response.json();
    cachedData = cleanData(raw);
  } catch (err) {
    console.error("Cache refresh error:", err.message);
  }
}, 1000);

// ✅ Raw endpoint
app.get("/raw", async (req, res) => {
  try {
    const response = await fetch(API_URL, {
      headers: { "Authorization": "Bearer 1c7c9de5798a010e8f7da8ab5b82d953" }
    });
    const raw = await response.json();
    res.json(raw);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Serve hero image by heroid
app.get("/hero-image/:heroid", (req, res) => {
  const heroid = req.params.heroid;
  const jpg = `C:/Users/suhas/Desktop/vmixData/images/heroes/${heroid}.jpg`;
  const png = `C:/Users/suhas/Desktop/vmixData/images/heroes/${heroid}.png`;

  if (fs.existsSync(jpg)) {
    res.sendFile(jpg);
  } else if (fs.existsSync(png)) {
    res.sendFile(png);
  } else {
    res.status(404).send("Image not found");
  }
});

// ✅ Save role assignments
app.post("/assign", (req, res) => {
  roleAssignments = req.body;
  console.log("✅ Role assignments saved:", roleAssignments);
  res.json({ success: true });
});

// ✅ Role assignment UI with hero images
app.get("/assign", (req, res) => {
  if (!cachedData) return res.send(`
    <html>
    <body style="background:#1a1a2e; color:white; font-family:Arial; padding:30px;">
      <h2>⏳ Data not ready yet. Please wait and refresh the page.</h2>
    </body>
    </html>
  `);

  const roles = ["exp", "mid", "roam", "jungle", "gold"];

  const makeRows = (players) => players.map(p => `
    <tr>
      <td>
        <img
          src="http://localhost:${PORT}/hero-image/${p.heroid}"
          width="55" height="55"
          style="border-radius:8px; object-fit:cover; border: 2px solid #e94560;"
          onerror="this.style.display='none'"
        />
      </td>
      <td style="font-weight:bold;">${p.name}</td>
      <td>
        <select name="${p.roleid}" id="${p.roleid}">
          <option value="">-- Select Role --</option>
          ${roles.map(r => `
            <option value="${r}" ${roleAssignments[p.roleid] === r ? "selected" : ""}>
              ${r.toUpperCase()}
            </option>
          `).join("")}
        </select>
      </td>
    </tr>
  `).join("");

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Role Assignment</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          background: #1a1a2e;
          color: white;
          padding: 30px;
        }
        h1 { color: #e94560; margin-bottom: 5px; }
        p { color: #aaa; margin-top: 0; }
        h2 {
          color: white;
          background: #e94560;
          padding: 8px 15px;
          border-radius: 5px;
          display: inline-block;
          margin-top: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 10px;
        }
        th {
          background: #0f3460;
          padding: 10px 12px;
          text-align: left;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #2a2a4a;
          vertical-align: middle;
        }
        tr:hover td { background: #1f1f3a; }
        select {
          background: #0f3460;
          color: white;
          padding: 7px 12px;
          border: 1px solid #e94560;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          width: 160px;
        }
        select:focus { outline: none; border-color: #4ecca3; }
        button {
          background: #e94560;
          color: white;
          padding: 13px 35px;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 20px;
          letter-spacing: 1px;
        }
        button:hover { background: #c73652; }
        #status {
          margin-top: 15px;
          font-size: 16px;
          color: #4ecca3;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <h2> MLBB Role Assignment</h2>
      

      <h3>LEFT TEAM — ${cachedData.left_team.name}</h3>
      <table>
        <tr>
          <th>Hero</th>
          <th>Player</th>
          <th>Role</th>
        </tr>
        ${makeRows(cachedData.left_team.players)}
      </table>

      <h3>RIGHT TEAM — ${cachedData.right_team.name}</h3>
      <table>
        <tr>
          <th>Hero</th>
          <th>Player</th>
          <th>Role</th>
        </tr>
        ${makeRows(cachedData.right_team.players)}
      </table>

      <button onclick="saveRoles()"> Save Role Assignments</button>
      <div id="status"></div>

      <script>
        function saveRoles() {
          const selects = document.querySelectorAll("select");
          const assignments = {};
          let missing = false;

          selects.forEach(s => {
            if (!s.value) missing = true;
            else assignments[s.name] = s.value;
          });

          if (missing) {
            document.getElementById("status").style.color = "#e94560";
            document.getElementById("status").innerText = " Please assign all roles before saving!";
            return;
          }

          fetch("/assign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(assignments)
          })
          .then(r => r.json())
          .then(() => {
            document.getElementById("status").style.color = "#4ecca3";
            document.getElementById("status").innerText = "✅ Roles saved! vMix data is now sorted by role.";
          })
          .catch(() => {
            document.getElementById("status").style.color = "#e94560";
            document.getElementById("status").innerText = " Error saving roles. Please try again.";
          });
        }
      </script>
    </body>
    </html>
  `);
});

// ✅ Full data endpoint
app.get("/data", (req, res) => {
  if (cachedData) res.json(cachedData);
  else res.status(503).json({ error: "Data not ready yet" });
});

// ✅ All 10 players flat for vMix table
app.get("/players", (req, res) => {
  if (cachedData) res.json(cachedData.all_players);
  else res.status(503).json({ error: "Data not ready yet" });
});

// ✅ Left players only
app.get("/players/left", (req, res) => {
  if (cachedData) res.json(cachedData.left_team.players);
  else res.status(503).json({ error: "Data not ready yet" });
});

// ✅ Right players only
app.get("/players/right", (req, res) => {
  if (cachedData) res.json(cachedData.right_team.players);
  else res.status(503).json({ error: "Data not ready yet" });
});

function formatGold(val) {
  const n = Number(val) || 0;
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins} : ${String(secs).padStart(2, "0")}`;
}

function cleanPlayer(p) {
  const equips = Array.isArray(p.equip_list) ? p.equip_list : [];
  const equipSlots = Array.from({ length: 6 }, (_, i) => {
    const id = equips[i] ?? null;
    return {
      id:    id ?? "blank",
      image: id
        ? `C:/Users/suhas/Desktop/vmixData/images/items/${id}.png`
        : `C:/Users/suhas/Desktop/vmixData/images/items/blank.png`
    };
  });

  const maxHp   = p.max_health_point || 0;
  const curHp   = p.cur_health_point || 0;
  const hpPct   = maxHp > 0 ? Math.round((curHp / maxHp) * 100) : 0;
  const maxMana = p.max_mana || 0;
  const curMana = p.cur_mana || 0;
  const manaPct = maxMana > 0 ? Math.round((curMana / maxMana) * 100) : 0;

  return {
    name:               p.name               ?? "",
    roleid:             String(p.roleid       ?? ""),
    heroid:             p.heroid              ?? "",
    hero_image:         p.heroid ? `C:/Users/suhas/Desktop/vmixData/images/heroes/${p.heroid}.jpg` : "",
    campid:             p.campid              ?? "",
    pos:                p.pos                 ?? 0,
    role:               roleAssignments[String(p.roleid)] ?? "unassigned",

    kill_num:           p.kill_num            ?? 0,
    dead_num:           p.dead_num            ?? 0,
    assist_num:         p.assist_num          ?? 0,
    kda:                `${p.kill_num ?? 0} / ${p.dead_num ?? 0} / ${p.assist_num ?? 0}`,

    gold:               p.gold                ?? 0,
    gold_k:             formatGold(p.gold),

    max_hp:             maxHp,
    cur_hp:             curHp,
    hp_pct:             hpPct,
    hp_bar:             `${hpPct}%`,

    max_mana:           maxMana,
    cur_mana:           curMana,
    mana_pct:           manaPct,
    mana_bar:           `${manaPct}%`,

    dead:               p.dead                ?? false,
    revive_left_time:   p.revive_left_time    ?? 0,
    level:              p.level               ?? 0,

    total_damage:       p.total_damage        ?? 0,
    total_hurt:         p.total_hurt          ?? 0,
    total_heal:         p.total_heal          ?? 0,
    total_damage_tower: p.total_damage_tower  ?? 0,
    total_heal_other:   p.total_heal_other    ?? 0,

    xpm:                p.xpm                 ?? 0,
    skillid:            p.skillid             ?? "",
    skill_left_time:    p.skill_left_time     ?? 0,
    major_left_time:    p.major_left_time     ?? 0,
    control_time_ms:    p.control_time_ms     ?? 0,
    physical_defense:   p.physical_defense    ?? 0,
    magic_defense:      p.magic_defense       ?? 0,
    map_pos_x:          p.map_pos?.x          ?? 0,
    map_pos_y:          p.map_pos?.y          ?? 0,

    equips: equipSlots
  };
}

function emptyPlayer() {
  return {
    name: "", roleid: "", heroid: "", hero_image: "", campid: "", pos: 0,
    role: "unassigned",
    kill_num: 0, dead_num: 0, assist_num: 0, kda: "0 / 0 / 0",
    gold: 0, gold_k: "0",
    max_hp: 0, cur_hp: 0, hp_pct: 0, hp_bar: "0%",
    max_mana: 0, cur_mana: 0, mana_pct: 0, mana_bar: "0%",
    dead: false, revive_left_time: 0, level: 0,
    total_damage: 0, total_hurt: 0, total_heal: 0,
    total_damage_tower: 0, total_heal_other: 0,
    xpm: 0, skillid: "", skill_left_time: 0, control_time_ms: 0,
    major_left_time: 0,
    physical_defense: 0, magic_defense: 0,
    map_pos_x: 0, map_pos_y: 0,
    equips: Array.from({ length: 6 }, () => ({
      id: "blank",
      image: "C:/Users/suhas/Desktop/vmixData/images/items/blank.png"
    }))
  };
}

function sortByRole(players) {
  return ROLE_ORDER.map(role => {
    return players.find(p => roleAssignments[String(p.roleid)] === role) || emptyPlayer();
  });
}

function cleanData(raw) {
  const campList  = raw?.data?.camp_list        || [];
  const gameTime  = raw?.data?.game_time        || 0;
  const eventList = raw?.data?.incre_event_list || [];

  const leftCamp  = campList.find(c => c.campid === 1) || {};
  const rightCamp = campList.find(c => c.campid === 2) || {};

  let leftPlayers  = (leftCamp.player_list  || []).map(cleanPlayer);
  let rightPlayers = (rightCamp.player_list || []).map(cleanPlayer);

  if (Object.keys(roleAssignments).length > 0) {
    leftPlayers  = sortByRole(leftPlayers);
    rightPlayers = sortByRole(rightPlayers);
  } else {
    while (leftPlayers.length  < 5) leftPlayers.push(emptyPlayer());
    while (rightPlayers.length < 5) rightPlayers.push(emptyPlayer());
  }

  const leftKills  = eventList.filter(e => e.event_type === "camp_kill_hero" && e.campid === 1).length;
  const rightKills = eventList.filter(e => e.event_type === "camp_kill_hero" && e.campid === 2).length;

  return {
    game_time:     gameTime,
    game_time_fmt: formatTime(gameTime),

    left_team: {
      name:        leftCamp.team_name  ?? "LEFT",
      total_kills: leftKills,
      players:     leftPlayers
    },

    right_team: {
      name:        rightCamp.team_name ?? "RIGHT",
      total_kills: rightKills,
      players:     rightPlayers
    },

    // ✅ Flat: left [0-4] EXP/MID/ROAM/JUNGLE/GOLD then right [5-9] same order
    all_players: [...leftPlayers, ...rightPlayers]
  };
}

app.listen(PORT, () => {
  console.log(`✅ Server running   → http://localhost:${PORT}/data`);
  console.log(`✅ All players      → http://localhost:${PORT}/players`);
  console.log(`✅ Left players     → http://localhost:${PORT}/players/left`);
  console.log(`✅ Right players    → http://localhost:${PORT}/players/right`);
  console.log(`✅ Role assignment  → http://localhost:${PORT}/assign`);
  console.log(`✅ Raw API debug    → http://localhost:${PORT}/raw`);
  console.log(`✅ Images served    → http://localhost:${PORT}/images/`);
});
