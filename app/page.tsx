'use client';

import { useState } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import styles from './page.module.css';

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const { localStream, remoteStream, isCallActive, isMuted, startCall, endCall, toggleMute, error, connectionStatus } = useWebRTC();

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 9);
    setRoomId(newRoomId);
    setIsCaller(true);
    setIsInRoom(true);
    startCall(newRoomId, true);
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      setIsCaller(false);
      setIsInRoom(true);
      startCall(roomId.trim(), false);
    }
  };

  const handleEndCall = () => {
    endCall();
    setIsInRoom(false);
    setRoomId('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>🎤 Audio Communication</h1>
        <p className={styles.subtitle}>WebRTC-based voice chat</p>

        {error && (
          <div className={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {!isInRoom ? (
          <div className={styles.roomControls}>
            <button onClick={handleCreateRoom} className={styles.buttonPrimary}>
              Create Room
            </button>
            <div className={styles.divider}>
              <span>OR</span>
            </div>
            <div className={styles.joinSection}>
              <input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <button
                onClick={handleJoinRoom}
                className={styles.buttonSecondary}
                disabled={!roomId.trim()}
              >
                Join Room
              </button>
            </div>
            {roomId && (
              <div className={styles.roomIdDisplay}>
                <p>Room ID: <strong>{roomId}</strong></p>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.callContainer}>
            <div className={styles.status}>
              {isCallActive ? (
                <div className={styles.statusActive}>
                  <span className={styles.statusDot}></span>
                  Connected
                </div>
              ) : (
                <div className={styles.statusConnecting}>
                  <span className={styles.statusDot}></span>
                  {connectionStatus}
                </div>
              )}
            </div>

            <div className={styles.streams}>
              <div className={styles.streamCard}>
                <div className={styles.streamLabel}>You</div>
                {localStream && (
                  <div className={styles.audioIndicator}>
                    <div className={styles.waveform}>
                      <div className={styles.bar}></div>
                      <div className={styles.bar}></div>
                      <div className={styles.bar}></div>
                      <div className={styles.bar}></div>
                    </div>
                    <audio
                      ref={(audio) => {
                        if (audio && localStream) {
                          audio.srcObject = localStream;
                          audio.muted = true; // Prevent echo
                        }
                      }}
                      autoPlay
                    />
                  </div>
                )}
                <div className={styles.muteStatus}>
                  {isMuted ? '🔇 Muted' : '🔊 Speaking'}
                </div>
              </div>

              <div className={styles.streamCard}>
                <div className={styles.streamLabel}>Remote</div>
                {remoteStream ? (
                  <div className={styles.audioIndicator}>
                    <div className={styles.waveform}>
                      <div className={styles.bar}></div>
                      <div className={styles.bar}></div>
                      <div className={styles.bar}></div>
                      <div className={styles.bar}></div>
                    </div>
                    <audio
                      ref={(audio) => {
                        if (audio && remoteStream) {
                          audio.srcObject = remoteStream;
                        }
                      }}
                      autoPlay
                    />
                  </div>
                ) : (
                  <div className={styles.waiting}>
                    Waiting for other user...
                  </div>
                )}
              </div>
            </div>

            <div className={styles.controls}>
              <button
                onClick={toggleMute}
                className={`${styles.controlButton} ${isMuted ? styles.muted : ''}`}
              >
                {isMuted ? '🔇' : '🔊'}
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>
              <button
                onClick={handleEndCall}
                className={`${styles.controlButton} ${styles.endCall}`}
              >
                📞
                <span>End Call</span>
              </button>
            </div>

            <div className={styles.roomInfo}>
              <p>Room ID: <strong>{roomId}</strong></p>
              <p className={styles.shareText}>Share this Room ID with the other person to connect</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

