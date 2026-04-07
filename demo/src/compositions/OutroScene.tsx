import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export const OutroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Main content animation
  const mainSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  // CTA button animation
  const ctaSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 8, stiffness: 100 },
  });

  const ctaPulse = Math.sin(frame * 0.1) * 0.03 + 1;

  // Stats counter animation
  const statsProgress = interpolate(frame, [20, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const stats = [
    { label: "Distractions Blocked", value: "∞", suffix: "" },
    { label: "Time Saved", value: Math.round(statsProgress * 47), suffix: "%" },
    { label: "Focus Mode", value: "ON", suffix: "" },
  ];

  // Floating icons
  const icons = ["🚫", "📺", "🎯", "⏰", "🧠", "✨", "💪", "🔥"];

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0a0a12 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Animated background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(79, 172, 254, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(0, 242, 254, 0.1) 0%, transparent 50%)
          `,
        }}
      />

      {/* Floating icons */}
      {icons.map((icon, i) => {
        const delay = i * 5;
        const iconSpring = spring({
          frame: frame - delay,
          fps,
          config: { damping: 20 },
        });

        const angle = (i / icons.length) * Math.PI * 2;
        const radius = 450;
        const x = Math.cos(angle + frame * 0.008) * radius;
        const y = Math.sin(angle + frame * 0.008) * radius;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              fontSize: 40,
              opacity: iconSpring * 0.4,
              transform: `scale(${iconSpring}) rotate(${frame * 0.5}deg)`,
            }}
          >
            {icon}
          </div>
        );
      })}

      {/* Main content */}
      <div
        style={{
          textAlign: "center",
          transform: `scale(${mainSpring})`,
          opacity: mainSpring,
          zIndex: 10,
        }}
      >
        {/* Logo/Icon */}
        <div
          style={{
            width: 120,
            height: 120,
            margin: "0 auto 30px",
            borderRadius: 30,
            background: "linear-gradient(135deg, #FF0000, #cc0000)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 20px 60px rgba(255, 0, 0, 0.3)",
          }}
        >
          <svg width="60" height="42" viewBox="0 0 120 85">
            <path
              d="M117.5 13.5c-1.4-5.2-5.5-9.3-10.6-10.7C97.5 0 60 0 60 0S22.5 0 13.1 2.8C8 4.2 3.9 8.3 2.5 13.5 0 23 0 42.5 0 42.5s0 19.5 2.5 29c1.4 5.2 5.5 9.3 10.6 10.7C22.5 85 60 85 60 85s37.5 0 46.9-2.8c5.1-1.4 9.2-5.5 10.6-10.7 2.5-9.5 2.5-29 2.5-29s0-19.5-2.5-29z"
              fill="white"
            />
            <path d="M48 60.5L79 42.5 48 24.5z" fill="#FF0000" />
          </svg>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 90,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 900,
            color: "white",
            margin: 0,
            letterSpacing: -2,
          }}
        >
          <span style={{ color: "#FF0000" }}>Productive</span> YouTube
        </h1>

        <p
          style={{
            fontSize: 28,
            fontFamily: "system-ui, sans-serif",
            color: "rgba(255, 255, 255, 0.6)",
            margin: "20px 0 40px",
            maxWidth: 600,
          }}
        >
          Transform YouTube into a productivity tool
        </p>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 60,
            marginBottom: 50,
          }}
        >
          {stats.map((stat, i) => {
            const statSpring = spring({
              frame: frame - 15 - i * 8,
              fps,
              config: { damping: 12 },
            });

            return (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  opacity: statSpring,
                  transform: `translateY(${interpolate(statSpring, [0, 1], [20, 0])}px)`,
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: 900,
                    background: "linear-gradient(135deg, #4facfe, #00f2fe)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {stat.value}{stat.suffix}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontFamily: "system-ui, sans-serif",
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginTop: 8,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        <div
          style={{
            transform: `scale(${ctaSpring * ctaPulse})`,
            opacity: ctaSpring,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              background: "linear-gradient(135deg, #4facfe, #00f2fe)",
              padding: "20px 50px",
              borderRadius: 16,
              boxShadow: "0 10px 40px rgba(79, 172, 254, 0.4)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                fill="white"
              />
            </svg>
            <span
              style={{
                fontSize: 24,
                fontFamily: "system-ui, sans-serif",
                fontWeight: 700,
                color: "white",
              }}
            >
              Install Free Extension
            </span>
          </div>
        </div>

        {/* Chrome Web Store badge */}
        <div
          style={{
            marginTop: 30,
            opacity: interpolate(frame, [50, 70], [0, 0.6], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontFamily: "system-ui, sans-serif",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Available on Chrome Web Store
          </span>
        </div>
      </div>

      {/* Corner decorations */}
      {[
        { top: 40, left: 40 },
        { top: 40, right: 40 },
        { bottom: 40, left: 40 },
        { bottom: 40, right: 40 },
      ].map((pos, i) => {
        const cornerSpring = spring({
          frame: frame - i * 5,
          fps,
          config: { damping: 12 },
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              ...pos,
              width: 60,
              height: 60,
              borderLeft: i % 2 === 0 ? "3px solid #4facfe" : undefined,
              borderRight: i % 2 === 1 ? "3px solid #4facfe" : undefined,
              borderTop: i < 2 ? "3px solid #4facfe" : undefined,
              borderBottom: i >= 2 ? "3px solid #4facfe" : undefined,
              opacity: cornerSpring * 0.5,
              transform: `scale(${cornerSpring})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
