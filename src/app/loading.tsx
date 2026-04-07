export default function Loading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "16px",
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          width: "80px",
          height: "1px",
          background: "var(--ink)",
          animation: "loadingPulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--ink-mute)",
        }}
      >
        Loading
      </div>
      <style>{`
        @keyframes loadingPulse {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
