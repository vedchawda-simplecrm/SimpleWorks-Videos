/**
 * Copy and figures for the ryabot spot.
 *
 * dataMode "illustrative_demo" means these numbers are written to look
 * plausible, NOT pulled from a real SimpleCRM tenant. Swap in a live export
 * before this is used as a customer-facing claim.
 */
export const dataMode = "illustrative_demo" as const;

export const question = "Which of my deals are slipping this month?";

export const answers = [
  {
    accent: "saffron" as const,
    title: "3 deals have gone quiet",
    body: "No calls, emails or notes logged in the last 14 days.",
  },
  {
    accent: "blue" as const,
    title: "2 close dates already passed",
    body: "Still sitting in Negotiation with no revised date.",
  },
  {
    accent: "saffron" as const,
    title: "1 renewal needs an owner",
    body: "Unassigned since the account manager changed.",
  },
];

export const tagline = "Just ask.";
export const closingLine = "ryabot is built into SimpleCRM.";
