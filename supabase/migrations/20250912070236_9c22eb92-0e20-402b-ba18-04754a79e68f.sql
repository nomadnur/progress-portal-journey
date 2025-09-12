-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'team_member');

-- Create user roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create assessment campaigns table for multi-user assessments
CREATE TABLE public.assessment_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on assessment_campaigns
ALTER TABLE public.assessment_campaigns ENABLE ROW LEVEL SECURITY;

-- Create campaign participants table
CREATE TABLE public.campaign_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.assessment_campaigns(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'in_progress', 'completed')),
    invited_by UUID REFERENCES auth.users(id) NOT NULL,
    invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (campaign_id, user_id)
);

-- Enable RLS on campaign_participants
ALTER TABLE public.campaign_participants ENABLE ROW LEVEL SECURITY;

-- Create campaign requirements table (which skills are required for each campaign)
CREATE TABLE public.campaign_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.assessment_campaigns(id) ON DELETE CASCADE NOT NULL,
    skill_category_id UUID REFERENCES public.skill_categories(id) ON DELETE CASCADE NOT NULL,
    required BOOLEAN NOT NULL DEFAULT true,
    target_score TEXT CHECK (target_score IN ('1', '2', '3', '4', '5')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (campaign_id, skill_category_id)
);

-- Enable RLS on campaign_requirements
ALTER TABLE public.campaign_requirements ENABLE ROW LEVEL SECURITY;

-- Add campaign_id to assessment_entries to link assessments to campaigns
ALTER TABLE public.assessment_entries 
ADD COLUMN campaign_id UUID REFERENCES public.assessment_campaigns(id);

-- Create index for better performance
CREATE INDEX idx_assessment_entries_campaign_id ON public.assessment_entries(campaign_id);

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Create RLS policies for assessment_campaigns
CREATE POLICY "Managers can create campaigns" 
ON public.assessment_campaigns 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Campaign creators and participants can view campaigns" 
ON public.assessment_campaigns 
FOR SELECT 
USING (
    auth.uid() = created_by OR 
    EXISTS (
        SELECT 1 FROM public.campaign_participants 
        WHERE campaign_id = assessment_campaigns.id 
        AND user_id = auth.uid()
    ) OR
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Campaign creators can update their campaigns" 
ON public.assessment_campaigns 
FOR UPDATE 
USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- Create RLS policies for campaign_participants
CREATE POLICY "Campaign creators can manage participants" 
ON public.campaign_participants 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.assessment_campaigns 
        WHERE id = campaign_participants.campaign_id 
        AND created_by = auth.uid()
    ) OR
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view their own participation" 
ON public.campaign_participants 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create RLS policies for campaign_requirements
CREATE POLICY "Campaign creators can manage requirements" 
ON public.campaign_requirements 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.assessment_campaigns 
        WHERE id = campaign_requirements.campaign_id 
        AND created_by = auth.uid()
    ) OR
    public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Campaign participants can view requirements" 
ON public.campaign_requirements 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.campaign_participants 
        WHERE campaign_id = campaign_requirements.campaign_id 
        AND user_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.assessment_campaigns 
        WHERE id = campaign_requirements.campaign_id 
        AND created_by = auth.uid()
    ) OR
    public.has_role(auth.uid(), 'admin')
);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_assessment_campaigns_updated_at
BEFORE UPDATE ON public.assessment_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles table to remove role column since we're using user_roles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Create function to automatically assign default role when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default role for new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'team_member');
  
  RETURN NEW;
END;
$$;

-- Create trigger to assign default role on user creation
CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_role();