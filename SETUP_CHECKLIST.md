# 📋 Setup Checklist - Live Firebase Sync

Print this or follow step-by-step to set up your live app.

---

## Phase 1: Firebase Project Setup (10 mins)

### Step 1: Create Firebase Account
- [ ] Go to https://console.firebase.google.com
- [ ] Sign in with Google account
- [ ] Click **"Create Project"**
- [ ] Enter project name: `skviz-tracking`
- [ ] Accept terms
- [ ] Click **"Create project"** and wait ~2 minutes

### Step 2: Create Realtime Database
- [ ] In Firebase console, go to **Build → Realtime Database**
- [ ] Click **"Create Database"**
- [ ] Select location closest to you
- [ ] Select **"Start in test mode"**
- [ ] Click **"Enable"** and wait ~1 minute

### Step 3: Copy Firebase Config
- [ ] Click gear ⚙️ icon (top right)
- [ ] Click **"Project Settings"**
- [ ] Scroll down to **"Your apps"** section
- [ ] If no Web app, click **"Add app"** and select **"Web"** (</> icon)
- [ ] Copy the entire `firebaseConfig` object

---

## Phase 2: Configure Your App (5 mins)

### Step 4: Update index.html
- [ ] Open `index.html` in your editor
- [ ] Find line ~20: `const firebaseConfig = {`
- [ ] Replace these 7 placeholders with real values:
  - [ ] `YOUR_API_KEY` → `apiKey` from Firebase config
  - [ ] `YOUR_AUTH_DOMAIN` → `authDomain` from Firebase config
  - [ ] `YOUR_PROJECT_ID` → `projectId` from Firebase config
  - [ ] `YOUR_STORAGE_BUCKET` → `storageBucket` from Firebase config
  - [ ] `YOUR_MESSAGING_SENDER_ID` → `messagingSenderId` from Firebase config
  - [ ] `YOUR_DATABASE_URL` → `databaseURL` from Firebase config
  - [ ] `YOUR_APP_ID` → `appId` from Firebase config
- [ ] **Save file** (Ctrl+S)

**Verification:** All 7 fields should have values, no `YOUR_...` left

---

## Phase 3: Deploy Online (5 mins)

### Step 5: Choose Hosting Platform

#### Option A: Netlify (EASIEST - Recommended)
- [ ] Go to https://netlify.com
- [ ] Sign up (free account)
- [ ] Drag & drop these 3 files into drop zone:
  - [ ] `index.html`
  - [ ] `app.js`
  - [ ] `styles.css`
- [ ] Wait for deployment to finish (~1 min)
- [ ] Copy your deployed URL (format: `https://xxx.netlify.app`)

#### Option B: GitHub Pages
- [ ] Create GitHub account (if needed)
- [ ] Create new repository named `skviz-tracking`
- [ ] Upload 3 files to repository:
  - [ ] `index.html`
  - [ ] `app.js`
  - [ ] `styles.css`
- [ ] Go to repo **Settings → Pages**
- [ ] Select **Main** branch
- [ ] Wait for deployment
- [ ] Copy your URL (format: `https://username.github.io/skviz-tracking`)

#### Option C: Vercel
- [ ] Go to https://vercel.com
- [ ] Sign up (free account)
- [ ] Click **"New Project"** → **"Upload"**
- [ ] Upload your 3 files
- [ ] Click **"Deploy"** and wait
- [ ] Copy your deployed URL

---

## Phase 4: Test Live Sharing (5 mins)

### Step 6: Verify It Works
- [ ] **Computer A (Browser 1):** Open your deployed URL
- [ ] **Computer B (Browser 2):** Open same deployed URL
- [ ] Wait for app to load on both
- [ ] Check browser console (F12) for Firebase ✓ messages

### Step 7: Test Real-time Sync
- [ ] **In Browser 1:** 
  - [ ] Click "Nova transakcija"
  - [ ] Enter amount: `1000`
  - [ ] Pick date (today)
  - [ ] Pick category
  - [ ] Click "Sačuvaj"
  - [ ] Wait 1 second
- [ ] **In Browser 2:**
  - [ ] Look at Dashboard
  - [ ] You should see the transaction appear **instantly** ✨
  
### Step 8: Test Again (Reverse)
- [ ] **In Browser 2:** Add different transaction
- [ ] **In Browser 1:** Verify it appears instantly
- [ ] **Success!** 🎉 Your app is now live-syncing

---

## Phase 5: Team Setup (Optional)

### Step 9: Share with Team
- [ ] Copy your deployed URL
- [ ] Send to teammates
- [ ] They open URL → data is shared!
- [ ] No setup needed for them

### Step 10: Backup Plan
- [ ] Go to **Izveštaj tab**
- [ ] Click **"💾 JSON Backup"**
- [ ] Save the file to computer
- [ ] Repeat weekly for safety

---

## Troubleshooting

### ❌ "Firebase not initialized"
- [ ] Check all 7 values in `index.html` are filled
- [ ] Make sure no `YOUR_...` placeholders remain
- [ ] Save `index.html` (Ctrl+S)
- [ ] Reload page (F5)
- [ ] Check browser console (F12) for exact error

### ❌ "Data not syncing"
- [ ] Both users must use **same deployed URL** (not localhost)
- [ ] Check Realtime Database is enabled in Firebase
- [ ] Check Firebase config values are correct
- [ ] Try reloading page (F5)

### ❌ "Can't connect to database"
- [ ] Check your internet connection
- [ ] Verify database URL in config (should contain `.firebasedatabase.app`)
- [ ] Check Firebase console - database should say "Realtime Database"
- [ ] Check if Firebase project is active

### ❌ Still not working?
- [ ] Open browser console (F12 → Console tab)
- [ ] Look for error messages
- [ ] Screenshot the error
- [ ] Check `CONFIG_GUIDE.md` for Firebase config help
- [ ] Review `FIREBASE_SETUP.md` for detailed troubleshooting

---

## Success Indicators ✅

You're all set when:
- [ ] App loads without errors
- [ ] No `YOUR_...` placeholders visible
- [ ] Console shows "✓ Firebase Realtime Database connected"
- [ ] Console shows "✓ Real-time data sync started"
- [ ] Data appears instantly when added by another user
- [ ] All buttons work (Dodaj, Uredi, Obriši)

---

## Common Mistakes to Avoid ❌

- ❌ Forgetting to replace Firebase config values
- ❌ Using localhost URL (must be deployed)
- ❌ Not saving `index.html` after editing
- ❌ Copying only part of a config value
- ❌ Adding quotes around already-quoted values
- ❌ Using HTTP instead of HTTPS in database URL

---

## Timeline

| Task | Time | Done |
|------|------|------|
| Firebase project + database | 10 mins | [ ] |
| Copy & paste config | 5 mins | [ ] |
| Deploy to Netlify/GitHub | 5 mins | [ ] |
| Test in 2 browsers | 5 mins | [ ] |
| **TOTAL** | **~25 mins** | |

---

## Next: Share with Team!

Once working:
1. Share deployed URL with teammates
2. They open link → instant access
3. All data is shared in real-time
4. Start collaborating! 🚀

---

## Need Help?

1. **Config confusion?** → Read `CONFIG_GUIDE.md`
2. **Setup steps?** → Read `QUICK_START.md`
3. **Detailed help?** → Read `FIREBASE_SETUP.md`
4. **Errors?** → Check browser console (F12)

**Remember:** Most issues are just config-related. Take your time copying the config values exactly!

---

## Backup this checklist

Print this page or save as PDF to reference while setting up.

✅ **Ready?** Start with Phase 1, Step 1! Good luck! 🎉
