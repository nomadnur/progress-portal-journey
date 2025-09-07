import { useEffect, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Profile, AssessmentEntry, SkillCategory } from '@/types/database';
import { CompetencyRadar } from '@/components/CompetencyRadar';
import { Users, TrendingUp, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ManagerDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [memberAssessments, setMemberAssessments] = useState<AssessmentEntry[]>([]);
  const [teamAggregateData, setTeamAggregateData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && (profile?.role === 'manager' || profile?.role === 'admin')) {
      fetchManagerData();
    }
  }, [user, profile]);

  useEffect(() => {
    if (selectedMember) {
      fetchMemberAssessments(selectedMember);
    }
  }, [selectedMember]);

  const fetchManagerData = async () => {
    try {
      // Fetch team members
      const { data: members } = await supabase
        .from('profiles')
        .select('*')
        .eq('manager_id', user?.id)
        .order('full_name');

      // Fetch skill categories
      const { data: categories } = await supabase
        .from('skill_categories')
        .select('*')
        .order('sort_order');

      setTeamMembers(members || []);
      setSkillCategories(categories || []);

      // Fetch team aggregate data
      if (members && members.length > 0) {
        await fetchTeamAggregateData(members.map(m => m.id));
      }

      // Set first member as selected by default
      if (members && members.length > 0) {
        setSelectedMember(members[0].id);
      }
    } catch (error) {
      console.error('Error fetching manager data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load manager dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberAssessments = async (memberId: string) => {
    try {
      const { data: assessments } = await supabase
        .from('assessment_entries')
        .select(`
          *,
          skill_category:skill_categories(*)
        `)
        .eq('user_id', memberId)
        .order('assessment_date', { ascending: false });

      setMemberAssessments(assessments || []);
    } catch (error) {
      console.error('Error fetching member assessments:', error);
    }
  };

  const fetchTeamAggregateData = async (memberIds: string[]) => {
    try {
      const { data: allAssessments } = await supabase
        .from('assessment_entries')
        .select(`
          *,
          skill_category:skill_categories(*),
          user:profiles(full_name)
        `)
        .in('user_id', memberIds)
        .order('assessment_date', { ascending: false });

      // Calculate team averages
      const aggregateData = skillCategories.map((category) => {
        const categoryAssessments = allAssessments?.filter(
          (assessment) => assessment.skill_category_id === category.id
        ) || [];

        // Get latest assessment for each team member for this category
        const latestByMember = memberIds.map((memberId) => {
          const memberAssessments = categoryAssessments.filter(
            (assessment) => assessment.user_id === memberId
          );
          return memberAssessments[0]; // Most recent
        }).filter(Boolean);

        const average = latestByMember.length > 0
          ? latestByMember.reduce((sum, assessment) => sum + parseInt(assessment.score), 0) / latestByMember.length
          : 0;

        return {
          name: category.name,
          description: category.description || '',
          currentScore: Math.round(average * 10) / 10,
          targetScore: 5, // Default target
        };
      });

      setTeamAggregateData(aggregateData);
    } catch (error) {
      console.error('Error fetching team aggregate data:', error);
    }
  };

  const getMemberRadarData = () => {
    if (!selectedMember) return [];

    return skillCategories.map((category) => {
      const latestAssessment = memberAssessments.find(
        (assessment) => assessment.skill_category_id === category.id
      );

      return {
        name: category.name,
        description: category.description || '',
        currentScore: latestAssessment ? parseInt(latestAssessment.score) : 1,
        targetScore: 5, // Could fetch from goals table
      };
    });
  };

  const exportData = () => {
    // Basic CSV export functionality
    const csvData = memberAssessments.map((assessment) => ({
      Date: assessment.assessment_date,
      Category: assessment.skill_category?.name,
      Score: assessment.score,
      Notes: assessment.notes || '',
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-data-${selectedMember}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Assessment data exported successfully',
    });
  };

  if (!profile || (profile.role !== 'manager' && profile.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You need manager permissions to access this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  Manager Dashboard
                </h1>
                <p className="text-muted-foreground mt-2">
                  View and analyze your team's progress
                </p>
              </div>
              {selectedMember && (
                <Button onClick={exportData} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Data
                </Button>
              )}
            </div>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teamAggregateData.length > 0 ? (
                    <CompetencyRadar competencies={teamAggregateData} />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No team assessment data available yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Individual Team Member
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Select value={selectedMember} onValueChange={setSelectedMember}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.full_name || member.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedMember && getMemberRadarData().length > 0 && (
                      <CompetencyRadar competencies={getMemberRadarData()} />
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-primary">
                      {teamMembers.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Team members reporting to you
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Average Team Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-primary">
                      {teamAggregateData.length > 0
                        ? (teamAggregateData.reduce((sum, item) => sum + item.currentScore, 0) / teamAggregateData.length).toFixed(1)
                        : '0.0'
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Across all competencies
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Growth Area</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold text-primary">
                      {teamAggregateData.length > 0
                        ? teamAggregateData.reduce((min, item) => 
                            item.currentScore < min.currentScore ? item : min
                          ).name
                        : 'N/A'
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Lowest team average
                    </p>
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

export default ManagerDashboard;