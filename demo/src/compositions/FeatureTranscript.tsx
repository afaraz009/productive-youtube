import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

const TranscriptLine = ({
  timestamp,
  text,
  delay,
  isActive,
}: {
  timestamp: string;
  text: string;
  delay: number;
  isActive: boolean;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lineSpring = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: "12px 16px",
        borderRadius: 8,
        background: isActive ? "rgba(79, 172, 254, 0.15)" : "transparent",
        borderLeft: isActive ? "3px solid #4facfe" : "3px solid transparent",
        transform: `translateX(${interpolate(lineSpring, [0, 1], [50, 0])}px)`,
        opacity: lineSpring,
        transition: "background 0.3s, border-color 0.3s",
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontFamily: "monospace",
          color: isActive ? "#4facfe" : "rgba(255,255,255,0.4)",
          minWidth: 50,
        }}
      >
        {timestamp}
      </span>
      <span
        style={{
          fontSize: 16,
          fontFamily: "system-ui, sans-serif",
          color: isActive ? "white" : "rgba(255,255,255,0.7)",
          lineHeight: 1.5,
        }}
      >
        {text}
      </span>
    </div>
  );
};

export const FeatureTranscript = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  // Mock video progress
  const videoProgress = interpolate(frame, [30, 120], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Active transcript line based on progress
  const activeLineIndex = Math.floor(videoProgress / 20);

  const transcriptLines = [
    { timestamp: "0:00", text: "Welcome to this tutorial on productivity..." },
    { timestamp: "0:24", text: "The key to staying focused is eliminating distractions..." },
    { timestamp: "0:48", text: "Let me show you how this extension works..." },
    { timestamp: "1:12", text: "First, we'll configure the blocking settings..." },
    { timestamp: "1:36", text: "And that's how you reclaim your attention!" },
  ];

  // Panel slide in
  const panelSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 15, stiffness: 60 },
  });

  const panelX = interpolate(panelSpring, [0, 1], [400, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)",
      }}
    >
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
            background: "linear-gradient(135deg, #4facfe, #00f2fe)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0,
          }}
        >
          Video Transcripts
        </h2>
        <p
          style={{
            fontSize: 22,
            fontFamily: "system-ui, sans-serif",
            color: "rgba(255, 255, 255, 0.6)",
            marginTop: 12,
          }}
        >
          Read along, click to jump, copy with timestamps
        </p>
      </div>

      {/* Main content area */}
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 100,
          right: 100,
          bottom: 100,
          display: "flex",
          gap: 40,
        }}
      >
        {/* Mock video player */}
        <div
          style={{
            flex: 1,
            background: "#000",
            borderRadius: 16,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Video area */}
          <div
            style={{
              flex: 1,
              background: "linear-gradient(135deg, #1a1a2e, #2a2a4e)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}
          >
            {/* Play icon */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "30px solid white",
                  borderTop: "18px solid transparent",
                  borderBottom: "18px solid transparent",
                  marginLeft: 8,
                }}
              />
            </div>

            {/* Current time */}
            <div
              style={{
                position: "absolute",
                bottom: 70,
                left: 20,
                fontSize: 14,
                fontFamily: "monospace",
                color: "white",
                background: "rgba(0,0,0,0.7)",
                padding: "4px 8px",
                borderRadius: 4,
              }}
            >
              {Math.floor(videoProgress / 100 * 120)}s / 120s
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ padding: 16, background: "#181818" }}>
            <div
              style={{
                height: 4,
                background: "rgba(255,255,255,0.2)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${videoProgress}%`,
                  height: "100%",
                  background: "#FF0000",
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        </div>

        {/* Transcript panel */}
        <div
          style={{
            width: 500,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.1)",
            overflow: "hidden",
            transform: `translateX(${panelX}px)`,
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontFamily: "system-ui, sans-serif",
                fontWeight: 600,
                color: "white",
              }}
            >
              Transcript
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{
                  padding: "6px 12px",
                  background: "rgba(79, 172, 254, 0.2)",
                  border: "1px solid rgba(79, 172, 254, 0.4)",
                  borderRadius: 6,
                  color: "#4facfe",
                  fontSize: 12,
                  fontFamily: "system-ui, sans-serif",
                  cursor: "pointer",
                }}
              >
                Copy All
              </button>
            </div>
          </div>

          {/* Transcript content */}
          <div style={{ padding: "12px 8px", maxHeight: 500, overflow: "auto" }}>
            {transcriptLines.map((line, i) => (
              <TranscriptLine
                key={i}
                {...line}
                delay={20 + i * 10}
                isActive={i === activeLineIndex}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Feature highlights */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 60,
        }}
      >
        {[
          { icon: "📋", text: "Copy transcript" },
          { icon: "⏱️", text: "Click to seek" },
          { icon: "🔄", text: "Auto-sync" },
        ].map((feature, i) => {
          const featureSpring = spring({
            frame: frame - 60 - i * 10,
            fps,
            config: { damping: 12 },
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: featureSpring,
                transform: `translateY(${interpolate(featureSpring, [0, 1], [20, 0])}px)`,
              }}
            >
              <span style={{ fontSize: 24 }}>{feature.icon}</span>
              <span
                style={{
                  fontSize: 16,
                  fontFamily: "system-ui, sans-serif",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {feature.text}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
