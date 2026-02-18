# Deploy to Railway — step-by-step

Do these steps in order. Replace **YOUR_GITHUB_USERNAME** with your actual GitHub username everywhere.

---

## Part 1: Put your code on GitHub

### 1.1 Create a repo on GitHub

1. Open a browser and go to **https://github.com**
2. Log in (or create an account).
3. Click the **+** in the top-right corner → **New repository**.
4. **Repository name:** type `sports-app` (or any name you like).
5. Leave everything else as default (don’t add a README, .gitignore, or license).
6. Click **Create repository**.

### 1.2 Push your project from your Mac

1. Open **Terminal** (search “Terminal” in Spotlight or find it in Applications → Utilities).
2. Copy and run each command **one at a time** (replace **YOUR_GITHUB_USERNAME** with your GitHub username):

```bash
cd /Users/vasilisp/Desktop/sports_app
```

Press Enter. Then:

```bash
git init
```

Press Enter. Then:

```bash
git add .
```

Press Enter. Then:

```bash
git commit -m "Initial commit"
```

Press Enter. Then:

```bash
git branch -M main
```

Press Enter. Then:

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/sports-app.git
```

Press Enter. Then:

```bash
git push -u origin main
```

Press Enter.

3. If it asks for **username**: type your GitHub username and Enter.
4. If it asks for **password**: you cannot use your normal GitHub password. You need a **Personal Access Token**:
   - In the browser, go to GitHub → click your profile picture (top right) → **Settings**.
   - Left sidebar: **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
   - **Generate new token (classic)**. Name it e.g. `railway-deploy`, check **repo**, then **Generate token**.
   - Copy the token (you won’t see it again).
   - Back in Terminal, when it asks for password, **paste the token** (it won’t show as you type) and press Enter.

When you see something like “Branch 'main' set up to track...”, your code is on GitHub.

---

## Part 2: Deploy on Railway

### 2.1 Sign up and create a project

1. Go to **https://railway.app** in your browser.
2. Click **Login** or **Start a New Project**.
3. Choose **Login with GitHub** and approve so Railway can see your repos.
4. You’ll see a “Create a new project” or “New Project” screen. Click **Deploy from GitHub repo** (or **Add a service** / **Deploy from GitHub** — the exact words may vary).
5. If Railway asks to install the Railway GitHub App or to give access to repos:
   - Choose **All repositories** or **Only select repositories** and pick **sports-app**.
   - Click **Install** / **Authorize**.
6. In the list of repos, find **sports-app** and click it (or **Deploy** / **Select**).

Railway will create a project and start a first deploy. It might fail the first time because we haven’t set the build/start commands yet. That’s normal.

### 2.2 Set build and start commands

1. In Railway, you should see your project with one **service** (your app). Click that service (the box with your app name or “sports-app”).
2. Open the **Settings** tab for that service (or click **Variables** and look for a **Settings** section).
3. Find **Build Command** (or “Build”) and set it to exactly:
   ```bash
   npm install && npm run build
   ```
4. Find **Start Command** (or “Start” / “Run”) and set it to exactly:
   ```bash
   npm start
   ```
5. If there’s a **Root Directory** or **Source** option, leave it blank (or `/`) so Railway uses the repo root.
6. Save (e.g. **Save** or **Update**).

### 2.3 Generate a public URL

1. In the same service, open the **Settings** tab (or **Networking** / **Public Networking**).
2. Find **Generate Domain** or **Add a domain** or **Public URL**.
3. Click **Generate Domain** (or **Add domain**). Railway will give you a URL like:
   **https://sports-app-production-xxxx.up.railway.app**
4. Copy that URL and open it in a new tab. You should see your Sports Field Check app.

That URL is your live site (frontend + backend on one host).

---

## Part 3: Updating the site later

1. Edit your code on your Mac as usual (in Cursor or any editor).
2. In Terminal run:

```bash
cd /Users/vasilisp/Desktop/sports_app
git add .
git commit -m "What you changed"
git push
```

(Use any short description instead of “What you changed”.)

3. Railway will detect the push and redeploy. Wait 1–2 minutes, then refresh your Railway URL to see the update.

---

## Checklist

- [ ] GitHub repo created (e.g. `sports-app`)
- [ ] Code pushed: `git init`, `git add .`, `git commit`, `git remote add origin`, `git push`
- [ ] Logged into Railway with GitHub
- [ ] New project → Deploy from GitHub → selected `sports-app`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Generated a public domain for the service
- [ ] Opened the Railway URL and saw the app

You’re done. One host (Railway) for frontend and backend.
