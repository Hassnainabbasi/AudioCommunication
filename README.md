# Audio Communication App

A real-time audio communication application built with Next.js and WebRTC, using Firebase for signaling.

## Features

- 🎤 Real-time audio communication between 2 users
- 🔗 Room-based connection system
- 🔊 Mute/Unmute functionality
- 📱 Responsive design
- ⚡ Fast connection using WebRTC peer-to-peer

## Prerequisites

- Node.js 18+ installed
- Firebase project set up

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Firestore Database
4. Get your Firebase configuration from Project Settings

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 4. Firestore Rules

In Firebase Console, go to Firestore Database > Rules and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read, write: if true; // For development only
      // For production, implement proper authentication
    }
  }
}
```

**Note:** The above rule allows anyone to read/write. For production, implement proper authentication.

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. **Create a Room:**
   - Click "Create Room" button
   - A Room ID will be generated
   - Share this Room ID with the other person

2. **Join a Room:**
   - Enter the Room ID shared by the other person
   - Click "Join Room"

3. **During the Call:**
   - Use the Mute/Unmute button to control your microphone
   - Click "End Call" to disconnect

## How It Works

- **WebRTC:** Handles peer-to-peer audio communication
- **Firebase Firestore:** Used for signaling (exchanging SDP offers/answers and ICE candidates)
- **STUN Servers:** Google's public STUN servers help establish connections

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari (may require additional configuration)

## Troubleshooting

1. **No audio:**
   - Check browser permissions for microphone access
   - Ensure you're using HTTPS (required for WebRTC in production)

2. **Connection issues:**
   - Check Firebase configuration
   - Verify Firestore rules allow read/write
   - Check browser console for errors

3. **Can't hear the other person:**
   - Ensure both users have joined the same room
   - Check that both users have granted microphone permissions

## Production Deployment

For production:
1. Set up proper Firebase authentication
2. Update Firestore security rules
3. Use HTTPS (required for WebRTC)
4. Consider using TURN servers for users behind strict NATs

## License

MIT

