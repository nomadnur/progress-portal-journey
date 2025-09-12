-- Fix RLS policies for user_roles table to allow initial role assignment
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Create more permissive policies for role management
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert/update roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow initial role assignment (for seeding and onboarding)
CREATE POLICY "Allow initial role assignment"
ON public.user_roles
FOR INSERT
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()
  )
);

-- Create a function to safely assign roles (bypasses RLS for admin operations)
CREATE OR REPLACE FUNCTION public.assign_user_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the calling user is an admin or if it's their first role assignment
  IF has_role(auth.uid(), 'admin'::app_role) OR 
     NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id) THEN
    
    -- Insert or update the role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, _role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;