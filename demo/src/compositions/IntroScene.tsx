import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

// YouTube Play Button Icon
const PlayIcon = ({ scale, opacity }: { scale: number; opacity: number }) => (
  <div
    style={{
      transform: `scale(${scale})`,
      opacity,
      marginBottom: 40,
    }}
  >
    <svg width="120" height="85" viewBox="0 0 120 85">
      <path
        d="M117.5 13.5c-1.4-5.2-5.5-9.3-10.6-10.7C97.5 0 60 0 60 0S22.5 0 13.1 2.8C8 4.2 3.9 8.3 2.5 13.5 0 23 0 42.5 0 42.5s0 19.5 2.5 29c1.4 5.2 5.5 9.3 10.6 10.7C22.5 85 60 85 60 85s37.5 0 46.9-2.8c5.1-1.4 9.2-5.5 10.6-10.7 2.5-9.5 2.5-29 2.5-29s0-19.5-2.5-29z"
        fill="#FF0000"
      />
      <path d="M48 60.5L79 42.5 48 24.5z" fill="white" />
    </svg>
  </div>
);

// Shield Icon for "Productive"
const ShieldIcon = ({ progress }: { progress: number }) => (
  <div
    style={{
      position: "absolute",
      right: 300,
      top: "50%",
      transform: `translateY(-50%) scale(${progress})`,
      opacity: progress,
    }}
  >
    <svg width="200" height="240" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z"
        fill="url(#shieldGrad)"
        stroke="#4facfe"
        strokeWidth="0.5"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={interpolate(progress, [0, 1], [20, 0])}
      />
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4facfe" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

export const IntroScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background pulse
  const bgPulse = Math.sin(frame * 0.05) * 5;

  // YouTube icon entrance
  const ytSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Main title animation
  const titleSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const titleY = interpolate(titleSpring, [0, 1], [80, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  // Subtitle animation
  const subtitleSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 15, stiffness: 60 },
  });

  const subtitleOpacity = interpolate(subtitleSpring, [0, 1], [0, 1]);

  // Shield animation
  const shieldSpring = spring({
    frame: frame - 45,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 30% 50%, #1a1a2e ${bgPulse}%, #0f0f1a 70%)`,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Animated grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(79, 172, 254, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(79, 172, 254, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          transform: `translateY(${frame * 0.5}px)`,
        }}
      />

      {/* Shield icon */}
      <ShieldIcon progress={shieldSpring} />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <PlayIcon scale={ytSpring} opacity={ytSpring} />

        <div
          style={{
            transform: `translateY(${titleY}px)`,
            opacity: titleOpacity,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 110,
              fontFamily: "system-ui, sans-serif",
              fontWeight: 900,
              color: "white",
              margin: 0,
              letterSpacing: -3,
            }}
          >
            <span style={{ color: "#FF0000" }}>Productive</span>{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #4facfe, #00f2fe)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              YouTube
            </span>
          </h1>
        </div>

        <div
          style={{
            opacity: subtitleOpacity,
            marginTop: 25,
          }}
        >
          <p
            style={{
              fontSize: 32,
              fontFamily: "system-ui, sans-serif",
              fontWeight: 400,
              color: "rgba(255, 255, 255, 0.7)",
              margin: 0,
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            Focus & Distraction Blocker
          </p>
        </div>
      </div>

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => {
        const delay = i * 3;
        const particleSpring = spring({
          frame: frame - delay,
          fps,
          config: { damping: 20 },
        });

        const angle = (i / 20) * Math.PI * 2;
        const radius = 400 + (i % 3) * 80;
        const x = Math.cos(angle + frame * 0.01) * radius;
        const y = Math.sin(angle + frame * 0.01) * radius;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: i % 3 === 0 ? "#FF0000" : i % 3 === 1 ? "#4facfe" : "#00f2fe",
              opacity: particleSpring * 0.6,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
