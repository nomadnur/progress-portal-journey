import { supabase } from '@/integrations/supabase/client';

export const seedSkillCategories = async () => {
  const skillCategories = [
    { name: 'Strategic Thinking', description: 'Ability to think long-term and see the big picture', sort_order: 1 },
    { name: 'Business Acumen', description: 'Understanding of business principles and market dynamics', sort_order: 2 },
    { name: 'Product Management', description: 'Skills in product strategy, roadmapping, and execution', sort_order: 3 },
    { name: 'Data Analysis', description: 'Ability to interpret data and make data-driven decisions', sort_order: 4 },
    { name: 'User Research', description: 'Skills in understanding user needs and conducting research', sort_order: 5 },
    { name: 'Communication', description: 'Effective written and verbal communication skills', sort_order: 6 },
    { name: 'Leadership', description: 'Ability to lead teams and influence outcomes', sort_order: 7 },
    { name: 'Technical Skills', description: 'Understanding of technical concepts and tools', sort_order: 8 },
    { name: 'Project Management', description: 'Skills in planning, executing, and delivering projects', sort_order: 9 },
    { name: 'Innovation', description: 'Ability to generate new ideas and drive innovation', sort_order: 10 },
  ];

  // Check if categories already exist
  const { data: existing } = await supabase
    .from('skill_categories')
    .select('id')
    .limit(1);

  if (existing && existing.length > 0) {
    console.log('Skill categories already exist, skipping seed');
    return;
  }

  // Insert skill categories
  const { error } = await supabase
    .from('skill_categories')
    .insert(skillCategories);

  if (error) {
    console.error('Error seeding skill categories:', error);
  } else {
    console.log('Successfully seeded skill categories');
  }
};

export const seedDemoData = async (currentUserId: string) => {
  try {
    // First, ensure the user has a manager role for testing
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({ 
        user_id: currentUserId, 
        role: 'manager' 
      }, { 
        onConflict: 'user_id,role' 
      });

    if (roleError) {
      console.error('Error setting user role:', roleError);
    }

    // Check if demo data already exists for this user
    const { data: existingAssessments } = await supabase
      .from('assessment_entries')
      .select('id')
      .eq('user_id', currentUserId)
      .limit(1);

    if (existingAssessments && existingAssessments.length > 0) {
      console.log('Demo data already exists for user, skipping seed');
      return;
    }

    // Get all skill categories
    const { data: skillCategories } = await supabase
      .from('skill_categories')
      .select('id, name')
      .order('sort_order');

    if (!skillCategories || skillCategories.length === 0) {
      console.error('No skill categories found. Please seed skill categories first.');
      return;
    }

    // Create demo assessment entries for the current user
    const demoAssessments = skillCategories.map((category, index) => ({
      user_id: currentUserId,
      skill_category_id: category.id,
      score: String(Math.floor(Math.random() * 3) + 2) as '2' | '3' | '4', // Random scores between 2-4
      notes: `Current assessment for ${category.name}. Working on improving this area through targeted practice and learning.`,
      assessment_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString() // Random date within last 90 days
    }));

    // Insert assessment entries
    const { data: insertedAssessments, error: assessmentError } = await supabase
      .from('assessment_entries')
      .insert(demoAssessments)
      .select('id, skill_category_id');

    if (assessmentError) {
      console.error('Error seeding assessment entries:', assessmentError);
      return;
    }

    // Create demo goals for improvement areas (lower scoring skills)
    const improvementGoals = skillCategories
      .filter((_, index) => Math.random() > 0.4) // About 60% chance for each skill
      .map(category => ({
        user_id: currentUserId,
        skill_category_id: category.id,
        target_score: String(Math.floor(Math.random() * 2) + 4) as '4' | '5', // Target scores of 4 or 5
        target_date: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date within next 180 days
        notes: `Goal to improve ${category.name} through focused learning and practical application.`
      }));

    if (improvementGoals.length > 0) {
      const { error: goalsError } = await supabase
        .from('goals')
        .insert(improvementGoals);

      if (goalsError) {
        console.error('Error seeding goals:', goalsError);
      }
    }

    // Create demo artifacts for some assessments
    if (insertedAssessments) {
      const demoArtifacts = insertedAssessments
        .filter(() => Math.random() > 0.6) // About 40% of assessments get artifacts
        .map(assessment => ({
          assessment_entry_id: assessment.id,
          title: `Portfolio Example - ${skillCategories.find(c => c.id === assessment.skill_category_id)?.name}`,
          url: 'https://example.com/portfolio',
          file_type: 'document'
        }));

      if (demoArtifacts.length > 0) {
        const { error: artifactsError } = await supabase
          .from('artifacts')
          .insert(demoArtifacts);

        if (artifactsError) {
          console.error('Error seeding artifacts:', artifactsError);
        }
      }
    }

    console.log('Successfully seeded demo data for user');
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
};