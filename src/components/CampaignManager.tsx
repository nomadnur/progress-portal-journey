import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Calendar, Target } from 'lucide-react';
import type { AssessmentCampaign, CampaignParticipant, SkillCategory, Profile } from '@/types/database';
import type { CampaignRequirement } from '@/types/campaign';

export const CampaignManager = () => {
  const { user } = useAuth();
  const { isManager } = useUserRole();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<AssessmentCampaign[]>([]);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  useEffect(() => {
    if (user && isManager()) {
      fetchData();
    }
  }, [user, isManager]);

  const fetchData = async () => {
    try {
      // Fetch existing campaigns
      const { data: campaignsData } = await supabase
        .from('assessment_campaigns')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      // Fetch skill categories
      const { data: skillsData } = await supabase
        .from('skill_categories')
        .select('*')
        .order('sort_order');

      // Fetch team members
      const { data: teamData } = await supabase
        .from('profiles')
        .select('*')
        .eq('manager_id', user?.id)
        .order('full_name');

      setCampaigns((campaignsData || []) as AssessmentCampaign[]);
      setSkillCategories(skillsData || []);
      setTeamMembers(teamData || []);
    } catch (error) {
      console.error('Error fetching campaign data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaign data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!title || !startDate || selectedSkills.length === 0 || selectedParticipants.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('assessment_campaigns')
        .insert({
          title,
          description,
          created_by: user?.id,
          start_date: startDate,
          end_date: endDate || null,
          status: 'active',
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Add skill requirements
      const requirements = selectedSkills.map(skillId => ({
        campaign_id: campaign.id,
        skill_category_id: skillId,
        required: true,
      }));

      const { error: requirementsError } = await supabase
        .from('campaign_requirements')
        .insert(requirements);

      if (requirementsError) throw requirementsError;

      // Add participants
      const participants = selectedParticipants.map(userId => ({
        campaign_id: campaign.id,
        user_id: userId,
        invited_by: user?.id,
        status: 'invited' as const,
      }));

      const { error: participantsError } = await supabase
        .from('campaign_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      toast({
        title: 'Success',
        description: 'Campaign created successfully',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setSelectedSkills([]);
      setSelectedParticipants([]);
      setShowCreateForm(false);

      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive',
      });
    }
  };

  const toggleSkillSelection = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const toggleParticipantSelection = (userId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (!isManager()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You need manager permissions to manage assessment campaigns.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Assessment Campaigns</h2>
          <p className="text-muted-foreground">
            Create and manage multi-user assessment campaigns
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Campaign Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Q1 2024 Skills Assessment"
                />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description of the assessment campaign"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Required Skills *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded p-3">
                {skillCategories.map((skill) => (
                  <div key={skill.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={skill.id}
                      checked={selectedSkills.includes(skill.id)}
                      onCheckedChange={() => toggleSkillSelection(skill.id)}
                    />
                    <Label htmlFor={skill.id} className="text-sm">
                      {skill.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Participants *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded p-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={member.id}
                      checked={selectedParticipants.includes(member.id)}
                      onCheckedChange={() => toggleParticipantSelection(member.id)}
                    />
                    <Label htmlFor={member.id} className="text-sm">
                      {member.full_name || member.email}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={createCampaign}>
                Create Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {campaign.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    campaign.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Start: {new Date(campaign.start_date).toLocaleDateString()}</span>
                </div>
                {campaign.end_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>End: {new Date(campaign.end_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              {campaign.description && (
                <p className="text-muted-foreground mt-2">{campaign.description}</p>
              )}
            </CardContent>
          </Card>
        ))}

        {campaigns.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No assessment campaigns created yet. Click "New Campaign" to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};