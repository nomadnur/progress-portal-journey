export type CompetencyScore = 1 | 2 | 3 | 4 | 5;

export interface Competency {
  name: string;
  description: string;
  currentScore: CompetencyScore;
  targetScore: CompetencyScore;
}

export const COMPETENCIES: Omit<Competency, "currentScore" | "targetScore">[] = [
  {
    name: "Curiosity & Critical Thinking",
    description: "Ability to ask insightful questions and analyze problems deeply",
  },
  {
    name: "Strategic Thinking",
    description: "Capacity to understand and plan for long-term objectives",
  },
  {
    name: "Discovery",
    description: "Skill in uncovering user needs and market opportunities",
  },
  {
    name: "Business Acumen",
    description: "Understanding of business metrics and market dynamics",
  },
  {
    name: "Technology & Data",
    description: "Knowledge of technical concepts and data analysis",
  },
  {
    name: "Domain Knowledge",
    description: "Understanding of product, company, and industry specifics",
  },
  {
    name: "Driving Outcomes",
    description: "Ability to execute and deliver measurable results",
  },
  {
    name: "Collaboration",
    description: "Effectiveness in working with cross-functional teams",
  },
  {
    name: "Leadership",
    description: "Capability to influence and guide others",
  },
  {
    name: "Communication",
    description: "Skill in conveying ideas and evangelizing product vision",
  },
];