import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, setDoc, deleteDoc, getDoc, enableNetwork } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCallActive: boolean;
  isMuted: boolean;
  startCall: (roomId: string, isCaller: boolean) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  error: string | null;
  connectionStatus: string;
}

export const useWebRTC = (): UseWebRTCReturn => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Initializing...');

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const isCallerRef = useRef<boolean>(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const processedCandidatesRef = useRef<Set<string>>(new Set());
  const iceCandidateQueueRef = useRef<RTCIceCandidate[]>([]);
  const roomCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const servers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(servers);

    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote track:', event);
      setRemoteStream(event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && roomIdRef.current) {
        const candidateStr = JSON.stringify(event.candidate);
        const candidateKey = `${isCallerRef.current ? 'caller' : 'callee'}Candidate`;
        const roomRef = doc(db, 'rooms', roomIdRef.current);
        setDoc(roomRef, {
          [candidateKey]: candidateStr,
        }, { merge: true }).catch((err) => {
          console.error('Error sending ICE candidate:', err);
        });
      } else if (!event.candidate) {
        console.log('All ICE candidates have been sent');
      }
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setIsCallActive(true);
        setError(null);
        setConnectionStatus('Connected');
      } else if (pc.iceConnectionState === 'checking') {
        setConnectionStatus('Connecting...');
      } else if (pc.iceConnectionState === 'failed') {
        setError('Connection failed. Please check your internet connection and try again.');
        setConnectionStatus('Connection failed');
      } else if (pc.iceConnectionState === 'disconnected') {
        setConnectionStatus('Disconnected');
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsCallActive(true);
        setError(null);
        setConnectionStatus('Connected');
      } else if (pc.connectionState === 'connecting') {
        setConnectionStatus('Connecting...');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setError('Connection failed or disconnected');
        setConnectionStatus('Disconnected');
      }
    };

    return pc;
  }, []);

  const addIceCandidateToPC = useCallback(async (pc: RTCPeerConnection, candidate: RTCIceCandidate) => {
    try {
      // Only add if remote description is set
      if (pc.remoteDescription) {
        await pc.addIceCandidate(candidate);
        console.log('Added ICE candidate:', candidate);
      } else {
        // Queue candidate if remote description not set yet
        iceCandidateQueueRef.current.push(candidate);
        console.log('Queued ICE candidate (waiting for remote description)');
      }
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  }, []);

  const processQueuedCandidates = useCallback(async (pc: RTCPeerConnection) => {
    while (iceCandidateQueueRef.current.length > 0 && pc.remoteDescription) {
      const candidate = iceCandidateQueueRef.current.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(candidate);
          console.log('Processed queued ICE candidate');
        } catch (err) {
          console.error('Error processing queued candidate:', err);
        }
      }
    }
  }, []);

  const startCall = useCallback(async (roomId: string, isCaller: boolean) => {
    try {
      setError(null);
      
      // Check Firebase configuration
      if (!isFirebaseConfigured()) {
        setError('Firebase is not configured! Please set up your .env.local file with Firebase credentials. Check README.md for instructions.');
        setConnectionStatus('Firebase not configured');
        return;
      }

      // Try to enable network
      try {
        await enableNetwork(db);
        console.log('Firebase network enabled');
      } catch (err: any) {
        console.warn('Network enable warning:', err);
        // If it's a permission error, it might be Firestore rules
        if (err.code === 'permission-denied') {
          setError('Firestore permission denied! Please check Firestore Rules in Firebase Console. See FIREBASE_CHECK.md for help.');
          setConnectionStatus('Permission denied');
          return;
        }
      }

      roomIdRef.current = roomId;
      isCallerRef.current = isCaller;
      processedCandidatesRef.current.clear();
      iceCandidateQueueRef.current = [];

      console.log(`Starting call as ${isCaller ? 'caller' : 'callee'} in room: ${roomId}`);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      console.log('Got user media');

      // Create peer connection
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      const roomRef = doc(db, 'rooms', roomId);

      if (isCaller) {
        // Create offer
        setConnectionStatus('Creating room...');
        console.log('Creating offer...');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log('Set local description (offer)');

        try {
          await setDoc(roomRef, {
            offer: JSON.stringify(offer),
          });
          console.log('Sent offer to Firebase');
          setConnectionStatus('Waiting for other user to join...');
        } catch (err: any) {
          if (err.code === 'failed-precondition' || err.message?.includes('offline')) {
            setError('Firebase is offline! Please check your internet connection.');
            setConnectionStatus('Firebase offline');
          } else {
            setError(`Failed to create room: ${err.message || 'Unknown error'}`);
            setConnectionStatus('Error');
          }
          throw err;
        }

        // Listen for answer
        const unsubscribe = onSnapshot(roomRef, 
          async (snapshot) => {
            const data = snapshot.data();
            if (!data) return;

          // Handle answer
          if (data.answer && !pc.remoteDescription) {
            try {
              const answer = JSON.parse(data.answer);
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
              console.log('Set remote description (answer)');
              // Process any queued candidates
              await processQueuedCandidates(pc);
            } catch (err) {
              console.error('Error setting remote description:', err);
            }
          }

          // Handle callee ICE candidates
          if (data.calleeCandidate) {
            const candidateStr = data.calleeCandidate;
            if (!processedCandidatesRef.current.has(candidateStr)) {
              processedCandidatesRef.current.add(candidateStr);
              const candidate = JSON.parse(candidateStr);
              await addIceCandidateToPC(pc, new RTCIceCandidate(candidate));
            }
          }
        });
        unsubscribeRef.current = unsubscribe;
      } else {
        // Check if room exists first
        setConnectionStatus('Checking if room exists...');
        let roomDoc;
        try {
          roomDoc = await getDoc(roomRef);
        } catch (err: any) {
          if (err.code === 'failed-precondition' || err.message?.includes('offline')) {
            setError('Firebase is offline! Please check your internet connection and Firebase configuration.');
            setConnectionStatus('Firebase offline');
          } else {
            setError(`Error checking room: ${err.message || 'Unknown error'}`);
            setConnectionStatus('Error');
          }
          // Cleanup
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
            setLocalStream(null);
          }
          if (pc) {
            pc.close();
            peerConnectionRef.current = null;
          }
          return;
        }
        
        if (!roomDoc.exists()) {
          setError('Room not found! Please check the Room ID or ask the other person to create the room first.');
          setConnectionStatus('Room not found');
          // Cleanup
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
            setLocalStream(null);
          }
          if (pc) {
            pc.close();
            peerConnectionRef.current = null;
          }
          return;
        }

        // Set timeout to check if offer arrives within 10 seconds
        setConnectionStatus('Waiting for other user to join...');
        roomCheckTimeoutRef.current = setTimeout(() => {
          const roomDocCheck = getDoc(roomRef).then((doc) => {
            if (!doc.exists() || !doc.data()?.offer) {
              setError('Room exists but no one is in the call. Please ask the other person to create/join the room first.');
              setConnectionStatus('No offer received');
            }
          });
        }, 10000);

        // Listen for offer
        const unsubscribe = onSnapshot(roomRef, 
          async (snapshot) => {
            const data = snapshot.data();
            if (!data) {
              setError('Room was deleted. Please create a new room.');
              setConnectionStatus('Room deleted');
              return;
            }

          // Clear timeout if offer is received
          if (data.offer && roomCheckTimeoutRef.current) {
            clearTimeout(roomCheckTimeoutRef.current);
            roomCheckTimeoutRef.current = null;
            setConnectionStatus('Connecting...');
          }

          // Handle offer
          if (data.offer && !pc.remoteDescription) {
            try {
              const offer = JSON.parse(data.offer);
              await pc.setRemoteDescription(new RTCSessionDescription(offer));
              console.log('Set remote description (offer)');
              setConnectionStatus('Connected!');

              // Create answer
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              console.log('Created and set local description (answer)');

              await setDoc(roomRef, {
                answer: JSON.stringify(answer),
              }, { merge: true });
              console.log('Sent answer to Firebase');

              // Process any queued candidates
              await processQueuedCandidates(pc);
            } catch (err) {
              console.error('Error handling offer:', err);
              setError('Error processing connection. Please try again.');
            }
          }

          // Handle caller ICE candidates
          if (data.callerCandidate) {
            const candidateStr = data.callerCandidate;
            if (!processedCandidatesRef.current.has(candidateStr)) {
              processedCandidatesRef.current.add(candidateStr);
              const candidate = JSON.parse(candidateStr);
              await addIceCandidateToPC(pc, new RTCIceCandidate(candidate));
            }
          }
        },
        (err) => {
          console.error('Firebase snapshot error:', err);
          if (err.code === 'failed-precondition' || err.message?.includes('offline')) {
            setError('Firebase connection lost! Please check your internet connection.');
            setConnectionStatus('Firebase offline');
          } else {
            setError(`Connection error: ${err.message || 'Unknown error'}`);
            setConnectionStatus('Error');
          }
        });
        unsubscribeRef.current = unsubscribe;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start call';
      setError(errorMessage);
      setConnectionStatus('Error');
      console.error('Error starting call:', err);
      
      // Cleanup on error
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
        setLocalStream(null);
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    }
  }, [createPeerConnection, addIceCandidateToPC, processQueuedCandidates]);

  const endCall = useCallback(() => {
    console.log('Ending call...');
    
    // Clear timeout if exists
    if (roomCheckTimeoutRef.current) {
      clearTimeout(roomCheckTimeoutRef.current);
      roomCheckTimeoutRef.current = null;
    }
    
    // Unsubscribe from Firebase listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (roomIdRef.current) {
      deleteDoc(doc(db, 'rooms', roomIdRef.current)).catch((err) => {
        console.error('Error deleting room:', err);
      });
      roomIdRef.current = null;
    }

    processedCandidatesRef.current.clear();
    iceCandidateQueueRef.current = [];
    setRemoteStream(null);
    setIsCallActive(false);
    setIsMuted(false);
    setError(null);
    setConnectionStatus('Initializing...');
  }, []);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    localStream,
    remoteStream,
    isCallActive,
    isMuted,
    startCall,
    endCall,
    toggleMute,
    error,
    connectionStatus,
  };
};

