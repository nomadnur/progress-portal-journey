import { supabase } from './supabase';

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