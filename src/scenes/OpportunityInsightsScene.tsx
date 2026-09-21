import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { ClaudeSurface } from "../components/ClaudeSurface";
import {
  BAR_HEIGHT,
  BAR_LEFT,
  StageBarsChart,
  barFullWidth,
  barRowTop,
} from "../components/StageBarsChart";
import {
  BRAND_BLUE,
  BRAND_BLUE_SOFT,
  CARD_PAD,
  CHART_CARD,
  FONT,
  HAIRLINE_DARK,
  SURFACE_BORDER,
  SURFACE_DARK,
  SURFACE_RAISED,
  TEXT_ON_DARK,
  TEXT_ON_DARK_MUTED,
} from "../theme";
import {
  formatCloseDate,
  formatCompact,
  formatCurrency,
  opportunityData,
} from "../data/opportunityData";
import { PreviewAudio } from "../components/PreviewAudio";

// Shot timing (30fps, 420 frames / 14s)
const TOOLTIP_IN = 96;
const TOOLTIP_OUT = 158;
const BEAT2_START = 180;
const DONUT_START = 200;
const OWNER_FOCUS_IN = 258;
const OWNER_FOCUS_OUT = 316;
const BEAT3_START = 330;
const ROW_STAGGER = 13;
const BEAT_FADE = 14;

const CONTENT_LEFT = CHART_CARD.left + CARD_PAD;
const CONTENT_RIGHT = CHART_CARD.left + CHART_CARD.width - CARD_PAD;

// Donut geometry, inside the card
const DONUT_CX = CONTENT_LEFT + 260;
const DONUT_CY = CHART_CARD.top + 320;
const DONUT_R = 142;
const DONUT_STROKE = 50;
const DONUT_C = 2 * Math.PI * DONUT_R;

const OWNER_COLORS = [BRAND_BLUE, BRAND_BLUE_SOFT, "#6E7681"];

/** Brand accent for words worth landing on. */
const Hl: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: BRAND_BLUE_SOFT }}>{children}</span>
);

const Headline: React.FC<{
  children: React.ReactNode;
  translateY: number;
}> = ({ children, translateY }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: 78,
      textAlign: "center",
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: 56,
      color: TEXT_ON_DARK,
      transform: `translateY(${translateY}px)`,
    }}
  >
    {children}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      left: CONTENT_LEFT,
      top: CHART_CARD.top + CARD_PAD + 4,
      fontFamily: FONT,
      fontWeight: 500,
      fontSize: 28,
      color: TEXT_ON_DARK_MUTED,
    }}
  >
    {children}
  </div>
);

export const OpportunityInsightsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const data = opportunityData;

  const beat1Opacity = interpolate(
    frame,
    [0, 1, BEAT2_START, BEAT2_START + BEAT_FADE],
    [1, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const beat2Opacity = interpolate(
    frame,
    [BEAT2_START + 2, BEAT2_START + BEAT_FADE + 2, BEAT3_START, BEAT3_START + BEAT_FADE],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const beat3Opacity = interpolate(
    frame,
    [BEAT3_START + 2, BEAT3_START + BEAT_FADE + 2],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Each beat eases in with a small rise, which reads as a push without
  // moving the camera back and forth between beats.
  const beatRise = (start: number) =>
    interpolate(frame, [start, start + 26], [14, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });

  // A single slow push into the card across the whole scene.
  const cameraScale = interpolate(frame, [0, 420], [1, 1.05], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  // The stage chart was already drawn at the end of OpportunityPromptScene.
  // This scene picks it up complete so it never appears to reload.
  const barProgress = () => 1;
  const labelOpacity = () => 1;

  const tooltipStage = data.stageBreakdown.reduce((a, b) =>
    b.value > a.value ? b : a,
  );
  const tooltipIndex = data.stageBreakdown.indexOf(tooltipStage);
  const tooltipOpacity = interpolate(
    frame,
    [TOOLTIP_IN, TOOLTIP_IN + 10, TOOLTIP_OUT, TOOLTIP_OUT + 10],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const tooltipBarEnd = BAR_LEFT + barFullWidth(tooltipStage.value);

  const donutSweep = interpolate(frame, [DONUT_START, DONUT_START + 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const ownerTotal = data.ownerBreakdown.reduce((sum, o) => sum + o.value, 0);
  const focusOwnerIndex = 0;
  const ownerFocus = interpolate(
    frame,
    [OWNER_FOCUS_IN, OWNER_FOCUS_IN + 12, OWNER_FOCUS_OUT, OWNER_FOCUS_OUT + 12],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  let cumulative = 0;
  const ownerSegments = data.ownerBreakdown.map((owner, index) => {
    const fraction = owner.value / ownerTotal;
    const startFraction = cumulative;
    cumulative += fraction;
    const localProgress = interpolate(
      donutSweep,
      [startFraction, startFraction + fraction],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    return {
      ...owner,
      index,
      fraction,
      startFraction,
      localProgress,
      color: OWNER_COLORS[index % OWNER_COLORS.length],
    };
  });
  const focusMidFraction =
    ownerSegments[focusOwnerIndex].startFraction +
    ownerSegments[focusOwnerIndex].fraction / 2;
  const focusAngle = -Math.PI / 2 + 2 * Math.PI * focusMidFraction;

  return (
    <ClaudeSurface composerOpacity={0.9}>
      <PreviewAudio track="audio-OpportunityInsightsScene" />
      <AbsoluteFill
        style={{
          transform: `scale(${cameraScale})`,
          transformOrigin: "50% 46%",
        }}
      >
        {/* The response's chart container, inside the product surface */}
        <div
          style={{
            position: "absolute",
            left: CHART_CARD.left,
            top: CHART_CARD.top,
            width: CHART_CARD.width,
            height: CHART_CARD.height,
            borderRadius: 18,
            backgroundColor: SURFACE_DARK,
            border: `1px solid ${SURFACE_BORDER}`,
          }}
        />

        {/* Beat 1 - open pipeline by stage */}
        <AbsoluteFill style={{ opacity: beat1Opacity }}>
          <Headline translateY={beatRise(0)}>
            See where your <Hl>pipeline</Hl> stands.
          </Headline>
          <CardTitle>
            Open pipeline by stage ·{" "}
            <Hl>{data.openOpportunityCount} opportunities</Hl> ·{" "}
            <Hl>{formatCurrency(data.totalPipelineValue)}</Hl> ·{" "}
            {data.periodLabel}
          </CardTitle>

          <StageBarsChart
            barProgress={barProgress}
            labelOpacity={labelOpacity}
          />

          <div
            style={{
              position: "absolute",
              left: tooltipBarEnd - 180,
              top: barRowTop(tooltipIndex) - 68,
              opacity: tooltipOpacity,
              backgroundColor: SURFACE_RAISED,
              border: `1px solid ${SURFACE_BORDER}`,
              color: TEXT_ON_DARK,
              fontFamily: FONT,
              fontWeight: 500,
              fontSize: 26,
              padding: "10px 18px",
              borderRadius: 10,
              whiteSpace: "nowrap",
              boxShadow: "0 14px 30px rgba(0,0,0,0.45)",
            }}
          >
            {formatCurrency(tooltipStage.value)} · {tooltipStage.count}{" "}
            opportunities
          </div>
          <div
            style={{
              position: "absolute",
              left: tooltipBarEnd - 11,
              top: barRowTop(tooltipIndex) + BAR_HEIGHT / 2 - 11,
              width: 22,
              height: 22,
              borderRadius: "50%",
              backgroundColor: "#FFFFFF",
              border: `3px solid ${BRAND_BLUE}`,
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              opacity: tooltipOpacity,
            }}
          />
        </AbsoluteFill>

        {/* Beat 2 - owner breakdown */}
        <AbsoluteFill style={{ opacity: beat2Opacity }}>
          <Headline translateY={beatRise(BEAT2_START)}>
            Understand the <Hl>team</Hl> behind the pipeline.
          </Headline>
          <CardTitle>
            Pipeline by <Hl>owner</Hl> · {data.periodLabel}
          </CardTitle>

          <svg
            width={1920}
            height={1080}
            style={{ position: "absolute", left: 0, top: 0 }}
          >
            <g transform={`rotate(-90 ${DONUT_CX} ${DONUT_CY})`}>
              {ownerSegments.map((segment) => {
                const emphasised =
                  segment.index === focusOwnerIndex ? ownerFocus : 0;
                const length = segment.fraction * DONUT_C * segment.localProgress;
                return (
                  <circle
                    key={segment.owner}
                    cx={DONUT_CX}
                    cy={DONUT_CY}
                    r={DONUT_R}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={DONUT_STROKE + emphasised * 14}
                    strokeDasharray={`${length} ${DONUT_C}`}
                    strokeDashoffset={-segment.startFraction * DONUT_C}
                  />
                );
              })}
            </g>
          </svg>

          <div
            style={{
              position: "absolute",
              left: DONUT_CX - 150,
              top: DONUT_CY - 48,
              width: 300,
              textAlign: "center",
              fontFamily: FONT,
            }}
          >
            <div style={{ fontSize: 46, fontWeight: 600, color: TEXT_ON_DARK }}>
              {formatCompact(data.totalPipelineValue)}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 500,
                color: TEXT_ON_DARK_MUTED,
                marginTop: 2,
              }}
            >
              total pipeline
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: DONUT_CX + 300,
              top: CHART_CARD.top + 190,
              fontFamily: FONT,
            }}
          >
            {ownerSegments.map((segment) => {
              const rowOpacity = interpolate(
                frame,
                [
                  DONUT_START + segment.index * 10,
                  DONUT_START + segment.index * 10 + 18,
                ],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
              const emphasised =
                segment.index === focusOwnerIndex ? ownerFocus : 0;
              return (
                <div
                  key={segment.owner}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    marginBottom: 32,
                    opacity: rowOpacity,
                    transform: `translateX(${emphasised * 10}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      backgroundColor: segment.color,
                    }}
                  />
                  <div
                    style={{
                      width: 280,
                      fontSize: 32,
                      fontWeight: emphasised > 0.5 ? 600 : 500,
                      color: TEXT_ON_DARK,
                    }}
                  >
                    {segment.owner}
                  </div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 600,
                      color: emphasised > 0.5 ? BRAND_BLUE_SOFT : TEXT_ON_DARK,
                    }}
                  >
                    {formatCompact(segment.value)}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: DONUT_CX + DONUT_R * Math.cos(focusAngle) - 11,
              top: DONUT_CY + DONUT_R * Math.sin(focusAngle) - 11,
              width: 22,
              height: 22,
              borderRadius: "50%",
              backgroundColor: "#FFFFFF",
              border: `3px solid ${BRAND_BLUE}`,
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              opacity: ownerFocus,
            }}
          />
        </AbsoluteFill>

        {/* Beat 3 - largest opportunities */}
        <AbsoluteFill style={{ opacity: beat3Opacity }}>
          <Headline translateY={beatRise(BEAT3_START)}>
            Bring your <Hl>biggest opportunities</Hl> into focus.
          </Headline>
          <CardTitle>
            <Hl>Three largest</Hl> open opportunities · {data.periodLabel}
          </CardTitle>

          <div
            style={{
              position: "absolute",
              left: CONTENT_LEFT,
              top: CHART_CARD.top + 140,
              width: CONTENT_RIGHT - CONTENT_LEFT,
              fontFamily: FONT,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                paddingBottom: 16,
                borderBottom: `2px solid ${HAIRLINE_DARK}`,
                fontSize: 24,
                fontWeight: 600,
                color: TEXT_ON_DARK_MUTED,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              <div style={{ width: 540 }}>Opportunity</div>
              <div style={{ width: 300 }}>Owner</div>
              <div style={{ width: 230, textAlign: "right" }}>Amount</div>
              <div style={{ width: 234, textAlign: "right" }}>Expected close</div>
            </div>

            {data.topOpportunities.map((row, index) => {
              const start = BEAT3_START + 20 + index * ROW_STAGGER;
              const rowOpacity = interpolate(frame, [start, start + 16], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const rowRise = interpolate(frame, [start, start + 16], [16, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              });
              return (
                <div
                  key={row.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: 96,
                    paddingLeft: 18,
                    paddingRight: 18,
                    marginLeft: -18,
                    marginRight: -18,
                    borderRadius: 10,
                    backgroundColor:
                      index === 0 ? "rgba(25,118,210,0.16)" : "transparent",
                    borderBottom: `1px solid ${HAIRLINE_DARK}`,
                    opacity: rowOpacity,
                    transform: `translateY(${rowRise}px)`,
                    fontSize: 32,
                    color: TEXT_ON_DARK,
                  }}
                >
                  <div style={{ width: 540, fontWeight: 600 }}>{row.name}</div>
                  <div
                    style={{
                      width: 300,
                      fontWeight: 500,
                      color: TEXT_ON_DARK_MUTED,
                    }}
                  >
                    {row.owner}
                  </div>
                  <div
                    style={{ width: 230, textAlign: "right", fontWeight: 600 }}
                  >
                    {formatCurrency(row.amount)}
                  </div>
                  <div
                    style={{
                      width: 234,
                      textAlign: "right",
                      fontWeight: 500,
                      color: TEXT_ON_DARK_MUTED,
                    }}
                  >
                    {formatCloseDate(row.expectedClose)}
                  </div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </ClaudeSurface>
  );
};
