# Firebase Connection Fix

## Issue: "Firebase is offline" Error

Aapka `.env.local` file sahi hai, lekin Firebase connect nahi ho raha. Ye steps follow karein:

## Step 1: Firestore Database Enable Karein

1. [Firebase Console](https://console.firebase.google.com/) par jayein
2. Apna project select karein: **communication-chats**
3. Left sidebar mein **"Firestore Database"** click karein
4. Agar database already create hai, skip karein
5. Agar nahi hai, to:
   - **"Create database"** click karein
   - **"Start in test mode"** select karein
   - Location select karein
   - **"Enable"** click karein

## Step 2: Firestore Rules Check Karein

1. Firestore Database > **"Rules"** tab par jayein
2. Ye rules honi chahiye:

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

3. Agar alag hain, to update karein aur **"Publish"** click karein

## Step 3: App Restart Karein

Environment variables load karne ke liye app restart karna zaroori hai:

1. Terminal mein `Ctrl+C` press karein (server stop karne ke liye)
2. Phir `npm run dev` run karein
3. Browser mein hard refresh karein: `Ctrl+Shift+R` ya `Ctrl+F5`

## Step 4: Browser Console Check Karein

1. Browser mein `F12` press karein (Developer Tools)
2. **Console** tab open karein
3. Koi Firebase errors dikh rahe hain? Unhe share karein

## Step 5: Network Check Karein

- Internet connection theek hai?
- Firewall ya VPN Firebase ko block to nahi kar raha?
- Browser mein Firebase requests ja rahe hain? (Network tab check karein)

## Quick Test

Browser console mein ye command run karein:

```javascript
console.log('Firebase Config:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
});
```

Agar values undefined dikhen, to app restart karein.

