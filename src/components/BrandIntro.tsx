import React, { useEffect, useRef } from "react";

interface BrandIntroProps {
  onFinish: () => void;
}

const BrandIntro: React.FC<BrandIntroProps> = ({ onFinish }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Prevent scrolling while intro is active
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Unmute video on any user interaction
  useEffect(() => {
    const unmute = () => {
      if (videoRef.current) {
        videoRef.current.muted = false;
      }
      window.removeEventListener('click', unmute);
      window.removeEventListener('keydown', unmute);
    };
    window.addEventListener('click', unmute);
    window.addEventListener('keydown', unmute);
    return () => {
      window.removeEventListener('click', unmute);
      window.removeEventListener('keydown', unmute);
    };
  }, []);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "black", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <video
        ref={videoRef}
        src="/assets/brand/intro.mp4"
        autoPlay
        playsInline
        muted
        onEnded={onFinish}
        style={{ width: "100vw", height: "100vh", objectFit: "cover" }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 10001
        }}
      >
        <span
          style={{
            color: "#fff",
            fontSize: "3vw",
            fontWeight: 700,
            opacity: 0.7,
            textShadow: "0 2px 16px #000, 0 0 8px #000",
            letterSpacing: "0.2em",
            background: "rgba(0,0,0,0.1)",
            borderRadius: "12px",
            padding: "1vw 3vw"
          }}
        >
          a milch production
        </span>
      </div>
      <button
        onClick={onFinish}
        style={{
          position: "absolute", top: 20, right: 20, zIndex: 10002,
          background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", padding: "1rem", fontSize: "1rem", borderRadius: "8px", cursor: "pointer"
        }}
      >
        Skip
      </button>
    </div>
  );
};

export default BrandIntro;