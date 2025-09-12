export type CampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type ParticipantStatus = 'invited' | 'in_progress' | 'completed';
export type AppRole = 'admin' | 'manager' | 'team_member';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface AssessmentCampaign {
  id: string;
  title: string;
  description?: string;
  created_by: string;
  start_date: string;
  end_date?: string;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
}

export interface CampaignParticipant {
  id: string;
  campaign_id: string;
  user_id: string;
  status: ParticipantStatus;
  invited_by: string;
  invited_at: string;
  completed_at?: string;
  created_at: string;
  profile?: {
    full_name: string;
    email: string;
  };
}

export interface CampaignRequirement {
  id: string;
  campaign_id: string;
  skill_category_id: string;
  required: boolean;
  target_score?: string;
  created_at: string;
  skill_category?: {
    name: string;
    description: string;
  };
}