import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

const FeatureCard = ({
  title,
  description,
  icon,
  delay,
  index,
}: {
  title: string;
  description: string;
  icon: string;
  delay: number;
  index: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const x = interpolate(cardSpring, [0, 1], [-100, 0]);
  const opacity = interpolate(cardSpring, [0, 1], [0, 1]);

  // Checkmark animation
  const checkDelay = delay + 15;
  const checkProgress = interpolate(frame - checkDelay, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.5)),
  });

  return (
    <div
      style={{
        transform: `translateX(${x}px)`,
        opacity,
        background: "linear-gradient(135deg, rgba(79, 172, 254, 0.1), rgba(0, 242, 254, 0.05))",
        border: "1px solid rgba(79, 172, 254, 0.3)",
        borderRadius: 20,
        padding: "30px 40px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 30,
        width: 700,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 70,
          height: 70,
          borderRadius: 16,
          background: "linear-gradient(135deg, #4facfe, #00f2fe)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 36,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <h3
          style={{
            fontSize: 28,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 700,
            color: "white",
            margin: 0,
            marginBottom: 8,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: 18,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 400,
            color: "rgba(255, 255, 255, 0.6)",
            margin: 0,
          }}
        >
          {description}
        </p>
      </div>

      {/* Checkmark */}
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: "50%",
          background: checkProgress > 0 ? "#10b981" : "rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${checkProgress})`,
          flexShrink: 0,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12l5 5L20 7"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={30}
            strokeDashoffset={interpolate(checkProgress, [0, 1], [30, 0])}
          />
        </svg>
      </div>
    </div>
  );
};

export const FeatureBlockers = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  const features = [
    {
      title: "Block Shorts",
      description: "Remove all Shorts sections from your feed",
      icon: "🚫",
      delay: 20,
    },
    {
      title: "Hide Sidebar Button",
      description: "Remove Shorts button from navigation",
      icon: "👁️",
      delay: 35,
    },
    {
      title: "Clean Homepage",
      description: "No more recommended videos tempting you",
      icon: "🏠",
      delay: 50,
    },
    {
      title: "Remove Suggestions",
      description: "Watch page without distracting sidebar",
      icon: "🎯",
      delay: 65,
    },
  ];

  // Progress bar animation
  const progressWidth = interpolate(frame, [80, 140], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79, 172, 254, 0.15), transparent 70%)",
          top: -100,
          right: -100,
        }}
      />

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 100,
          transform: `translateY(${interpolate(titleSpring, [0, 1], [-50, 0])}px)`,
          opacity: titleSpring,
        }}
      >
        <h2
          style={{
            fontSize: 64,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 900,
            background: "linear-gradient(135deg, #4facfe, #00f2fe)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0,
          }}
        >
          Algorithm Blockers
        </h2>
        <p
          style={{
            fontSize: 24,
            fontFamily: "system-ui, sans-serif",
            color: "rgba(255, 255, 255, 0.6)",
            marginTop: 10,
          }}
        >
          Take back control of your attention
        </p>
      </div>

      {/* Feature cards */}
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 280,
        }}
      >
        {features.map((feature, i) => (
          <FeatureCard key={i} {...feature} index={i} />
        ))}
      </div>

      {/* Right side - Mock YouTube interface being cleaned */}
      <div
        style={{
          position: "absolute",
          right: 100,
          top: 200,
          width: 500,
          height: 650,
          background: "#181818",
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Mock header */}
        <div
          style={{
            height: 50,
            background: "#202020",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 80,
              height: 24,
              background: "#FF0000",
              borderRadius: 4,
            }}
          />
          <div
            style={{
              flex: 1,
              height: 32,
              background: "#121212",
              borderRadius: 16,
            }}
          />
        </div>

        {/* Mock content - items disappearing */}
        {[0, 1, 2, 3, 4].map((i) => {
          const itemDisappear = interpolate(
            frame,
            [30 + i * 20, 50 + i * 20],
            [1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={i}
              style={{
                margin: 20,
                marginTop: i === 0 ? 20 : 10,
                height: 100,
                background: i % 2 === 0 ? "rgba(255,0,0,0.2)" : "#282828",
                borderRadius: 12,
                opacity: i % 2 === 0 ? itemDisappear : 1,
                transform: `scale(${i % 2 === 0 ? itemDisappear : 1})`,
                display: "flex",
                alignItems: "center",
                padding: 15,
                gap: 15,
              }}
            >
              <div
                style={{
                  width: 120,
                  height: 70,
                  background: i % 2 === 0 ? "#ff4444" : "#383838",
                  borderRadius: 8,
                }}
              />
              <div>
                <div
                  style={{
                    width: 200,
                    height: 16,
                    background: "#484848",
                    borderRadius: 4,
                    marginBottom: 10,
                  }}
                />
                <div
                  style={{
                    width: 120,
                    height: 12,
                    background: "#383838",
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 100,
          right: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontFamily: "system-ui, sans-serif",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Distractions Blocked
          </span>
          <span
            style={{
              fontSize: 16,
              fontFamily: "system-ui, sans-serif",
              color: "#10b981",
              fontWeight: 600,
            }}
          >
            {Math.round(progressWidth)}%
          </span>
        </div>
        <div
          style={{
            height: 8,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressWidth}%`,
              height: "100%",
              background: "linear-gradient(90deg, #4facfe, #10b981)",
              borderRadius: 4,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
