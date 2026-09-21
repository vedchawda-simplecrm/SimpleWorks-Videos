/**
 * Single source of truth for every KPI, chart geometry, tooltip and table
 * row in the Opportunity scenes.
 *
 * dataMode is "illustrative_demo": these are PLACEHOLDER values taken from
 * the production brief's planning example, NOT a real SimpleCRM capture.
 * Replace this file's contents with the captured `opportunity-data.json`
 * (dataMode "crm_capture") before the video is treated as finished.
 * See artifacts/opportunity-demo/capture-notes.md.
 */

export type StageDatum = { stage: string; count: number; value: number };
export type OwnerDatum = { owner: string; value: number };
export type TopOpportunity = {
  name: string;
  owner: string;
  amount: number;
  expectedClose: string;
};

export type OpportunityData = {
  dataMode: "illustrative_demo" | "crm_capture";
  periodLabel: string;
  periodStart: string;
  periodEndExclusive: string;
  currency: string;
  metric: string;
  openOpportunityCount: number;
  totalPipelineValue: number;
  stageBreakdown: StageDatum[];
  ownerBreakdown: OwnerDatum[];
  topOpportunities: TopOpportunity[];
};

export const opportunityData: OpportunityData = {
  dataMode: "illustrative_demo",
  periodLabel: "September 2026",
  periodStart: "2026-09-01",
  periodEndExclusive: "2026-10-01",
  currency: "USD",
  metric: "Unweighted open opportunity amount",
  openOpportunityCount: 12,
  totalPipelineValue: 240000,
  stageBreakdown: [
    { stage: "Qualification", count: 4, value: 60000 },
    { stage: "Proposal/Price Quote", count: 5, value: 100000 },
    { stage: "Negotiation/Review", count: 3, value: 80000 },
  ],
  ownerBreakdown: [
    { owner: "Priya Shah", value: 105000 },
    { owner: "Rahul Mehta", value: 80000 },
    { owner: "Neha Rao", value: 55000 },
  ],
  topOpportunities: [
    {
      name: "Acme — Enterprise Expansion",
      owner: "Priya Shah",
      amount: 45000,
      expectedClose: "2026-09-25",
    },
    {
      name: "Northstar — CRM Rollout",
      owner: "Rahul Mehta",
      amount: 35000,
      expectedClose: "2026-09-28",
    },
    {
      name: "Vertex — Annual Renewal",
      owner: "Neha Rao",
      amount: 30000,
      expectedClose: "2026-09-30",
    },
  ],
};

export const OPPORTUNITY_QUESTION =
  "Show my team's open opportunities expected to close this month in SimpleCRM. Chart pipeline value by sales stage and owner, then list the three largest deals with their owners and expected close dates.";

export const formatCurrency = (value: number) =>
  `$${value.toLocaleString("en-US")}`;

/** "$240K" style, for chart labels where space is tight. */
export const formatCompact = (value: number) =>
  value >= 1000 ? `$${Math.round(value / 1000)}K` : `$${value}`;

export const formatCloseDate = (iso: string) => {
  const [, month, day] = iso.split("-").map(Number);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[month - 1]} ${day}`;
};
