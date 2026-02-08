import { useState, useEffect, useCallback, useMemo } from "react";

/* ══════════════════════════════════════════════════════════════
   LIFE RPG v3 — THE COMPLETE GAME
   Features: Recurring dailies, energy system, editable presets,
   data export/import, settings, full skill trees, activity log
   with delete, achievements, streak system
   ══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "life-rpg-v3";
const DAY_MS = 86400000;

/* ─── Helpers ─── */
const xpForLevel = (lv) => Math.floor(100 * Math.pow(1.15, lv - 1));
const getLevel = (totalXp) => {
  let lv = 1, rem = totalXp;
  while (rem >= xpForLevel(lv)) { rem -= xpForLevel(lv); lv++; }
  return { level: lv, currentXp: rem, needed: xpForLevel(lv) };
};
const getStatLevel = (xp) => getLevel(xp).level;
const todayStr = () => new Date().toDateString();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const load = () => { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
const save = (d) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} };

/* ─── Default Data ─── */
const DEFAULT_STATS = [
  { name: "Strength", icon: "⚔️", xp: 0, color: "#e74c3c" },
  { name: "Intelligence", icon: "🧠", xp: 0, color: "#3498db" },
  { name: "Charisma", icon: "✨", xp: 0, color: "#f39c12" },
  { name: "Discipline", icon: "🛡️", xp: 0, color: "#2ecc71" },
  { name: "Creativity", icon: "🎨", xp: 0, color: "#9b59b6" },
  { name: "Spirit", icon: "🔮", xp: 0, color: "#1abc9c" },
];

const QUEST_TYPES = [
  { key: "main", label: "Main Quest", icon: "⚡", color: "#f1c40f", xp: 50 },
  { key: "side", label: "Side Quest", icon: "📜", color: "#3498db", xp: 25 },
  { key: "daily", label: "Daily Quest", icon: "☀️", color: "#2ecc71", xp: 10 },
  { key: "boss", label: "Boss Fight", icon: "🐉", color: "#e74c3c", xp: 100 },
  { key: "shadow", label: "Shadow Dungeon", icon: "🌑", color: "#8e44ad", xp: 75 },
];

const DEFAULT_ACTIVITIES = [
  { id: "lift", name: "Lifted Weights", icon: "🏋️", stat: 0, xp: 15 },
  { id: "cardio", name: "Cardio Session", icon: "🏃", stat: 0, xp: 10 },
  { id: "stretch", name: "Stretched / Mobility", icon: "🤸", stat: 0, xp: 8 },
  { id: "diet", name: "Clean Diet Day", icon: "🥗", stat: 3, xp: 10 },
  { id: "no_vice", name: "No Vices Today", icon: "🚫", stat: 3, xp: 10 },
  { id: "early_wake", name: "Woke Up Early", icon: "🌅", stat: 3, xp: 8 },
  { id: "read", name: "Read a Book", icon: "📚", stat: 1, xp: 15 },
  { id: "course", name: "Took a Course / Lesson", icon: "🎓", stat: 1, xp: 20 },
  { id: "code", name: "Coded / Built Something", icon: "💻", stat: 1, xp: 15 },
  { id: "meditate", name: "Meditated", icon: "🧘", stat: 5, xp: 12 },
  { id: "journal", name: "Journaled", icon: "📝", stat: 5, xp: 10 },
  { id: "shadow_work", name: "Shadow Work", icon: "🌑", stat: 5, xp: 20 },
  { id: "network", name: "Networked / Outreach", icon: "🤝", stat: 2, xp: 15 },
  { id: "cold_call", name: "Cold Outreach / Sales", icon: "📞", stat: 2, xp: 20 },
  { id: "content", name: "Created Content", icon: "🎬", stat: 4, xp: 20 },
  { id: "creative", name: "Creative Project", icon: "🎨", stat: 4, xp: 15 },
];

const DEFAULT_SKILL_TREES = [
  {
    id: "warrior", name: "Warrior Path", icon: "⚔️", desc: "Physical mastery and iron discipline", color: "#e74c3c",
    nodes: [
      { id: "w1", name: "Consistent Training", desc: "Train 3x/week minimum", tier: 0, req: { Strength: 1, Discipline: 1 }, unlocked: false },
      { id: "w2", name: "Progressive Overload", desc: "Track & increase lifts monthly", tier: 1, req: { Strength: 3, Discipline: 2 }, unlocked: false, parent: "w1" },
      { id: "w3", name: "Nutrition Protocol", desc: "Dial in macros & meal prep", tier: 1, req: { Strength: 2, Discipline: 4 }, unlocked: false, parent: "w1" },
      { id: "w4", name: "Advanced Programming", desc: "Run periodized programs", tier: 2, req: { Strength: 6, Intelligence: 3, Discipline: 5 }, unlocked: false, parent: "w2" },
      { id: "w5", name: "Peak Physique", desc: "Reach ideal body composition", tier: 3, req: { Strength: 10, Discipline: 8, Spirit: 3 }, unlocked: false, parent: "w4" },
    ],
  },
  {
    id: "scholar", name: "Scholar Path", icon: "🧠", desc: "Knowledge acquisition and mastery", color: "#3498db",
    nodes: [
      { id: "s1", name: "Daily Reading", desc: "Read 30+ min daily", tier: 0, req: { Intelligence: 1, Discipline: 1 }, unlocked: false },
      { id: "s2", name: "Deep Expertise", desc: "Master one domain deeply", tier: 1, req: { Intelligence: 4, Discipline: 3 }, unlocked: false, parent: "s1" },
      { id: "s3", name: "Teaching Others", desc: "Teach what you know", tier: 1, req: { Intelligence: 3, Charisma: 3 }, unlocked: false, parent: "s1" },
      { id: "s4", name: "Systems Thinking", desc: "Connect patterns across domains", tier: 2, req: { Intelligence: 7, Creativity: 4, Spirit: 2 }, unlocked: false, parent: "s2" },
      { id: "s5", name: "Thought Leader", desc: "Publish original ideas that influence", tier: 3, req: { Intelligence: 10, Charisma: 6, Creativity: 5 }, unlocked: false, parent: "s4" },
    ],
  },
  {
    id: "entrepreneur", name: "Entrepreneur Path", icon: "💰", desc: "Build, sell, scale", color: "#f1c40f",
    nodes: [
      { id: "e1", name: "First Dollar", desc: "Earn your first dollar online", tier: 0, req: { Charisma: 1, Intelligence: 1 }, unlocked: false },
      { id: "e2", name: "Lead Generation", desc: "Build a pipeline of leads", tier: 1, req: { Charisma: 3, Discipline: 3 }, unlocked: false, parent: "e1" },
      { id: "e3", name: "Product Builder", desc: "Ship a product or service", tier: 1, req: { Intelligence: 3, Creativity: 3 }, unlocked: false, parent: "e1" },
      { id: "e4", name: "Revenue Engine", desc: "Hit consistent monthly revenue", tier: 2, req: { Charisma: 5, Discipline: 5, Intelligence: 4 }, unlocked: false, parent: "e2" },
      { id: "e5", name: "Business Acquisition", desc: "Acquire or scale a business", tier: 2, req: { Intelligence: 6, Charisma: 5, Discipline: 6 }, unlocked: false, parent: "e4" },
      { id: "e6", name: "Empire Builder", desc: "Multiple revenue streams + team", tier: 3, req: { Charisma: 8, Intelligence: 7, Discipline: 8, Creativity: 5 }, unlocked: false, parent: "e5" },
    ],
  },
  {
    id: "creator", name: "Creator Path", icon: "🎬", desc: "Content, art, and audience", color: "#9b59b6",
    nodes: [
      { id: "c1", name: "First Publish", desc: "Put something into the world", tier: 0, req: { Creativity: 1, Charisma: 1 }, unlocked: false },
      { id: "c2", name: "Consistent Output", desc: "Publish weekly", tier: 1, req: { Creativity: 3, Discipline: 4 }, unlocked: false, parent: "c1" },
      { id: "c3", name: "Find Your Voice", desc: "Develop a unique style", tier: 1, req: { Creativity: 4, Spirit: 3 }, unlocked: false, parent: "c1" },
      { id: "c4", name: "Audience Builder", desc: "Grow to 1K followers", tier: 2, req: { Creativity: 5, Charisma: 5, Discipline: 5 }, unlocked: false, parent: "c2" },
      { id: "c5", name: "Creative Authority", desc: "Known for your craft", tier: 3, req: { Creativity: 9, Charisma: 7, Spirit: 5 }, unlocked: false, parent: "c4" },
    ],
  },
  {
    id: "sage", name: "Sage Path", icon: "🔮", desc: "Inner work, consciousness, wisdom", color: "#1abc9c",
    nodes: [
      { id: "sg1", name: "Daily Practice", desc: "Meditate or journal daily", tier: 0, req: { Spirit: 1, Discipline: 1 }, unlocked: false },
      { id: "sg2", name: "Shadow Integration", desc: "Confront and integrate shadow", tier: 1, req: { Spirit: 4, Intelligence: 2 }, unlocked: false, parent: "sg1" },
      { id: "sg3", name: "Emotional Mastery", desc: "Regulate state at will", tier: 1, req: { Spirit: 3, Discipline: 3 }, unlocked: false, parent: "sg1" },
      { id: "sg4", name: "Flow State Access", desc: "Enter flow on demand", tier: 2, req: { Spirit: 6, Discipline: 5, Creativity: 4 }, unlocked: false, parent: "sg3" },
      { id: "sg5", name: "Awakened", desc: "Live from expanded consciousness", tier: 3, req: { Spirit: 10, Intelligence: 5, Discipline: 6 }, unlocked: false, parent: "sg4" },
    ],
  },
];

const ACHIEVEMENTS = [
  { id: "first_quest", name: "Adventurer", desc: "Complete your first quest", icon: "🏅", check: d => d.quests >= 1 },
  { id: "ten_quests", name: "Veteran", desc: "Complete 10 quests", icon: "⭐", check: d => d.quests >= 10 },
  { id: "fifty_quests", name: "Legend", desc: "Complete 50 quests", icon: "👑", check: d => d.quests >= 50 },
  { id: "first_boss", name: "Dragonslayer", desc: "Slay a boss", icon: "🐲", check: d => d.bosses >= 1 },
  { id: "lv10", name: "Rising Power", desc: "Reach level 10", icon: "🔥", check: d => d.level >= 10 },
  { id: "lv25", name: "Elite", desc: "Reach level 25", icon: "💎", check: d => d.level >= 25 },
  { id: "streak7", name: "Unstoppable", desc: "7-day streak", icon: "⚡", check: d => d.streak >= 7 },
  { id: "streak30", name: "Ascended", desc: "30-day streak", icon: "🌟", check: d => d.streak >= 30 },
  { id: "shadow5", name: "Shadow Walker", desc: "5 shadow dungeons", icon: "🌑", check: d => d.shadows >= 5 },
  { id: "allstats5", name: "Well Rounded", desc: "All stats level 5+", icon: "🎯", check: d => d.minStat >= 5 },
  { id: "log50", name: "Grinder", desc: "Log 50 activities", icon: "💪", check: d => d.logs >= 50 },
  { id: "skill1", name: "Skill Unlocked", desc: "Unlock a skill node", icon: "🔓", check: d => d.skills >= 1 },
  { id: "tree1", name: "Path Master", desc: "Complete a skill tree", icon: "🌳", check: d => d.trees >= 1 },
  { id: "daily_all", name: "Perfect Day", desc: "Complete all daily quests in a day", icon: "☀️", check: d => d.perfectDay },
  { id: "energy0", name: "Burnout Survivor", desc: "Hit 0 energy and keep going", icon: "🔋", check: d => d.hitZeroEnergy },
];

const ENERGY_MAX = 100;
const ENERGY_REGEN = 100; // full restore on new day

const DEFAULT_DATA = {
  version: 3,
  playerName: "Hero",
  title: "The Awakened",
  stats: DEFAULT_STATS,
  activities: DEFAULT_ACTIVITIES,
  quests: [],
  dailyQuests: [], // recurring: { id, title, statIndex, type:'daily', recurring:true, completedToday:false }
  completedLog: [],
  activityLog: [],
  totalXp: 0,
  streak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  lastDailyReset: null,
  unlockedAchievements: [],
  skillTrees: DEFAULT_SKILL_TREES,
  energy: ENERGY_MAX,
  hitZeroEnergy: false,
  settings: { energyEnabled: true },
};

/* ══════════════════════ SKILL TREE COMPONENT ══════════════════════ */

function SkillTree({ tree, stats, onUnlock }) {
  const canUnlock = (node) => {
    if (node.unlocked) return false;
    if (node.parent && !tree.nodes.find(n => n.id === node.parent)?.unlocked) return false;
    return Object.entries(node.req).every(([name, lv]) => {
      const s = stats.find(s => s.name === name);
      return s && getStatLevel(s.xp) >= lv;
    });
  };
  const status = (n) => n.unlocked ? "done" : canUnlock(n) ? "ready" : "locked";
  const tiers = [0, 1, 2, 3];

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>{tree.icon}</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: tree.color, fontFamily: "var(--h)" }}>{tree.name}</div>
          <div style={{ fontSize: 11, color: "#555", fontStyle: "italic" }}>{tree.desc}</div>
        </div>
      </div>
      {tiers.map(t => {
        const nodes = tree.nodes.filter(n => n.tier === t);
        if (!nodes.length) return null;
        return (
          <div key={t} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 8, letterSpacing: 2, color: "#333", marginBottom: 4, paddingLeft: 2 }}>
              {["FOUNDATION", "INTERMEDIATE", "ADVANCED", "MASTERY"][t]}
            </div>
            <div className="tier-row">
              {nodes.map(node => {
                const st = status(node);
                return (
                  <div key={node.id} onClick={() => st === "ready" && onUnlock(tree.id, node.id)}
                    style={{
                      flex: "1 1 130px", maxWidth: 200, padding: 10, borderRadius: 9,
                      cursor: st === "ready" ? "pointer" : "default",
                      background: st === "done" ? `${tree.color}12` : st === "ready" ? "#f1c40f08" : "#08080e",
                      border: `1px solid ${st === "done" ? tree.color + "55" : st === "ready" ? "#f1c40f33" : "#151520"}`,
                      opacity: st === "locked" ? 0.45 : 1, transition: "all 0.2s", position: "relative",
                    }}>
                    {st === "done" && <div style={{ position: "absolute", top: 4, right: 6, fontSize: 12 }}>✅</div>}
                    {st === "ready" && <div style={{ position: "absolute", top: 4, right: 6, fontSize: 9, background: "#f1c40f", color: "#000", fontWeight: 800, padding: "1px 5px", borderRadius: 3, fontFamily: "var(--m)" }}>UNLOCK</div>}
                    <div style={{ fontSize: 12, fontWeight: 600, color: st === "done" ? tree.color : st === "ready" ? "#f1c40f" : "#444", marginBottom: 3 }}>{node.name}</div>
                    <div style={{ fontSize: 10, color: st === "done" ? "#888" : "#444", marginBottom: 6 }}>{node.desc}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                      {Object.entries(node.req).map(([name, lv]) => {
                        const s = stats.find(s => s.name === name);
                        const met = s && getStatLevel(s.xp) >= lv;
                        return (
                          <span key={name} style={{
                            fontSize: 9, padding: "1px 5px", borderRadius: 3,
                            background: met ? "#2ecc7118" : "#e74c3c12",
                            color: met ? "#2ecc71" : "#e74c3c",
                            border: `1px solid ${met ? "#2ecc7128" : "#e74c3c28"}`,
                            fontFamily: "var(--m)",
                          }}>{s?.icon}{name} {getStatLevel(s?.xp || 0)}/{lv}</span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════ MAIN APP ══════════════════════ */

export default function LifeRPG() {
  const [data, setData] = useState(() => load() || DEFAULT_DATA);
  const [view, setView] = useState("dashboard");
  const [flash, setFlash] = useState(null);
  const [popup, setPopup] = useState(null);
  const [showSetup, setShowSetup] = useState(() => !load());
  const [setupName, setSetupName] = useState("Michael");
  const [setupTitle, setSetupTitle] = useState("The Architect");
  // Sub-views / modals
  const [modal, setModal] = useState(null); // 'addQuest','addDaily','addActivity','editActivity','settings','export'
  const [selectedTree, setSelectedTree] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  // Form states
  const [qf, setQf] = useState({ title: "", type: "side", statIndex: 0, desc: "" });
  const [df, setDf] = useState({ title: "", statIndex: 3 });
  const [af, setAf] = useState({ name: "", icon: "⭐", stat: 0, xp: 15 });

  useEffect(() => { save(data); }, [data]);

  // ─── Daily reset check on mount & focus ───
  useEffect(() => {
    const doReset = () => {
      setData(prev => {
        const today = todayStr();
        if (prev.lastDailyReset === today) return prev;
        // Reset daily quests
        const resetDailies = prev.dailyQuests.map(q => ({ ...q, completedToday: false }));
        // Restore energy
        const newEnergy = ENERGY_MAX;
        // Update streak
        const yesterday = new Date(Date.now() - DAY_MS).toDateString();
        let streak = prev.streak;
        if (prev.lastActiveDate && prev.lastActiveDate !== today && prev.lastActiveDate !== yesterday) {
          streak = 0; // streak broken
        }
        return { ...prev, dailyQuests: resetDailies, energy: newEnergy, lastDailyReset: today, streak };
      });
    };
    doReset();
    const interval = setInterval(doReset, 60000);
    window.addEventListener("focus", doReset);
    return () => { clearInterval(interval); window.removeEventListener("focus", doReset); };
  }, []);

  const triggerFlash = (msg, color = "#f1c40f") => {
    setFlash({ msg, color });
    setTimeout(() => setFlash(null), 2200);
  };

  const checkAchievements = useCallback((nd) => {
    const sk = nd.skillTrees.reduce((s, t) => s + t.nodes.filter(n => n.unlocked).length, 0);
    const tr = nd.skillTrees.filter(t => t.nodes.every(n => n.unlocked)).length;
    const allDailiesDone = nd.dailyQuests.length > 0 && nd.dailyQuests.every(q => q.completedToday);
    const info = {
      quests: nd.completedLog.length, bosses: nd.completedLog.filter(q => q.type === "boss").length,
      shadows: nd.completedLog.filter(q => q.type === "shadow").length,
      level: getLevel(nd.totalXp).level, streak: nd.streak,
      minStat: Math.min(...nd.stats.map(s => getStatLevel(s.xp))),
      logs: nd.activityLog.length, skills: sk, trees: tr,
      perfectDay: allDailiesDone, hitZeroEnergy: nd.hitZeroEnergy,
    };
    let newOne = null;
    const unlocked = [...nd.unlockedAchievements];
    for (const a of ACHIEVEMENTS) {
      if (!unlocked.includes(a.id) && a.check(info)) { unlocked.push(a.id); newOne = a; }
    }
    if (newOne) { setPopup(newOne); setTimeout(() => setPopup(null), 3000); }
    return unlocked;
  }, []);

  const useEnergy = (cost) => {
    if (!data.settings.energyEnabled) return true;
    if (data.energy < cost) return false;
    return true;
  };

  const applyXp = (prev, statIndex, xpGain, energyCost = 5) => {
    const today = todayStr();
    const yesterday = new Date(Date.now() - DAY_MS).toDateString();
    let streak = prev.streak;
    if (prev.lastActiveDate === yesterday) streak += 1;
    else if (prev.lastActiveDate !== today) streak = 1;
    const longestStreak = Math.max(prev.longestStreak || 0, streak);
    const newEnergy = prev.settings.energyEnabled ? clamp(prev.energy - energyCost, 0, ENERGY_MAX) : prev.energy;
    const hitZero = prev.hitZeroEnergy || newEnergy === 0;
    return {
      stats: prev.stats.map((s, i) => i === statIndex ? { ...s, xp: s.xp + xpGain } : s),
      totalXp: prev.totalXp + xpGain,
      streak, longestStreak,
      lastActiveDate: today,
      energy: newEnergy,
      hitZeroEnergy: hitZero,
    };
  };

  // ─── Actions ───

  const logActivity = (act) => {
    if (data.settings.energyEnabled && data.energy < 5) {
      triggerFlash("⚠️ Not enough energy! Rest up.", "#e74c3c");
      return;
    }
    setData(prev => {
      const updates = applyXp(prev, act.stat, act.xp, 5);
      const nd = { ...prev, ...updates, activityLog: [...prev.activityLog, { ...act, loggedAt: Date.now() }] };
      nd.unlockedAchievements = checkAchievements(nd);
      triggerFlash(`+${act.xp} XP ${prev.stats[act.stat]?.icon} — ${act.name}`, prev.stats[act.stat]?.color);
      return nd;
    });
  };

  const deleteActivityLog = (loggedAt) => {
    setData(prev => {
      const entry = prev.activityLog.find(a => a.loggedAt === loggedAt);
      if (!entry) return prev;
      return {
        ...prev,
        stats: prev.stats.map((s, i) => i === entry.stat ? { ...s, xp: Math.max(0, s.xp - entry.xp) } : s),
        totalXp: Math.max(0, prev.totalXp - entry.xp),
        activityLog: prev.activityLog.filter(a => a.loggedAt !== loggedAt),
        energy: clamp(prev.energy + 5, 0, ENERGY_MAX),
      };
    });
    triggerFlash("Removed & XP reversed", "#e74c3c");
  };

  const completeQuest = (questId) => {
    if (data.settings.energyEnabled && data.energy < 10) {
      triggerFlash("⚠️ Not enough energy!", "#e74c3c");
      return;
    }
    setData(prev => {
      const quest = prev.quests.find(q => q.id === questId);
      if (!quest) return prev;
      const qt = QUEST_TYPES.find(t => t.key === quest.type);
      const updates = applyXp(prev, quest.statIndex, qt.xp, quest.type === "boss" ? 25 : quest.type === "shadow" ? 20 : 10);
      const nd = {
        ...prev, ...updates,
        quests: prev.quests.filter(q => q.id !== questId),
        completedLog: [...prev.completedLog, { ...quest, completedAt: Date.now() }],
      };
      nd.unlockedAchievements = checkAchievements(nd);
      triggerFlash(`+${qt.xp} XP — ${quest.title} complete!`, qt.color);
      return nd;
    });
  };

  const completeDailyQuest = (dailyId) => {
    if (data.settings.energyEnabled && data.energy < 5) {
      triggerFlash("⚠️ Not enough energy!", "#e74c3c");
      return;
    }
    setData(prev => {
      const dq = prev.dailyQuests.find(q => q.id === dailyId);
      if (!dq || dq.completedToday) return prev;
      const updates = applyXp(prev, dq.statIndex, 10, 5);
      const nd = {
        ...prev, ...updates,
        dailyQuests: prev.dailyQuests.map(q => q.id === dailyId ? { ...q, completedToday: true } : q),
        completedLog: [...prev.completedLog, { ...dq, type: "daily", completedAt: Date.now() }],
      };
      nd.unlockedAchievements = checkAchievements(nd);
      triggerFlash(`+10 XP — ${dq.title} ☀️`, "#2ecc71");
      return nd;
    });
  };

  const addQuest = () => {
    if (!qf.title.trim()) return;
    setData(prev => ({ ...prev, quests: [...prev.quests, { id: uid(), title: qf.title, type: qf.type, statIndex: qf.statIndex, desc: qf.desc, createdAt: Date.now() }] }));
    setQf({ title: "", type: "side", statIndex: 0, desc: "" });
    setModal(null);
    triggerFlash("Quest added!", "#3498db");
  };

  const addDailyQuest = () => {
    if (!df.title.trim()) return;
    setData(prev => ({ ...prev, dailyQuests: [...prev.dailyQuests, { id: uid(), title: df.title, statIndex: df.statIndex, completedToday: false }] }));
    setDf({ title: "", statIndex: 3 });
    setModal(null);
    triggerFlash("Daily quest created! Resets each morning.", "#2ecc71");
  };

  const deleteDailyQuest = (id) => {
    setData(prev => ({ ...prev, dailyQuests: prev.dailyQuests.filter(q => q.id !== id) }));
  };

  const deleteQuest = (id) => {
    setData(prev => ({ ...prev, quests: prev.quests.filter(q => q.id !== id) }));
  };

  const unlockSkillNode = (treeId, nodeId) => {
    setData(prev => {
      const newTrees = prev.skillTrees.map(t => t.id !== treeId ? t : { ...t, nodes: t.nodes.map(n => n.id === nodeId ? { ...n, unlocked: true } : n) });
      const nd = { ...prev, skillTrees: newTrees };
      nd.unlockedAchievements = checkAchievements(nd);
      const node = newTrees.find(t => t.id === treeId)?.nodes.find(n => n.id === nodeId);
      triggerFlash(`🔓 ${node?.name} unlocked!`, newTrees.find(t => t.id === treeId)?.color);
      return nd;
    });
  };

  const addActivity = () => {
    if (!af.name.trim()) return;
    setData(prev => ({ ...prev, activities: [...prev.activities, { id: uid(), name: af.name, icon: af.icon, stat: af.stat, xp: af.xp }] }));
    setAf({ name: "", icon: "⭐", stat: 0, xp: 15 });
    setModal(null);
    triggerFlash("Activity created!", "#9b59b6");
  };

  const deleteActivity = (id) => {
    setData(prev => ({ ...prev, activities: prev.activities.filter(a => a.id !== id) }));
  };

  const editActivity = (id, updates) => {
    setData(prev => ({ ...prev, activities: prev.activities.map(a => a.id === id ? { ...a, ...updates } : a) }));
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `life-rpg-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    triggerFlash("Save exported!", "#2ecc71");
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported.stats && imported.playerName) {
          setData(imported);
          triggerFlash("Save imported!", "#2ecc71");
        } else { triggerFlash("Invalid save file", "#e74c3c"); }
      } catch { triggerFlash("Failed to parse file", "#e74c3c"); }
    };
    reader.readAsText(file);
  };

  const resetGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(DEFAULT_DATA);
    setModal(null);
    setShowSetup(true);
  };

  const finishSetup = () => {
    setData(prev => ({ ...prev, playerName: setupName || "Hero", title: setupTitle || "The Awakened" }));
    setShowSetup(false);
  };

  // ─── Computed ───
  const lv = getLevel(data.totalXp);
  const xpPct = (lv.currentXp / lv.needed) * 100;
  const todayLogs = (data.activityLog || []).filter(a => new Date(a.loggedAt).toDateString() === todayStr());
  const todayXp = todayLogs.reduce((s, a) => s + a.xp, 0) + data.dailyQuests.filter(q => q.completedToday).length * 10;
  const dailiesDone = data.dailyQuests.filter(q => q.completedToday).length;
  const dailiesTotal = data.dailyQuests.length;
  const energyPct = (data.energy / ENERGY_MAX) * 100;

  const ICONS = ["⭐", "🎯", "💡", "🔧", "🎵", "📱", "🌱", "💎", "🧩", "🏠", "✏️", "🎤"];

  /* ═══════ SETUP ═══════ */
  if (showSetup) {
    return (
      <div style={S.app}><style>{CSS}</style>
        <div style={S.center}>
          <div style={S.setupBox}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>⚔️</div>
            <h1 style={{ fontSize: 18, letterSpacing: 4, color: "#f1c40f", margin: "0 0 4px", fontFamily: "var(--h)" }}>CREATE YOUR CHARACTER</h1>
            <p style={{ color: "#777", marginBottom: 20, fontFamily: "var(--b)", fontSize: 14 }}>Begin your adventure</p>
            <input style={S.input} placeholder="Character Name" value={setupName} onChange={e => setSetupName(e.target.value)} />
            <input style={S.input} placeholder='Title (e.g. "The Architect")' value={setupTitle} onChange={e => setSetupTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && finishSetup()} />
            <button style={S.gold} onClick={finishSetup}>⚔️ Begin Adventure</button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════ RENDER ═══════ */
  return (
    <div style={S.app}><style>{CSS}</style>
      <div className="app-shell">

      {/* Popups */}
      {popup && (
        <div className="anim-in" style={S.popup}>
          <div style={{ fontSize: 32 }}>{popup.icon}</div>
          <div style={{ fontSize: 9, letterSpacing: 3, color: "#f1c40f", marginTop: 3 }}>ACHIEVEMENT UNLOCKED</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{popup.name}</div>
          <div style={{ fontSize: 11, color: "#999" }}>{popup.desc}</div>
        </div>
      )}
      {flash && <div className="anim-in" style={{ ...S.flash, color: flash.color }}>{flash.msg}</div>}

      {/* Header */}
      <header style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={S.avatar}><span style={{ fontSize: 24 }}>⚔️</span></div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#eee", fontFamily: "var(--h)" }}>{data.playerName}</div>
            <div style={{ fontSize: 11, color: "#666", fontStyle: "italic" }}>{data.title}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={S.lvBadge}>LVL {lv.level}</div>
          <div style={S.streakBadge}>🔥{data.streak}</div>
          <button style={S.gearBtn} onClick={() => setModal("settings")}>⚙️</button>
        </div>
      </header>

      {/* XP + Energy bars */}
      <div className="bar-area" style={{ padding: "4px 16px 0" }}>
        <div style={S.barWrap}>
          <div style={{ ...S.barFill, width: `${xpPct}%`, background: "linear-gradient(90deg,#f1c40f,#e67e22)" }} />
          <div style={S.barLabel}>{lv.currentXp}/{lv.needed} XP</div>
        </div>
        {data.settings.energyEnabled && (
          <div style={{ ...S.barWrap, marginTop: 3, height: 8 }}>
            <div style={{ ...S.barFill, width: `${energyPct}%`, background: energyPct > 30 ? "linear-gradient(90deg,#3498db,#2ecc71)" : "linear-gradient(90deg,#e74c3c,#e67e22)", height: "100%" }} />
            <div style={{ ...S.barLabel, fontSize: 7 }}>⚡ {data.energy}/{ENERGY_MAX} Energy</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={S.nav}>
        {[
          { key: "dashboard", icon: "📊", label: "Home" },
          { key: "log", icon: "⚡", label: "Log XP" },
          { key: "quests", icon: "📜", label: "Quests" },
          { key: "skills", icon: "🌳", label: "Skills" },
          { key: "achievements", icon: "🏆", label: "Trophies" },
        ].map(t => (
          <button key={t.key} className="nav-btn" style={view === t.key ? S.navActive : S.navItem}
            onClick={() => { setView(t.key); setSelectedTree(null); setModal(null); }}>
            <span style={{ fontSize: 15 }}>{t.icon}</span>
            <span style={{ fontSize: 9, letterSpacing: 0.5 }}>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="content-area" style={S.content}>

        {/* ═══ DASHBOARD ═══ */}
        {view === "dashboard" && (
          <div>
            {/* Today summary */}
            <div style={S.todayBanner}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: "#888", marginBottom: 6 }}>TODAY</div>
              <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                <div><span style={{ fontSize: 22, fontWeight: 700, color: "#f1c40f", fontFamily: "var(--m)" }}>{todayXp}</span><div style={{ fontSize: 9, color: "#555" }}>XP EARNED</div></div>
                <div><span style={{ fontSize: 22, fontWeight: 700, color: "#2ecc71", fontFamily: "var(--m)" }}>{dailiesDone}/{dailiesTotal}</span><div style={{ fontSize: 9, color: "#555" }}>DAILIES</div></div>
                <div><span style={{ fontSize: 22, fontWeight: 700, color: "#3498db", fontFamily: "var(--m)" }}>{todayLogs.length}</span><div style={{ fontSize: 9, color: "#555" }}>LOGGED</div></div>
              </div>
            </div>

            {/* Daily quests quick view */}
            {data.dailyQuests.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: 2, color: "#2ecc71", marginBottom: 6, fontWeight: 600 }}>☀️ DAILY QUESTS</div>
                {data.dailyQuests.map(dq => (
                  <div key={dq.id} style={{ ...S.row, opacity: dq.completedToday ? 0.5 : 1 }}>
                    <button style={dq.completedToday ? S.checkDone : S.checkOpen} onClick={() => !dq.completedToday && completeDailyQuest(dq.id)} disabled={dq.completedToday}>
                      {dq.completedToday ? "✓" : ""}
                    </button>
                    <span style={{ flex: 1, color: dq.completedToday ? "#555" : "#ccc", fontSize: 13, textDecoration: dq.completedToday ? "line-through" : "none" }}>{dq.title}</span>
                    <span style={{ fontSize: 10, color: "#2ecc71", fontFamily: "var(--m)" }}>+10 XP</span>
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            <h2 style={S.h2}>Character Stats</h2>
            <div className="stats-grid">
              {data.stats.map((stat, i) => {
                const sl = getLevel(stat.xp);
                const pct = (sl.currentXp / sl.needed) * 100;
                return (
                  <div key={i} style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <span style={{ fontSize: 12 }}>{stat.icon} <span style={{ color: stat.color, fontWeight: 600 }}>{stat.name}</span></span>
                      <span style={{ fontSize: 10, color: stat.color, fontWeight: 700, fontFamily: "var(--m)" }}>LV{sl.level}</span>
                    </div>
                    <div style={S.miniBar}><div style={{ ...S.miniBarFill, width: `${pct}%`, background: stat.color }} /></div>
                    <div style={{ fontSize: 8, color: "#444", marginTop: 2, textAlign: "right", fontFamily: "var(--m)" }}>{sl.currentXp}/{sl.needed}</div>
                  </div>
                );
              })}
            </div>

            {/* Lifetime stats */}
            <div className="summary-row">
              {[
                { v: data.completedLog.length, l: "QUESTS", c: "#f1c40f" },
                { v: data.activityLog?.length || 0, l: "LOGGED", c: "#3498db" },
                { v: data.totalXp, l: "TOTAL XP", c: "#2ecc71" },
                { v: data.longestStreak || data.streak, l: "BEST🔥", c: "#e67e22" },
              ].map((s, i) => (
                <div key={i} style={{ ...S.card, flex: 1, textAlign: "center", padding: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.c, fontFamily: "var(--m)" }}>{s.v}</div>
                  <div style={{ fontSize: 8, color: "#555", letterSpacing: 1 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ LOG XP ═══ */}
        {view === "log" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 style={S.h2}>Log Activity</h2>
              <button style={{ ...S.ghost, fontSize: 11 }} onClick={() => setModal("addActivity")}>+ Custom</button>
            </div>
            <p style={{ fontSize: 12, color: "#555", marginBottom: 12, fontStyle: "italic" }}>Tap to earn XP. Each costs 5 energy.</p>
            <div className="activity-grid">
              {data.activities.map(act => {
                const stat = data.stats[act.stat];
                return (
                  <button key={act.id} className="act-btn" onClick={() => logActivity(act)}
                    style={{ padding: 12, borderRadius: 9, cursor: "pointer", background: "#0c0c16", border: "1px solid #181828", textAlign: "left", transition: "all 0.15s", fontFamily: "var(--b)", position: "relative" }}>
                    <div style={{ position: "absolute", top: 6, right: 6 }}>
                      <button onClick={(e) => { e.stopPropagation(); setEditTarget(act); setModal("editActivity"); }}
                        style={{ background: "none", border: "none", color: "#333", fontSize: 10, cursor: "pointer", padding: 2 }}>✏️</button>
                    </div>
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{act.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#ddd" }}>{act.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                      <span style={{ fontSize: 9, color: stat?.color }}>{stat?.icon} {stat?.name}</span>
                      <span style={{ fontSize: 10, color: "#f1c40f", fontWeight: 700, fontFamily: "var(--m)" }}>+{act.xp}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Today's log */}
            {todayLogs.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <h2 style={S.h2}>Today's Log</h2>
                {[...todayLogs].reverse().map((a, i) => (
                  <div key={i} style={S.row}>
                    <span>{a.icon}</span>
                    <span style={{ flex: 1, color: "#bbb", fontSize: 12 }}>{a.name}</span>
                    <span style={{ fontSize: 10, color: data.stats[a.stat]?.color, fontFamily: "var(--m)" }}>+{a.xp}</span>
                    <span style={{ fontSize: 9, color: "#333" }}>{new Date(a.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <button onClick={() => deleteActivityLog(a.loggedAt)} style={S.xBtn}>✕</button>
                  </div>
                ))}
                <div style={{ textAlign: "right", fontSize: 12, color: "#f1c40f", fontWeight: 700, fontFamily: "var(--m)", marginTop: 6 }}>
                  Today: +{todayXp} XP
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ QUESTS ═══ */}
        {view === "quests" && (
          <div>
            {/* Daily Quests Section */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h2 style={S.h2}>☀️ Daily Quests</h2>
              <button style={{ ...S.ghost, fontSize: 11 }} onClick={() => setModal("addDaily")}>+ Add Daily</button>
            </div>
            <p style={{ fontSize: 11, color: "#444", marginBottom: 10, fontStyle: "italic" }}>Auto-reset every morning. Complete for +10 XP each.</p>
            {data.dailyQuests.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: "#333", fontSize: 13 }}>No daily quests yet. Add recurring habits!</div>
            ) : (
              data.dailyQuests.map(dq => (
                <div key={dq.id} style={{ ...S.row, opacity: dq.completedToday ? 0.5 : 1 }}>
                  <button style={dq.completedToday ? S.checkDone : S.checkOpen} onClick={() => !dq.completedToday && completeDailyQuest(dq.id)}>
                    {dq.completedToday ? "✓" : ""}
                  </button>
                  <span style={{ flex: 1, color: dq.completedToday ? "#444" : "#ccc", fontSize: 13, textDecoration: dq.completedToday ? "line-through" : "none" }}>{dq.title}</span>
                  <span style={{ fontSize: 9, color: data.stats[dq.statIndex]?.color }}>{data.stats[dq.statIndex]?.icon}</span>
                  <button onClick={() => deleteDailyQuest(dq.id)} style={S.xBtn}>✕</button>
                </div>
              ))
            )}

            {/* Regular Quests */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, marginBottom: 8 }}>
              <h2 style={S.h2}>📜 Quests</h2>
              <button style={S.gold} onClick={() => setModal("addQuest")}>+ New Quest</button>
            </div>
            {data.quests.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: "#333" }}><div style={{ fontSize: 40 }}>📜</div><p style={{ fontSize: 13 }}>No active quests</p></div>
            ) : (
              QUEST_TYPES.map(qt => {
                const matching = data.quests.filter(q => q.type === qt.key);
                if (!matching.length) return null;
                return (
                  <div key={qt.key} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: qt.color, letterSpacing: 2, marginBottom: 4, fontWeight: 600 }}>{qt.icon} {qt.label.toUpperCase()}S — {qt.xp} XP</div>
                    {matching.map(quest => (
                      <div key={quest.id} className="quest-card" style={S.questRow}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: "#ddd", fontSize: 13 }}>{quest.title}</div>
                          {quest.desc && <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{quest.desc}</div>}
                          <div style={{ fontSize: 9, color: "#333", marginTop: 3 }}>{data.stats[quest.statIndex]?.icon} {data.stats[quest.statIndex]?.name}</div>
                        </div>
                        <button style={S.checkOpen} onClick={() => completeQuest(quest.id)}>✓</button>
                        <button style={S.xBtn} onClick={() => deleteQuest(quest.id)}>✕</button>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ═══ SKILLS ═══ */}
        {view === "skills" && (
          <div>
            <h2 style={S.h2}>Skill Trees</h2>
            <p style={{ fontSize: 12, color: "#555", marginBottom: 14, fontStyle: "italic" }}>Level up stats to unlock nodes. Each shows required stat levels.</p>
            {!selectedTree ? (
              <div className="tree-grid">
                {data.skillTrees.map(tree => {
                  const done = tree.nodes.filter(n => n.unlocked).length;
                  const total = tree.nodes.length;
                  return (
                    <button key={tree.id} className="act-btn" onClick={() => setSelectedTree(tree.id)}
                      style={{ padding: 14, borderRadius: 10, cursor: "pointer", background: done === total ? `${tree.color}10` : "#0c0c16", border: `1px solid ${done === total ? tree.color + "55" : "#181828"}`, textAlign: "left", transition: "all 0.15s", fontFamily: "var(--b)" }}>
                      <div style={{ fontSize: 26, marginBottom: 4 }}>{tree.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: tree.color, fontFamily: "var(--h)" }}>{tree.name}</div>
                      <div style={{ fontSize: 10, color: "#555", marginBottom: 6 }}>{tree.desc}</div>
                      <div style={S.miniBar}><div style={{ ...S.miniBarFill, width: `${(done / total) * 100}%`, background: tree.color }} /></div>
                      <div style={{ fontSize: 9, color: "#444", marginTop: 3, fontFamily: "var(--m)" }}>{done}/{total}</div>
                    </button>
                  );
                })}
              </div>
            ) : (() => {
              const tree = data.skillTrees.find(t => t.id === selectedTree);
              if (!tree) return null;
              return (
                <div>
                  <button style={{ ...S.ghost, fontSize: 11, marginBottom: 12 }} onClick={() => setSelectedTree(null)}>← All Trees</button>
                  <SkillTree tree={tree} stats={data.stats} onUnlock={unlockSkillNode} />
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══ ACHIEVEMENTS ═══ */}
        {view === "achievements" && (
          <div>
            <h2 style={S.h2}>Achievements</h2>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 14 }}>{data.unlockedAchievements.length}/{ACHIEVEMENTS.length} unlocked</div>
            <div className="achievement-grid">
              {ACHIEVEMENTS.map(a => {
                const u = data.unlockedAchievements.includes(a.id);
                return (
                  <div key={a.id} style={{ background: u ? "#f1c40f08" : "#0a0a12", border: `1px solid ${u ? "#f1c40f33" : "#111"}`, borderRadius: 9, padding: 11, textAlign: "center" }}>
                    <div style={{ fontSize: 26, opacity: u ? 1 : 0.25 }}>{a.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: 11, color: u ? "#f1c40f" : "#333" }}>{a.name}</div>
                    <div style={{ fontSize: 9, color: u ? "#888" : "#282828" }}>{a.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══════ MODALS ═══════ */}
      {modal && (
        <div style={S.overlay} onClick={() => setModal(null)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>

            {modal === "addQuest" && (
              <>
                <div style={S.modalTitle}>New Quest</div>
                <input style={S.input} placeholder="Quest name..." value={qf.title} onChange={e => setQf(p => ({ ...p, title: e.target.value }))} autoFocus />
                <textarea style={{ ...S.input, minHeight: 40, resize: "vertical" }} placeholder="Description..." value={qf.desc} onChange={e => setQf(p => ({ ...p, desc: e.target.value }))} />
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Type:</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                  {QUEST_TYPES.filter(q => q.key !== "daily").map(qt => (
                    <button key={qt.key} style={qf.type === qt.key ? { ...S.tag, background: qt.color, color: "#000", borderColor: qt.color } : S.tag}
                      onClick={() => setQf(p => ({ ...p, type: qt.key }))}>{qt.icon} {qt.label}</button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Stat:</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                  {data.stats.map((s, i) => (
                    <button key={i} style={qf.statIndex === i ? { ...S.tag, background: s.color, color: "#000", borderColor: s.color } : S.tag}
                      onClick={() => setQf(p => ({ ...p, statIndex: i }))}>{s.icon} {s.name}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={S.gold} onClick={addQuest}>Add Quest</button>
                  <button style={S.ghost} onClick={() => setModal(null)}>Cancel</button>
                </div>
              </>
            )}

            {modal === "addDaily" && (
              <>
                <div style={S.modalTitle}>New Daily Quest</div>
                <p style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>This will auto-reset every morning. +10 XP each completion.</p>
                <input style={S.input} placeholder="Daily habit..." value={df.title} onChange={e => setDf(p => ({ ...p, title: e.target.value }))} autoFocus
                  onKeyDown={e => e.key === "Enter" && addDailyQuest()} />
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Stat:</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                  {data.stats.map((s, i) => (
                    <button key={i} style={df.statIndex === i ? { ...S.tag, background: s.color, color: "#000", borderColor: s.color } : S.tag}
                      onClick={() => setDf(p => ({ ...p, statIndex: i }))}>{s.icon} {s.name}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={S.gold} onClick={addDailyQuest}>Create Daily</button>
                  <button style={S.ghost} onClick={() => setModal(null)}>Cancel</button>
                </div>
              </>
            )}

            {modal === "addActivity" && (
              <>
                <div style={S.modalTitle}>Custom Activity</div>
                <input style={S.input} placeholder="Activity name..." value={af.name} onChange={e => setAf(p => ({ ...p, name: e.target.value }))} autoFocus />
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Icon:</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                  {ICONS.map(ic => (
                    <button key={ic} style={af.icon === ic ? { ...S.tag, background: "#f1c40f", borderColor: "#f1c40f" } : S.tag}
                      onClick={() => setAf(p => ({ ...p, icon: ic }))}>{ic}</button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Stat:</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                  {data.stats.map((s, i) => (
                    <button key={i} style={af.stat === i ? { ...S.tag, background: s.color, color: "#000", borderColor: s.color } : S.tag}
                      onClick={() => setAf(p => ({ ...p, stat: i }))}>{s.icon} {s.name}</button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>XP Reward:</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                  {[5, 8, 10, 12, 15, 20, 25, 30].map(v => (
                    <button key={v} style={af.xp === v ? { ...S.tag, background: "#f1c40f", color: "#000", borderColor: "#f1c40f" } : S.tag}
                      onClick={() => setAf(p => ({ ...p, xp: v }))}>{v}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={S.gold} onClick={addActivity}>Create</button>
                  <button style={S.ghost} onClick={() => setModal(null)}>Cancel</button>
                </div>
              </>
            )}

            {modal === "editActivity" && editTarget && (
              <>
                <div style={S.modalTitle}>Edit Activity</div>
                <input style={S.input} value={editTarget.name} onChange={e => setEditTarget(p => ({ ...p, name: e.target.value }))} />
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Icon:</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                  {ICONS.map(ic => (
                    <button key={ic} style={editTarget.icon === ic ? { ...S.tag, background: "#f1c40f", borderColor: "#f1c40f" } : S.tag}
                      onClick={() => setEditTarget(p => ({ ...p, icon: ic }))}>{ic}</button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Stat:</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                  {data.stats.map((s, i) => (
                    <button key={i} style={editTarget.stat === i ? { ...S.tag, background: s.color, color: "#000", borderColor: s.color } : S.tag}
                      onClick={() => setEditTarget(p => ({ ...p, stat: i }))}>{s.icon} {s.name}</button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>XP:</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                  {[5, 8, 10, 12, 15, 20, 25, 30].map(v => (
                    <button key={v} style={editTarget.xp === v ? { ...S.tag, background: "#f1c40f", color: "#000", borderColor: "#f1c40f" } : S.tag}
                      onClick={() => setEditTarget(p => ({ ...p, xp: v }))}>{v}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={S.gold} onClick={() => { editActivity(editTarget.id, editTarget); setModal(null); setEditTarget(null); triggerFlash("Activity updated", "#3498db"); }}>Save</button>
                  <button style={{ ...S.ghost, color: "#e74c3c", borderColor: "#3a1a1e" }} onClick={() => { deleteActivity(editTarget.id); setModal(null); setEditTarget(null); triggerFlash("Activity deleted", "#e74c3c"); }}>Delete</button>
                  <button style={S.ghost} onClick={() => { setModal(null); setEditTarget(null); }}>Cancel</button>
                </div>
              </>
            )}

            {modal === "settings" && (
              <>
                <div style={S.modalTitle}>Settings</div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 8 }}>Character</div>
                  <input style={S.input} value={data.playerName} onChange={e => setData(p => ({ ...p, playerName: e.target.value }))} placeholder="Name" />
                  <input style={S.input} value={data.title} onChange={e => setData(p => ({ ...p, title: e.target.value }))} placeholder="Title" />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 8 }}>Energy System</div>
                  <button style={data.settings.energyEnabled ? { ...S.tag, background: "#2ecc71", color: "#000", borderColor: "#2ecc71" } : S.tag}
                    onClick={() => setData(p => ({ ...p, settings: { ...p.settings, energyEnabled: !p.settings.energyEnabled } }))}>
                    {data.settings.energyEnabled ? "✓ Enabled" : "Disabled"}
                  </button>
                  <p style={{ fontSize: 10, color: "#444", marginTop: 4 }}>Energy limits actions per day. Resets to 100 each morning.</p>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#aaa", marginBottom: 8 }}>Data</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button style={S.ghost} onClick={exportData}>📥 Export Save</button>
                    <label style={{ ...S.ghost, cursor: "pointer", display: "inline-flex", alignItems: "center" }}>
                      📤 Import Save
                      <input type="file" accept=".json" onChange={importData} style={{ display: "none" }} />
                    </label>
                  </div>
                  <p style={{ fontSize: 10, color: "#444", marginTop: 4 }}>Export to back up your progress or transfer to another device.</p>
                </div>

                <div style={{ marginBottom: 16, paddingTop: 12, borderTop: "1px solid #1a1a28" }}>
                  <button style={{ ...S.ghost, color: "#e74c3c", borderColor: "#3a1a1e" }} onClick={() => { if (confirm("Delete ALL progress? This cannot be undone.")) resetGame(); }}>
                    🗑️ Reset Everything
                  </button>
                </div>

                <button style={S.gold} onClick={() => setModal(null)}>Done</button>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

/* ─── CSS ─── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap');
:root { --h: 'Cinzel','Georgia',serif; --b: 'Crimson Text','Georgia',serif; --m: 'Courier New',monospace; }
* { box-sizing: border-box; }
@keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
.anim-in { animation: fadeIn 0.3s ease; }
.nav-btn:hover { color:#bbb!important; }
.act-btn:hover { transform:scale(1.02); border-color:#2a2a3a!important; }
.act-btn:active { transform:scale(0.98); }
.quest-card:hover { border-color:#2a2a3a!important; }

/* ─── Responsive ─── */
.app-shell { max-width: 520px; margin: 0 auto; font-size: 14px; }
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.activity-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.summary-row { display: flex; gap: 8px; margin-top: 14px; }
.achievement-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.tree-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.tier-row { display: flex; gap: 6px; flex-wrap: wrap; }

@media (min-width: 768px) {
  .app-shell { max-width: 800px; font-size: 16px; }
  .app-shell header { padding: 20px 28px 10px !important; }
  .app-shell .content-area { padding: 18px 28px 80px !important; }
  .app-shell .bar-area { padding: 6px 28px 0 !important; }
  .app-shell nav { margin: 10px 28px 0 !important; }
  .stats-grid { grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .activity-grid { grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .summary-row { gap: 12px; }
  .achievement-grid { grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .tree-grid { grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .tier-row { gap: 10px; }
}

@media (min-width: 1100px) {
  .app-shell { max-width: 960px; font-size: 17px; }
  .stats-grid { grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .activity-grid { grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
  .achievement-grid { grid-template-columns: 1fr 1fr 1fr 1fr; gap: 14px; }
  .tree-grid { grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
}
`;

/* ─── Styles ─── */
const S = {
  app: { minHeight: "100vh", background: "linear-gradient(160deg,#070710,#0e0e1a,#090912)", color: "#ddd", fontFamily: "var(--b)", position: "relative" },
  center: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  setupBox: { background: "#0e0e1aee", border: "1px solid #1e1e30", borderRadius: 14, padding: 36, textAlign: "center", maxWidth: 360, width: "100%" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px 6px" },
  avatar: { width: 48, height: 48, borderRadius: "50%", background: "#14142a", border: "2px solid #f1c40f18", display: "flex", alignItems: "center", justifyContent: "center" },
  lvBadge: { background: "linear-gradient(135deg,#f1c40f,#e67e22)", color: "#000", fontWeight: 800, fontSize: 12, padding: "3px 10px", borderRadius: 5, fontFamily: "var(--m)" },
  streakBadge: { background: "#10101e", border: "1px solid #222", padding: "3px 9px", borderRadius: 5, fontSize: 12, fontWeight: 600 },
  gearBtn: { background: "none", border: "none", fontSize: 16, cursor: "pointer", padding: 4 },
  barWrap: { height: 14, background: "#0a0a14", borderRadius: 7, position: "relative", overflow: "hidden", border: "1px solid #161626" },
  barFill: { height: "100%", borderRadius: 7, transition: "width 0.4s ease" },
  barLabel: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", textShadow: "0 1px 2px #000", fontFamily: "var(--m)", letterSpacing: 0.5 },
  nav: { display: "flex", margin: "8px 16px 0", background: "#090912", borderRadius: 9, overflow: "hidden", border: "1px solid #151522" },
  navItem: { flex: 1, background: "transparent", border: "none", color: "#444", padding: "10px 0", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontFamily: "var(--b)", transition: "all 0.2s", fontSize: "inherit" },
  navActive: { flex: 1, background: "#f1c40f08", border: "none", color: "#f1c40f", padding: "10px 0", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontFamily: "var(--b)", borderBottom: "2px solid #f1c40f", fontSize: "inherit" },
  content: { padding: "12px 16px 80px" },
  h2: { fontSize: 16, letterSpacing: 2, color: "#a0a0b0", margin: "0 0 10px", fontFamily: "var(--h)", fontWeight: 600 },
  card: { background: "#0c0c16", border: "1px solid #161626", borderRadius: 10, padding: 12 },
  miniBar: { height: 5, background: "#0a0a12", borderRadius: 3, overflow: "hidden" },
  miniBarFill: { height: "100%", borderRadius: 2, transition: "width 0.4s ease" },
  row: { display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid #111118", fontSize: 13 },
  questRow: { display: "flex", alignItems: "center", gap: 8, background: "#0c0c16", border: "1px solid #161626", borderRadius: 9, padding: 10, marginBottom: 5, transition: "all 0.2s" },
  todayBanner: { background: "#0c0c16", border: "1px solid #1a1a2a", borderRadius: 10, padding: 14, textAlign: "center", marginBottom: 14 },
  checkOpen: { width: 28, height: 28, borderRadius: 7, background: "transparent", border: "2px solid #2ecc7166", color: "#2ecc71", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  checkDone: { width: 28, height: 28, borderRadius: 7, background: "#2ecc7122", border: "2px solid #2ecc7144", color: "#2ecc71", fontSize: 14, cursor: "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  xBtn: { width: 20, height: 20, borderRadius: 4, background: "transparent", border: "1px solid #221418", color: "#e74c3c55", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  input: { width: "100%", padding: "8px 11px", background: "#08080e", border: "1px solid #1e1e2e", borderRadius: 7, color: "#ddd", fontSize: 13, fontFamily: "var(--b)", marginBottom: 8, outline: "none", boxSizing: "border-box" },
  tag: { padding: "4px 9px", borderRadius: 5, background: "#0e0e1a", border: "1px solid #222", color: "#888", fontSize: 11, cursor: "pointer", fontFamily: "var(--b)", transition: "all 0.15s" },
  gold: { padding: "8px 16px", background: "linear-gradient(135deg,#f1c40f,#e67e22)", border: "none", borderRadius: 7, color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--b)" },
  ghost: { padding: "8px 16px", background: "transparent", border: "1px solid #222", borderRadius: 7, color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "var(--b)" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modalBox: { background: "#0e0e1a", border: "1px solid #222", borderRadius: 14, padding: 24, maxWidth: 400, width: "100%", maxHeight: "85vh", overflowY: "auto" },
  modalTitle: { fontSize: 16, fontWeight: 700, color: "#eee", fontFamily: "var(--h)", marginBottom: 14, letterSpacing: 1 },
  popup: { position: "fixed", top: 50, left: "50%", transform: "translateX(-50%)", background: "#0a0a14ee", border: "1px solid #f1c40f33", borderRadius: 12, padding: "12px 26px", textAlign: "center", zIndex: 200, boxShadow: "0 0 30px rgba(241,196,15,0.1)" },
  flash: { position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", background: "#0a0a14ee", border: "1px solid #222", borderRadius: 9, padding: "7px 20px", fontSize: 13, fontWeight: 700, zIndex: 200, textAlign: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.5)", fontFamily: "var(--b)" },
};
