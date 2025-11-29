# Quick Setup Guide - Step by Step

## 🔥 Firebase Setup (Zaroori Hai!)

### Step 1: Firebase Project Create Karein
1. [Firebase Console](https://console.firebase.google.com/) par jayein
2. "Add project" ya "Create a project" click karein
3. Project name daalein (e.g., "audio-chat")
4. Google Analytics skip kar sakte hain (optional)
5. "Create project" click karein

### Step 2: Firestore Database Enable Karein
1. Left sidebar mein **"Firestore Database"** click karein
2. **"Create database"** button click karein
3. **"Start in test mode"** select karein (development ke liye)
4. Location select karein (closest to you)
5. **"Enable"** click karein

### Step 3: Firebase Config Copy Karein
1. Left sidebar mein **⚙️ Project Settings** (gear icon) click karein
2. Scroll down to **"Your apps"** section
3. **Web icon (</>)** click karein
4. App name daalein (e.g., "Audio Chat App")
5. **"Register app"** click karein
6. **Config values copy karein** (ye dikhenge):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 4: .env.local File Create Karein
Project root folder mein `.env.local` file create karein aur ye values paste karein:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza... (yahan se copy karein)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Important:** Har value ko properly copy karein, quotes ke bina!

### Step 5: Firestore Rules Set Karein
1. Firebase Console mein **Firestore Database** > **Rules** tab par jayein
2. Ye rules paste karein:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read, write: if true;
    }
  }
}
```

3. **"Publish"** button click karein

### Step 6: App Restart Karein
1. Terminal mein `Ctrl+C` press karein (server stop karne ke liye)
2. Phir `npm run dev` run karein
3. Browser refresh karein

## ✅ Test Kaise Karein

1. **Browser Tab 1:**
   - `http://localhost:3001` open karein
   - **"Create Room"** click karein
   - Room ID copy karein (e.g., `t7z5u7p`)

2. **Browser Tab 2 (ya different browser):**
   - `http://localhost:3001` open karein
   - Wahi Room ID paste karein
   - **"Join Room"** click karein

3. **Donon tabs mein:**
   - Microphone permission allow karein
   - 5-10 seconds wait karein
   - Status "Connected" dikhna chahiye
   - Ab aap ek doosre ki awaaz sun sakte hain! 🎉

## ❌ Agar Error Aaye

### "Firebase is offline" Error:
- Internet connection check karein
- Firebase config values verify karein
- `.env.local` file properly save hui hai ya nahi check karein
- Browser console (F12) mein errors check karein

### "Room not found" Error:
- Room ID sahi hai ya nahi check karein
- Pehle user ne room create kiya hai ya nahi verify karein

### "Failed to get document" Error:
- Firestore Database enable hai ya nahi check karein
- Firestore Rules properly set hain ya nahi verify karein

## 💡 Tips

- Pehli baar connection establish hone mein 5-10 seconds lag sakte hain
- Agar dono users same network par hain to connection fast hoga
- Different networks par bhi kaam karega (STUN servers ki wajah se)
- Browser console (F12) open rakhein to debug karne mein help milegi

