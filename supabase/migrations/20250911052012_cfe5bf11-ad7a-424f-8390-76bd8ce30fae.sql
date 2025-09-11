-- Allow authenticated users to insert skill categories (for seeding purposes)
CREATE POLICY "Authenticated users can insert skill categories" 
ON public.skill_categories 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update skill categories (for potential admin functions)
CREATE POLICY "Authenticated users can update skill categories" 
ON public.skill_categories 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);