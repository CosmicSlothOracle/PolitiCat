import React, { useRef, useState } from 'react';

const VINYL_SIZE = 300; // 60 * 5 = 300px

const VinylMusicControl: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const handleToggle = () => {
    if (playing) {
      audioRef.current?.pause();
      videoRef.current?.pause();
      setPlaying(false);
    } else {
      audioRef.current?.play();
      videoRef.current?.play();
      setPlaying(true);
    }
  };

  // Keep video in sync with audio (e.g., if user pauses audio via system controls)
  const handleAudioPause = () => {
    videoRef.current?.pause();
    setPlaying(false);
  };
  const handleAudioPlay = () => {
    videoRef.current?.play();
    setPlaying(true);
  };

  return (
    <div
      className="music-control"
      onClick={handleToggle}
      tabIndex={0}
      aria-label={playing ? 'Pause music' : 'Play music'}
      style={{
        cursor: 'pointer',
        width: VINYL_SIZE,
        height: VINYL_SIZE,
        position: 'relative',
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: playing ? '0 0 40px #00ffff, 0 0 0 8px #00ffff55' : '0 0 16px #888',
        background: '#111',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <video
        ref={videoRef}
        src="/assets/ui/vinyl.mp4"
        loop
        muted
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          objectFit: 'cover',
          opacity: playing ? 1 : 0.7,
          transition: 'box-shadow 0.3s, opacity 0.3s',
          pointerEvents: 'none',
        }}
        tabIndex={-1}
      />
      <audio
        ref={audioRef}
        src="/assets/music/theme.mp3"
        onPause={handleAudioPause}
        onPlay={handleAudioPlay}
      />
      {/* Overlay play/pause icon */}
      {!playing && (
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            fontSize: 72,
            pointerEvents: 'none',
            textShadow: '0 0 24px #00ffff, 0 0 8px #000',
            opacity: 0.95,
            zIndex: 2,
            border: '6px solid #00ffff',
            borderRadius: '50%',
            padding: '32px 38px 32px 44px',
            boxShadow: '0 0 32px #00ffff, 0 0 16px #00ffff99',
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >▶</span>
      )}
    </div>
  );
};

export default VinylMusicControl;