import {
  BRAND_BLUE,
  CARD_PAD,
  CHART_CARD,
  FONT,
  TEXT_ON_DARK,
  TEXT_ON_DARK_MUTED,
} from "../theme";
import { formatCompact, opportunityData } from "../data/opportunityData";

// Bar geometry, in canvas coordinates, inside the shared chart card.
export const BAR_LABEL_RIGHT = CHART_CARD.left + CARD_PAD + 360;
export const BAR_LEFT = BAR_LABEL_RIGHT + 32;
export const BAR_MAX_WIDTH = 700;
export const BAR_TOP = CHART_CARD.top + 150;
export const BAR_HEIGHT = 62;
export const BAR_GAP = 70;

export const barRowTop = (index: number) => BAR_TOP + index * (BAR_HEIGHT + BAR_GAP);
export const barFullWidth = (value: number) => {
  const max = Math.max(...opportunityData.stageBreakdown.map((s) => s.value));
  return (value / max) * BAR_MAX_WIDTH;
};

/**
 * Open pipeline by stage. Shared between the answer reveal at the end of
 * OpportunityPromptScene and the first beat of OpportunityInsightsScene so
 * the two scenes join without the chart jumping.
 */
export const StageBarsChart: React.FC<{
  barProgress: (index: number) => number;
  labelOpacity: (index: number) => number;
}> = ({ barProgress, labelOpacity }) => {
  const data = opportunityData;

  return (
    <>
      {data.stageBreakdown.map((stage, index) => {
        const y = barRowTop(index);
        const full = barFullWidth(stage.value);
        return (
          <div key={stage.stage}>
            <div
              style={{
                position: "absolute",
                left: BAR_LABEL_RIGHT - 360,
                top: y + 16,
                width: 360,
                textAlign: "right",
                fontFamily: FONT,
                fontWeight: 500,
                fontSize: 28,
                color: TEXT_ON_DARK,
                whiteSpace: "nowrap",
              }}
            >
              {stage.stage}
            </div>
            <div
              style={{
                position: "absolute",
                left: BAR_LEFT,
                top: y,
                width: full * barProgress(index),
                height: BAR_HEIGHT,
                borderRadius: 8,
                backgroundColor: BRAND_BLUE,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: BAR_LEFT + full + 20,
                top: y + 13,
                fontFamily: FONT,
                fontWeight: 600,
                fontSize: 32,
                color: TEXT_ON_DARK,
                opacity: labelOpacity(index),
                whiteSpace: "nowrap",
              }}
            >
              {formatCompact(stage.value)}
            </div>
          </div>
        );
      })}

      {/* Shared zero baseline */}
      <div
        style={{
          position: "absolute",
          left: BAR_LEFT - 18,
          top: BAR_TOP - 24,
          width: 2,
          height:
            opportunityData.stageBreakdown.length * (BAR_HEIGHT + BAR_GAP) -
            BAR_GAP +
            48,
          backgroundColor: TEXT_ON_DARK_MUTED,
          opacity: 0.28,
        }}
      />
    </>
  );
};
