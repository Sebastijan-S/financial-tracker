# Firebase Setup Guide - Skviz Tracking Live App

## Overview
Your app is now connected to Firebase Realtime Database for **live, shared data**. Any changes made by one user are instantly visible to all other users viewing the app.

---

## Step 1: Create a Firebase Project

1. Go to **[Firebase Console](https://console.firebase.google.com/)**
2. Click **Create Project**
3. Enter project name (e.g., "skviz-tracking")
4. Click **Continue** → **Create project**
5. Wait for setup to complete (~2 minutes)

---

## Step 2: Set Up Realtime Database

1. In the Firebase console, go to **Build → Realtime Database**
2. Click **Create Database**
3. Choose location (closest to you for speed)
4. Select **Start in test mode** (for now - secure later)
5. Click **Enable**
6. Wait for database to create

---

## Step 3: Copy Firebase Config

1. Go to **Project Settings** (gear icon, top right)
2. Scroll to **Your apps** section
3. If no web app exists, click **Add app** → select **Web**
4. Copy the Firebase config object (looks like this):

```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "skviz-tracking.firebaseapp.com",
  projectId: "skviz-tracking",
  storageBucket: "skviz-tracking.appspot.com",
  messagingSenderId: "123456789",
  databaseURL: "https://skviz-tracking-default-rtdb.europe-west1.firebasedatabase.app",
  appId: "1:123456789:web:abc123..."
}
```

---

## Step 4: Update HTML File

1. Open `index.html` in your editor
2. Find this section (around line 8-20):

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  databaseURL: "YOUR_DATABASE_URL",
  appId: "YOUR_APP_ID"
};
```

3. **Replace ALL the `YOUR_...` values** with the actual values from your Firebase config
4. **Save the file**

---

## Step 5: Deploy the App Online

Your app must be hosted online for live sharing to work. Options:

### Option A: Netlify (Easiest - Free)
1. Create account at **[netlify.com](https://netlify.com)**
2. Drag & drop your `index.html`, `app.js`, `styles.css` into Netlify
3. Get a public link instantly
4. Share with team members

### Option B: Vercel
1. Create account at **[vercel.com](https://vercel.com)**
2. Connect your GitHub repo or drag & drop files
3. Get a public link

### Option C: GitHub Pages
1. Create a GitHub repo
2. Push your 3 files (`index.html`, `app.js`, `styles.css`)
3. Enable GitHub Pages in repo Settings
4. Get a public link

---

## Step 6: Test Live Sharing

1. Open your deployed app in **two different browsers/tabs**
2. In Browser 1: Add a transaction
3. Watch **Browser 2 update automatically** in real-time ✓
4. Try adding employees, inventory, receipts - all sync live!

---

## Security Rules (Optional but Recommended)

By default, anyone with your database URL can read/write all data. To secure it:

1. Go to **Realtime Database → Rules**
2. Replace with:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

(For now this allows public access - fine for internal team use. Later, add authentication if needed)

---

## Troubleshooting

### "Firebase not initialized" Error
- **Solution**: Check your config values are correct in `index.html`
- Open browser console (F12) and look for Firebase init messages

### Data not syncing between users
- **Solution**: Make sure your database URL is set correctly
- Both users must be accessing the **same deployed URL**
- Clear browser cache (Ctrl+Shift+Delete)

### Changes appear but then disappear
- **Solution**: Your app is writing to both Firebase AND localStorage
- Clear localStorage: Open console (F12) and run:
  ```javascript
  localStorage.clear()
  ```

### "CORS" or "Network" Errors
- **Solution**: Likely a config issue or Firebase not ready
- Check console for specific error message
- Reload page and try again

---

## What's Changed in Your App

✅ **Before**: Data saved only in your browser (localStorage)  
✅ **After**: Data saves to Firebase Realtime Database + syncs live

- All transactions, categories, employees, inventory, receipts, etc. are now **shared**
- Changes sync **instantly** across all connected users
- Multiple users can work simultaneously without conflicts
- Data persists even if all users disconnect

---

## Next Steps

1. **Backup existing data**: Click "💾 JSON Backup" before deploying
2. **Test with team**: Share the deployed link with colleagues
3. **Set daily backups**: Periodically export JSON as backup
4. **Add authentication** (Advanced): Later, add user login so you can track who made what changes

---

## Support

If issues persist:
1. Check browser console (F12 → Console tab)
2. Verify Firebase config is correct
3. Make sure Firebase Realtime Database is enabled
4. Check database URL format includes `firebasedatabase.app`

**Happy tracking! 🎉**
