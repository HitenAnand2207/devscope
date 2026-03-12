# 🔭 DevScope — Developer Activity Analyzer

A clean, modern web app that analyzes any GitHub developer's profile and displays insights including language distribution, activity charts, productivity score, and an AI-generated developer insight.

---

## ✨ Features

- GitHub profile (avatar, bio, followers)
- Stats: repos, stars, forks
- Language distribution doughnut chart
- Weekly push activity bar chart
- Productivity score ring
- AI-generated developer insight (OpenAI or built-in fallback)
- Responsive, dark-themed UI with animations

---

## 🛠️ Setup from Scratch in VS Code

### Step 1 — Prerequisites

Make sure you have these installed:
- **Node.js 18+**: https://nodejs.org (download LTS)
- **VS Code**: https://code.visualstudio.com

Check versions:
```bash
node --version   # should be v18 or higher
npm --version    # should be v9 or higher
```

---

### Step 2 — Create the project folder structure

Open a terminal in VS Code (`Ctrl + `` ` ``) and run this one command (Mac/Linux):

```bash
mkdir -p devscope/app/components devscope/app/utils devscope/app/api/analyze devscope/public
```

On **Windows PowerShell**:
```powershell
mkdir devscope\app\components, devscope\app\utils, devscope\app\api\analyze, devscope\public
```

---

### Step 3 — Add all files

Copy each file from this project into the matching path. The structure should look like:

```
devscope/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.js          ← API endpoint
│   ├── components/
│   │   ├── StatsCard.js
│   │   ├── LanguageChart.js
│   │   ├── CommitChart.js
│   │   ├── ProductivityMeter.js
│   │   └── LoadingSkeleton.js
│   ├── utils/
│   │   ├── github.js             ← GitHub API logic
│   │   └── aiInsight.js          ← AI insight logic
│   ├── globals.css
│   ├── layout.js
│   └── page.js                   ← Main page
├── .env.example
├── .gitignore
├── next.config.mjs
├── package.json
├── postcss.config.mjs
└── tailwind.config.mjs
```

---

### Step 4 — Install dependencies

```bash
cd devscope
npm install
```

This installs Next.js, Tailwind CSS, Chart.js, and all other dependencies.

---

### Step 5 — Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and optionally fill in:

| Variable | Required? | How to get it |
|---|---|---|
| `GITHUB_TOKEN` | Optional but recommended | [github.com/settings/tokens](https://github.com/settings/tokens) → Generate new token (classic) → no scopes needed |
| `OPENAI_API_KEY` | Optional | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |

> **Without `GITHUB_TOKEN`**: You're limited to 60 API requests/hour (fine for development).  
> **Without `OPENAI_API_KEY`**: A smart rule-based insight is generated instead (totally works!).

---

### Step 6 — Run locally

```bash
npm run dev
```

Open your browser at: **http://localhost:3000**

---

## 🚀 Deploy on Vercel

### Option A — Via Vercel CLI (easiest)

```bash
npm install -g vercel
vercel
```

Follow the prompts. When asked for environment variables, add your `GITHUB_TOKEN` and `OPENAI_API_KEY`.

### Option B — Via GitHub + Vercel dashboard

1. Push your project to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/devscope.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo

3. In the Vercel dashboard, go to **Settings → Environment Variables** and add:
   - `GITHUB_TOKEN` = your token
   - `OPENAI_API_KEY` = your key (optional)

4. Click **Deploy** — done! 🎉

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Charts | Chart.js + react-chartjs-2 |
| API | GitHub REST API |
| AI | OpenAI GPT-3.5 (optional) |
| Hosting | Vercel |

---

## 🔧 Troubleshooting

**"User not found" error**: Double-check the GitHub username spelling.

**Charts not showing**: Make sure `react-chartjs-2` installed correctly — try `npm install` again.

**Rate limit error**: Add a `GITHUB_TOKEN` to your `.env.local`.

**Blank page**: Check the browser console (F12) for errors.
