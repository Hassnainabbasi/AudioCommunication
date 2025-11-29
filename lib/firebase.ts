import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, enableNetwork, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "your-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "your-project.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your-app-id",
};

// Check if Firebase config is valid
const isFirebaseConfigured = (): boolean => {
  return (
    firebaseConfig.apiKey !== "your-api-key" &&
    firebaseConfig.projectId !== "your-project-id"
  );
};

let app: FirebaseApp | undefined;
let db: Firestore;

try {
  if (isFirebaseConfigured()) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);

    // Enable network and handle offline mode
    enableNetwork(db).catch((err) => {
      console.warn("Firebase network enable warning:", err);
    });

    // Log for debugging
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase not configured - using default values");
    // Still initialize with defaults for development
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Create a fallback db instance
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (fallbackError) {
    console.error("Firebase fallback initialization failed:", fallbackError);
    // Create a minimal db instance to prevent undefined
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
}

// Ensure db is always defined
if (!db) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export { db, isFirebaseConfigured };
