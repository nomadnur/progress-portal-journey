import { useEffect, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { AssessmentEntry, SkillCategory, Goal } from '@/types/database';
import { CompetencyRadar } from '@/components/CompetencyRadar';
import { Plus, TrendingUp, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [latestAssessments, setLatestAssessments] = useState<AssessmentEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch skill categories
      const { data: categories } = await supabase
        .from('skill_categories')
        .select('*')
        .order('sort_order');

      // Fetch latest assessments for current user
      const { data: assessments } = await supabase
        .from('assessment_entries')
        .select(`
          *,
          skill_category:skill_categories(*)
        `)
        .eq('user_id', user?.id)
        .order('assessment_date', { ascending: false });

      // Fetch goals
      const { data: userGoals } = await supabase
        .from('goals')
        .select(`
          *,
          skill_category:skill_categories(*)
        `)
        .eq('user_id', user?.id);

      setSkillCategories(categories || []);
      setLatestAssessments(assessments || []);
      setGoals(userGoals || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Transform data for radar chart
  const getRadarData = () => {
    return skillCategories.map((category) => {
      const latestAssessment = latestAssessments.find(
        (assessment) => assessment.skill_category_id === category.id
      );
      const goal = goals.find((g) => g.skill_category_id === category.id);

      return {
        name: category.name,
        description: category.description || '',
        currentScore: latestAssessment ? parseInt(latestAssessment.score) : 1,
        targetScore: goal ? parseInt(goal.target_score) : 5,
      };
    });
  };

  const getNextAssessmentDate = () => {
    if (latestAssessments.length === 0) return 'No assessments yet';
    
    const latestDate = new Date(latestAssessments[0].assessment_date);
    const nextDate = new Date(latestDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    
    return nextDate.toLocaleDateString();
  };

  const getGrowthAreas = () => {
    const radarData = getRadarData();
    return radarData
      .filter((item) => item.targetScore - item.currentScore >= 2)
      .slice(0, 3);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <SidebarTrigger />
                <h1 className="text-4xl font-bold text-foreground mt-4">
                  Welcome back, {profile?.full_name || 'User'}
                </h1>
                <p className="text-muted-foreground mt-2">
                  Track your professional growth and competencies
                </p>
              </div>
              <Button onClick={() => navigate('/assessment')} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Assessment
              </Button>
            </div>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Competency Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getRadarData().length > 0 ? (
                    <CompetencyRadar competencies={getRadarData()} />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        No assessments yet. Start your first assessment to see your progress.
                      </p>
                      <Button onClick={() => navigate('/assessment')}>
                        Start First Assessment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Next Assessment Due
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-primary">
                      {getNextAssessmentDate()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Monthly assessments help track your growth
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Growth Areas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getGrowthAreas().length > 0 ? (
                      <ul className="space-y-2">
                        {getGrowthAreas().map((area) => (
                          <li key={area.name} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-accent"></span>
                            <span className="text-sm">{area.name}</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              Gap: {area.targetScore - area.currentScore}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Complete your first assessment to identify growth areas
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;