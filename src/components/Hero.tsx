export default function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "140px 24px 100px",
        position: "relative",
      }}
    >
      {/* Overline */}
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--ink-faded)",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          marginBottom: "32px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          opacity: 0,
          animation: "fadeUp 0.9s ease forwards 0.2s",
        }}
      >
        <span style={{ display: "inline-block", width: "28px", height: "1px", background: "var(--ink-soft)" }} />
        The AI Marketplace
        <span style={{ display: "inline-block", width: "28px", height: "1px", background: "var(--ink-soft)" }} />
      </div>

      {/* Headline */}
      <h1
        className="display"
        style={{
          fontSize: "clamp(56px, 10vw, 148px)",
          lineHeight: 0.92,
          maxWidth: "1100px",
          color: "var(--ink)",
          opacity: 0,
          animation: "fadeUp 1s ease forwards 0.35s",
        }}
      >
        Stop buying
        <br />
        prompts.{" "}
        <span style={{ color: "var(--ink-mute)" }}>
          Start
          <br />
          buying solutions.
        </span>
      </h1>

      {/* Subtext */}
      <p
        style={{
          marginTop: "36px",
          fontSize: "clamp(16px, 1.5vw, 18px)",
          fontWeight: 500,
          color: "var(--ink-faded)",
          maxWidth: "460px",
          lineHeight: 1.55,
          opacity: 0,
          animation: "fadeUp 0.9s ease forwards 0.55s",
        }}
      >
        Ready-made AI products that work out of the box. Built by experts. Deployed in minutes.
      </p>

      {/* Buttons */}
      <div
        className="hero-buttons"
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "44px",
          opacity: 0,
          animation: "fadeUp 0.9s ease forwards 0.75s",
        }}
      >
        <BtnPrimary>Browse Products</BtnPrimary>
        <BtnGhost>Start Selling</BtnGhost>
      </div>

      {/* Scroll cue */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--ink-mute)",
          opacity: 0,
          animation: "fadeUp 0.9s ease forwards 1s",
        }}
      >
        Scroll
      </div>
    </section>
  );
}

function BtnPrimary({ children }: { children: React.ReactNode }) {
  return (
    <button
      className="btn"
      style={{
        padding: "14px 30px",
        borderRadius: "980px",
        fontSize: "14px",
        fontWeight: 700,
        fontFamily: "inherit",
        cursor: "pointer",
        letterSpacing: "0.01em",
        background: "var(--ink)",
        color: "var(--bg)",
        border: "1px solid var(--ink)",
        transition: "all 0.25s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background = "transparent";
        el.style.color = "var(--ink)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = "var(--ink)";
        el.style.color = "var(--bg)";
      }}
    >
      {children}
    </button>
  );
}

function BtnGhost({ children }: { children: React.ReactNode }) {
  return (
    <button
      className="btn"
      style={{
        padding: "14px 30px",
        borderRadius: "980px",
        fontSize: "14px",
        fontWeight: 700,
        fontFamily: "inherit",
        cursor: "pointer",
        letterSpacing: "0.01em",
        background: "transparent",
        color: "var(--ink)",
        border: "1px solid var(--ink-soft)",
        transition: "all 0.25s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--ink)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--ink-soft)";
      }}
    >
      {children}
    </button>
  );
}
