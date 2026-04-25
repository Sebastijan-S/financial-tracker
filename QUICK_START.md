# ⚡ Quick Start - Live Sharing Setup (5 minutes)

Your **Skviz Tracking** app is now ready to sync live with Firebase! Follow these 5 quick steps:

---

## 1️⃣ Create Firebase Account (1 min)
- Go to **https://console.firebase.google.com**
- Click **Create Project** → name it `skviz-tracking`
- Wait for it to finish setup

---

## 2️⃣ Create Realtime Database (2 mins)
1. Click **Build → Realtime Database**
2. Click **Create Database**
3. Select location (pick closest to you)
4. Select **Start in test mode**
5. Click **Enable** and wait

---

## 3️⃣ Copy Your Firebase Config (1 min)
1. Click gear ⚙️ (top right) → **Project Settings**
2. Scroll down to **Your apps**
3. Copy the Firebase config box (starts with `const firebaseConfig = {...}`)

---

## 4️⃣ Paste Config into index.html
1. Open `index.html` in your editor
2. Find line ~8-20 (the `firebaseConfig` section with `YOUR_API_KEY` placeholders)
3. **Replace ALL `YOUR_*` values** with your copied config values
4. **Save file**

**Example - Before:**
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",  // Replace this
  authDomain: "YOUR_AUTH_DOMAIN",  // Replace this
  ...
};
```

**Example - After:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxPvNg8SkR...",
  authDomain: "skviz-tracking.firebaseapp.com",
  ...
};
```

---

## 5️⃣ Deploy Online (Host Anywhere)

Pick ONE:

### **Option A: Netlify (Easiest)**
1. Go to **https://netlify.com** → Sign up
2. Drag & drop your 3 files: `index.html`, `app.js`, `styles.css`
3. Get instant live link ✅

### **Option B: GitHub Pages**
1. Create GitHub repo
2. Upload 3 files
3. Go to repo **Settings → Pages → Enable**
4. Get live link ✅

### **Option C: Vercel**
1. Go to **https://vercel.com** → Sign up
2. Upload project
3. Get instant live link ✅

---

## ✅ You're Done!

Test it:
1. Open your deployed link in **Browser 1**
2. Open same link in **Browser 2** (different window)
3. Add transaction in Browser 1
4. **Watch it appear instantly** in Browser 2! 🎉

---

## 🔥 Features Now Live

✨ **All data is now shared in real-time:**
- ✅ Transactions (Prihodi/Rashodi)
- ✅ Categories
- ✅ Employees & Payroll
- ✅ Inventory & Stock
- ✅ Receipts/Invoices

Changes made by ANY user appear to ALL users **instantly**!

---

## ⚠️ Common Issues

**"Firebase not initialized"?**
→ Check your config values in `index.html` match Firebase exactly

**Changes not syncing?**
→ Make sure both users are on the **same deployed URL**

**Want to backup data?**
→ Click **"💾 JSON Backup"** in the Izveštaj tab anytime

---

## 📚 Full Documentation

See `FIREBASE_SETUP.md` for detailed setup guide with screenshots and troubleshooting.

---

**Questions?** Check browser console (F12) for detailed error messages.

**Ready?** Deploy now and start collaborating! 🚀
