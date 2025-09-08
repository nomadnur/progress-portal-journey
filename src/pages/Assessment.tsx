import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { SkillCategory, AssessmentEntry } from "@/types/database";
import { useNavigate } from 'react-router-dom';
import { seedSkillCategories } from '@/lib/seedData';

interface AssessmentFormValues {
  assessmentDate: string;
  competencies: {
    [key: string]: {
      score: string;
      notes: string;
      artifacts: string;
    };
  };
}

const Assessment = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentEntry[]>([]);

  const form = useForm<AssessmentFormValues>({
    defaultValues: {
      assessmentDate: new Date().toISOString().split('T')[0],
      competencies: {},
    },
  });

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    await seedSkillCategories();
    fetchSkillCategories();
    fetchAssessmentHistory();
  };

  const fetchSkillCategories = async () => {
    const { data, error } = await supabase
      .from('skill_categories')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('Error fetching skill categories:', error);
      return;
    }

    setSkillCategories(data || []);
    
    // Initialize form with categories
    const defaultValues = (data || []).reduce((acc, category) => ({
      ...acc,
      [category.id]: {
        score: "3",
        notes: "",
        artifacts: "",
      },
    }), {});
    
    form.setValue('competencies', defaultValues);
  };

  const fetchAssessmentHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('assessment_entries')
      .select(`
        *,
        skill_category:skill_categories(name)
      `)
      .eq('user_id', user.id)
      .order('assessment_date', { ascending: false });

    if (error) {
      console.error('Error fetching assessment history:', error);
      return;
    }

    setAssessmentHistory(data || []);
  };

  const onSubmit = async (data: AssessmentFormValues) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Prepare assessment entries
      const entries = Object.entries(data.competencies).map(([categoryId, assessment]) => ({
        user_id: user.id,
        skill_category_id: categoryId,
        score: assessment.score,
        notes: assessment.notes || null,
        assessment_date: data.assessmentDate,
      }));

      // Insert assessment entries
      const { error: entriesError } = await supabase
        .from('assessment_entries')
        .upsert(entries, {
          onConflict: 'user_id,skill_category_id,assessment_date'
        });

      if (entriesError) throw entriesError;

      // Handle artifacts (simple URL storage for now)
      for (const [categoryId, assessment] of Object.entries(data.competencies)) {
        if (assessment.artifacts) {
          const { data: entryData } = await supabase
            .from('assessment_entries')
            .select('id')
            .eq('user_id', user.id)
            .eq('skill_category_id', categoryId)
            .eq('assessment_date', data.assessmentDate)
            .single();

          if (entryData) {
            await supabase
              .from('artifacts')
              .insert({
                assessment_entry_id: entryData.id,
                title: 'Evidence Link',
                url: assessment.artifacts,
              });
          }
        }
      }

      toast({
        title: "Assessment Submitted",
        description: "Your self-assessment has been recorded successfully.",
      });

      // Reset form and refresh history
      form.reset({
        assessmentDate: new Date().toISOString().split('T')[0],
        competencies: skillCategories.reduce((acc, category) => ({
          ...acc,
          [category.id]: { score: "3", notes: "", artifacts: "" },
        }), {}),
      });
      
      await fetchAssessmentHistory();
      navigate('/');
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <SidebarTrigger />
            <h1 className="text-4xl font-bold mb-8 text-foreground">Assessment</h1>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Self-Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="current">
                  <TabsList>
                    <TabsTrigger value="current">New Assessment</TabsTrigger>
                    <TabsTrigger value="history">Assessment History</TabsTrigger>
                  </TabsList>
                  <TabsContent value="current">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="assessmentDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assessment Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {skillCategories.map((category) => (
                          <Card key={category.id}>
                            <CardHeader>
                              <CardTitle className="text-lg">{category.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <p className="text-muted-foreground mb-4">{category.description}</p>
                              
                              <FormField
                                control={form.control}
                                name={`competencies.${category.id}.score`}
                                render={({ field }) => (
                                  <FormItem className="space-y-3">
                                    <FormLabel>Score (1-5)</FormLabel>
                                    <FormControl>
                                      <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex space-x-4"
                                      >
                                        {[1, 2, 3, 4, 5].map((score) => (
                                          <FormItem key={score} className="flex items-center space-x-2">
                                            <FormControl>
                                              <RadioGroupItem value={score.toString()} />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                              {score}
                                            </FormLabel>
                                          </FormItem>
                                        ))}
                                      </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`competencies.${category.id}.notes`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Describe your progress, examples, or areas for improvement..."
                                        className="resize-none"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`competencies.${category.id}.artifacts`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Evidence/Artifacts (Optional)</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Link to examples, documents, or evidence..."
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </CardContent>
                          </Card>
                        ))}
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? "Submitting..." : "Submit Assessment"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  <TabsContent value="history">
                    <div className="space-y-4">
                      {assessmentHistory.length > 0 ? (
                        assessmentHistory.map((entry) => (
                          <Card key={entry.id}>
                            <CardHeader>
                              <CardTitle className="text-base">
                                {entry.skill_category?.name} - Score: {entry.score}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {new Date(entry.assessment_date).toLocaleDateString()}
                              </p>
                            </CardHeader>
                            {entry.notes && (
                              <CardContent>
                                <p className="text-sm">{entry.notes}</p>
                              </CardContent>
                            )}
                          </Card>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No assessment history available yet.
                        </p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Assessment;