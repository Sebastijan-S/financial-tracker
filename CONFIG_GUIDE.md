# Firebase Configuration Guide

## Where to Find Your Firebase Config

### Step 1: Go to Firebase Console
Go to **https://console.firebase.google.com** and select your project

### Step 2: Click Project Settings
Click the ⚙️ **Settings** icon (top right corner)

### Step 3: Find Your Web App
Scroll down to **Your apps** section and find your **Web app** 

If no web app yet:
1. Click **Add app** 
2. Select **Web** (</> icon)
3. Register the app

### Step 4: Copy Firebase Config
You'll see a section like this:

```javascript
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxPvNg8SkR...",
  authDomain: "skviz-tracking.firebaseapp.com",
  projectId: "skviz-tracking",
  storageBucket: "skviz-tracking.appspot.com",
  messagingSenderId: "123456789",
  databaseURL: "https://skviz-tracking-default-rtdb.europe-west1.firebasedatabase.app",
  appId: "1:123456789:web:abc123def456..."
};
```

**Copy just the config object** (the part inside `firebaseConfig = { ... }`)

---

## Where to Paste It in Your Code

Open `index.html` and find this section (around line 8-20):

```html
<script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
    import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
    
    // Replace with your Firebase config
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",              // ← Replace these
      authDomain: "YOUR_AUTH_DOMAIN",      // ← Replace these
      projectId: "YOUR_PROJECT_ID",        // ← Replace these
      storageBucket: "YOUR_STORAGE_BUCKET", // ← Replace these
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // ← Replace these
      databaseURL: "YOUR_DATABASE_URL",    // ← Replace these
      appId: "YOUR_APP_ID"                 // ← Replace these
    };
```

---

## What Each Field Means

| Field | Source | Example |
|-------|--------|---------|
| `apiKey` | Firebase config | `AIzaSyDxPvNg8SkRp...` |
| `authDomain` | Firebase config | `skviz-tracking.firebaseapp.com` |
| `projectId` | Firebase config or project name | `skviz-tracking` |
| `storageBucket` | Firebase config | `skviz-tracking.appspot.com` |
| `messagingSenderId` | Firebase config (number before `:`) | `123456789` |
| `databaseURL` | Firebase Realtime DB URL | `https://skviz-tracking-default-rtdb.europe-west1.firebasedatabase.app` |
| `appId` | Firebase config | `1:123456789:web:abc123...` |

---

## Example - Complete Replacement

### ❌ BEFORE (placeholder):
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

### ✅ AFTER (real values):
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxPvNg8SkRp5k2L9m4N7q1R3S2T5U8V",
  authDomain: "skviz-tracking.firebaseapp.com",
  projectId: "skviz-tracking",
  storageBucket: "skviz-tracking.appspot.com",
  messagingSenderId: "123456789012",
  databaseURL: "https://skviz-tracking-default-rtdb.europe-west1.firebasedatabase.app",
  appId: "1:123456789012:web:abcdef123456789ghi"
};
```

---

## ⚠️ Important Notes

✅ **DO:**
- Copy the ENTIRE value (with quotes and all)
- Include the `https://` for `databaseURL`
- Save `index.html` after pasting
- Keep these values safe (don't share publicly)

❌ **DON'T:**
- Edit or change any values
- Leave any `YOUR_...` placeholders
- Copy just part of a value
- Add or remove any fields

---

## Verification

After pasting, check these:
1. All 7 fields have values (no `YOUR_...` left)
2. Each value is in quotes (`"value"`)
3. File saved (`Ctrl+S`)
4. The `databaseURL` starts with `https://`
5. The `databaseURL` contains `.firebasedatabase.app`

---

## If It's Not Working

Check:
1. ✅ Firebase project created
2. ✅ Realtime Database enabled
3. ✅ All config values pasted correctly
4. ✅ `index.html` saved
5. ✅ No typos in field names
6. ✅ Quotes around each value

---

## Still Stuck?

1. Open browser console: **F12 → Console tab**
2. Look for error messages about Firebase
3. Screenshot the error
4. Check it matches Firebase config values

**Common error:** `Cannot read property 'databaseURL' of undefined`
→ Means config is not properly loaded. Check syntax.
