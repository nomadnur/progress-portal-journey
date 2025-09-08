export type CompetencyScore = 1 | 2 | 3 | 4 | 5;

export interface Competency {
  name: string;
  description: string;
  currentScore: CompetencyScore;
  targetScore: CompetencyScore;
}

// Default skill categories that match the database schema
export const DEFAULT_SKILL_CATEGORIES = [
  {
    name: "Strategic Thinking",
    description: "Ability to think long-term and see the big picture",
  },
  {
    name: "Business Acumen", 
    description: "Understanding of business principles and market dynamics",
  },
  {
    name: "Product Management",
    description: "Skills in product strategy, roadmapping, and execution",
  },
  {
    name: "Data Analysis",
    description: "Ability to interpret data and make data-driven decisions",
  },
  {
    name: "User Research",
    description: "Skills in understanding user needs and conducting research",
  },
  {
    name: "Communication",
    description: "Effective written and verbal communication skills",
  },
  {
    name: "Leadership",
    description: "Ability to lead teams and influence outcomes",
  },
  {
    name: "Technical Skills",
    description: "Understanding of technical concepts and tools",
  },
  {
    name: "Project Management",
    description: "Skills in planning, executing, and delivering projects",
  },
  {
    name: "Innovation",
    description: "Ability to generate new ideas and drive innovation",
  },
];