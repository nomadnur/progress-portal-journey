export type UserRole = 'team_member' | 'manager' | 'admin';
export type CompetencyScore = '1' | '2' | '3' | '4' | '5';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface AssessmentEntry {
  id: string;
  user_id: string;
  skill_category_id: string;
  score: CompetencyScore;
  notes: string | null;
  assessment_date: string;
  created_at: string;
  updated_at: string;
  skill_category?: SkillCategory;
  artifacts?: Artifact[];
}

export interface Goal {
  id: string;
  user_id: string;
  skill_category_id: string;
  target_score: CompetencyScore;
  target_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  skill_category?: SkillCategory;
}

export interface Artifact {
  id: string;
  assessment_entry_id: string;
  title: string;
  url: string | null;
  file_path: string | null;
  file_type: string | null;
  created_at: string;
}