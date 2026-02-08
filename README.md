# Life RPG — Your Life as a Video Game

A progressive web app (PWA) that gamifies your daily life with RPG mechanics: stats, quests, skill trees, daily habits, achievements, and an energy system.

---

## 🚀 Deploy to Vercel (Easiest — 5 minutes)

### Step 1: Push to GitHub

1. Go to [github.com/new](https://github.com/new) and create a new repo called `life-rpg`
2. Open your terminal and run:

```bash
cd life-rpg-pwa
git init
git add .
git commit -m "Life RPG v1"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/life-rpg.git
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `life-rpg` repo
4. Vercel auto-detects Vite — just click **"Deploy"**
5. In ~30 seconds you'll get a URL like `life-rpg.vercel.app`

### Step 3: Install on Your Phone

1. Open your Vercel URL on your phone in **Safari** (iPhone) or **Chrome** (Android)
2. **iPhone**: Tap the Share button → "Add to Home Screen"
3. **Android**: Tap the 3-dot menu → "Add to Home Screen" or "Install App"
4. The app icon appears on your home screen — opens full screen like a native app

### Step 4: Install on Desktop

1. Open the URL in Chrome on your computer
2. Click the install icon in the address bar (or 3-dot menu → "Install Life RPG")
3. It opens as a standalone window — no browser chrome

---

## 🛠 Local Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## 📦 Build for Production

```bash
npm run build
```

Output goes to `dist/` folder.

---

## 🔄 Alternative: Deploy to Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Drag and drop the `dist` folder after running `npm run build`
3. Done — instant URL

Or connect your GitHub repo for auto-deploys on every push.

---

## 📱 Features

- **6 Character Stats**: Strength, Intelligence, Charisma, Discipline, Creativity, Spirit
- **XP & Leveling**: Every action earns XP toward your overall level and individual stats
- **Daily Quests**: Recurring habits that auto-reset each morning
- **Quest Board**: Main quests, side quests, boss fights, shadow dungeons
- **16+ Activity Presets**: Log weights, reading, meditation, content creation, etc.
- **Custom Activities**: Create your own with custom icons, stats, and XP values
- **5 Skill Trees**: Warrior, Scholar, Entrepreneur, Creator, Sage — each with stat prerequisites
- **Energy System**: 100 energy/day — forces prioritization (can be toggled off)
- **15 Achievements**: Milestones to unlock as you progress
- **Streak Tracking**: Consecutive active days
- **Export/Import**: Back up and transfer your save data as JSON
- **Offline Support**: Works without internet once installed
- **Full PWA**: Installable on phone and desktop

---

## 💡 Tips

- **Updating the app**: Push changes to GitHub → Vercel auto-deploys → app auto-updates via service worker
- **Custom domain**: In Vercel settings, you can add your own domain (e.g., `rpg.yourdomain.com`)
- **Sharing**: Anyone with the URL can use the app — each person gets their own local save

---

Built with React + Vite + vite-plugin-pwa
