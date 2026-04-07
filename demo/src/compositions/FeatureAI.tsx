import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

const AIServiceCard = ({
  name,
  icon,
  color,
  delay,
  isSelected,
}: {
  name: string;
  icon: string;
  color: string;
  delay: number;
  isSelected: boolean;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const scale = interpolate(cardSpring, [0, 1], [0.8, 1]);
  const opacity = interpolate(cardSpring, [0, 1], [0, 1]);

  // Selection animation
  const selectionGlow = isSelected
    ? Math.sin(frame * 0.1) * 0.3 + 0.7
    : 0;

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        opacity,
        background: isSelected
          ? `linear-gradient(135deg, ${color}30, ${color}10)`
          : "rgba(255,255,255,0.03)",
        border: `2px solid ${isSelected ? color : "rgba(255,255,255,0.1)"}`,
        borderRadius: 16,
        padding: "20px 30px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: isSelected ? `0 0 30px ${color}${Math.round(selectionGlow * 50)}` : "none",
        transition: "all 0.3s",
      }}
    >
      <span style={{ fontSize: 36 }}>{icon}</span>
      <span
        style={{
          fontSize: 20,
          fontFamily: "system-ui, sans-serif",
          fontWeight: 600,
          color: isSelected ? "white" : "rgba(255,255,255,0.6)",
        }}
      >
        {name}
      </span>
      {isSelected && (
        <div
          style={{
            marginLeft: "auto",
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: color,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12l5 5L20 7"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

const ActionButton = ({
  icon,
  text,
  color,
  delay,
}: {
  icon: string;
  text: string;
  color: string;
  delay: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const btnSpring = spring({
    frame: frame - delay,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  const pulse = Math.sin((frame - delay) * 0.15) * 0.05 + 1;

  return (
    <div
      style={{
        transform: `scale(${btnSpring * pulse})`,
        opacity: btnSpring,
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        borderRadius: 12,
        padding: "16px 28px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        boxShadow: `0 4px 20px ${color}40`,
      }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span
        style={{
          fontSize: 18,
          fontFamily: "system-ui, sans-serif",
          fontWeight: 600,
          color: "white",
        }}
      >
        {text}
      </span>
    </div>
  );
};

export const FeatureAI = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  // Selected service cycles through
  const selectedIndex = Math.floor(frame / 40) % 4;

  const aiServices = [
    { name: "ChatGPT", icon: "🤖", color: "#10a37f" },
    { name: "Gemini", icon: "✨", color: "#4285f4" },
    { name: "Claude", icon: "🧠", color: "#cc785c" },
    { name: "Grok", icon: "⚡", color: "#1da1f2" },
  ];

  const actions = [
    { icon: "🌐", text: "Translate", color: "#4facfe" },
    { icon: "📝", text: "Summarize", color: "#10b981" },
    { icon: "📚", text: "Vocabulary", color: "#8b5cf6" },
  ];

  // Typing animation for the output
  const outputText = "The video discusses productivity techniques including time-blocking, the Pomodoro method, and eliminating digital distractions...";
  const charsToShow = Math.min(
    outputText.length,
    Math.max(0, Math.floor((frame - 70) * 0.8))
  );

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)",
      }}
    >
      {/* Animated background orbs */}
      {[
        { x: 200, y: 200, color: "#10a37f", size: 300 },
        { x: 1600, y: 300, color: "#4285f4", size: 250 },
        { x: 1000, y: 800, color: "#8b5cf6", size: 200 },
      ].map((orb, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: orb.x + Math.sin(frame * 0.02 + i) * 30,
            top: orb.y + Math.cos(frame * 0.02 + i) * 30,
            width: orb.size,
            height: orb.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${orb.color}20, transparent 70%)`,
            filter: "blur(40px)",
          }}
        />
      ))}

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          transform: `translateY(${interpolate(titleSpring, [0, 1], [-30, 0])}px)`,
          opacity: titleSpring,
        }}
      >
        <h2
          style={{
            fontSize: 56,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 900,
            background: "linear-gradient(135deg, #4facfe, #00f2fe, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0,
          }}
        >
          AI-Powered Actions
        </h2>
        <p
          style={{
            fontSize: 22,
            fontFamily: "system-ui, sans-serif",
            color: "rgba(255, 255, 255, 0.6)",
            marginTop: 12,
          }}
        >
          Send transcripts to your favorite AI with one click
        </p>
      </div>

      {/* Left side - AI Services */}
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 220,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontFamily: "system-ui, sans-serif",
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          Choose your AI
        </span>
        {aiServices.map((service, i) => (
          <AIServiceCard
            key={i}
            {...service}
            delay={15 + i * 8}
            isSelected={i === selectedIndex}
          />
        ))}
      </div>

      {/* Center - Action buttons */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 300,
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontFamily: "system-ui, sans-serif",
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          Quick Actions
        </span>
        {actions.map((action, i) => (
          <ActionButton key={i} {...action} delay={40 + i * 12} />
        ))}
      </div>

      {/* Right side - Output preview */}
      <div
        style={{
          position: "absolute",
          right: 100,
          top: 220,
          width: 500,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontFamily: "system-ui, sans-serif",
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            letterSpacing: 2,
            marginBottom: 16,
            display: "block",
          }}
        >
          AI Output
        </span>
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: 24,
            minHeight: 300,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
              paddingBottom: 16,
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <span style={{ fontSize: 20 }}>
              {aiServices[selectedIndex].icon}
            </span>
            <span
              style={{
                fontSize: 16,
                fontFamily: "system-ui, sans-serif",
                fontWeight: 600,
                color: aiServices[selectedIndex].color,
              }}
            >
              {aiServices[selectedIndex].name} Summary
            </span>
          </div>
          <p
            style={{
              fontSize: 16,
              fontFamily: "system-ui, sans-serif",
              color: "rgba(255,255,255,0.8)",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {outputText.slice(0, charsToShow)}
            {charsToShow < outputText.length && (
              <span
                style={{
                  opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
                  color: "#4facfe",
                }}
              >
                |
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Connection lines */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4facfe" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {/* Animated dashed lines connecting elements */}
        <line
          x1="520"
          y1="400"
          x2="720"
          y2="400"
          stroke="url(#lineGrad)"
          strokeWidth="2"
          strokeDasharray="8 4"
          strokeDashoffset={-frame}
          opacity={interpolate(frame, [50, 70], [0, 0.6], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        />
        <line
          x1="1050"
          y1="400"
          x2="1200"
          y2="350"
          stroke="url(#lineGrad)"
          strokeWidth="2"
          strokeDasharray="8 4"
          strokeDashoffset={-frame}
          opacity={interpolate(frame, [60, 80], [0, 0.6], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        />
      </svg>
    </AbsoluteFill>
  );
};
