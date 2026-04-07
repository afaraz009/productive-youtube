import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

const DistractionItem = ({
  text,
  icon,
  delay,
  x,
  y,
}: {
  text: string;
  icon: string;
  delay: number;
  x: number;
  y: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const itemSpring = spring({
    frame: frame - delay,
    fps,
    config: { damping: 8, stiffness: 100 },
  });

  const shake = Math.sin((frame - delay) * 0.3) * 3 * itemSpring;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${itemSpring}) rotate(${shake}deg)`,
        opacity: itemSpring,
        background: "rgba(255, 0, 0, 0.15)",
        border: "2px solid rgba(255, 0, 0, 0.4)",
        borderRadius: 16,
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 32 }}>{icon}</span>
      <span
        style={{
          fontSize: 24,
          fontFamily: "system-ui, sans-serif",
          fontWeight: 600,
          color: "#ff6b6b",
        }}
      >
        {text}
      </span>
    </div>
  );
};

export const ProblemScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  // Chaos intensity increases over time
  const chaosIntensity = interpolate(frame, [0, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Screen shake effect
  const shakeX = Math.sin(frame * 0.5) * 5 * chaosIntensity;
  const shakeY = Math.cos(frame * 0.7) * 3 * chaosIntensity;

  // Red vignette
  const vignetteOpacity = interpolate(frame, [30, 90], [0, 0.4], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const distractions = [
    { text: "Shorts", icon: "📱", x: 200, y: 250, delay: 10 },
    { text: "Recommendations", icon: "🎯", x: 1400, y: 200, delay: 20 },
    { text: "Autoplay", icon: "▶️", x: 300, y: 700, delay: 30 },
    { text: "Endless Scroll", icon: "🔄", x: 1300, y: 650, delay: 40 },
    { text: "Clickbait", icon: "🎣", x: 700, y: 150, delay: 50 },
    { text: "Time Wasted", icon: "⏰", x: 1000, y: 750, delay: 60 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "#0a0a0a",
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {/* Animated noise/static background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: 0.03 + chaosIntensity * 0.02,
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${titleSpring})`,
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <h2
          style={{
            fontSize: 80,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 900,
            color: "white",
            margin: 0,
          }}
        >
          YouTube is{" "}
          <span
            style={{
              color: "#ff4444",
              textShadow: `0 0 ${20 * chaosIntensity}px rgba(255, 68, 68, 0.5)`,
            }}
          >
            Designed
          </span>
        </h2>
        <h2
          style={{
            fontSize: 80,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 900,
            color: "white",
            margin: 0,
          }}
        >
          to{" "}
          <span
            style={{
              color: "#ff4444",
              textShadow: `0 0 ${20 * chaosIntensity}px rgba(255, 68, 68, 0.5)`,
            }}
          >
            Distract
          </span>{" "}
          You
        </h2>
      </div>

      {/* Distraction items */}
      {distractions.map((item, i) => (
        <DistractionItem key={i} {...item} />
      ))}

      {/* Red vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 30%, rgba(255, 0, 0, ${vignetteOpacity}) 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* Scan lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.1) 2px,
            rgba(0, 0, 0, 0.1) 4px
          )`,
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
