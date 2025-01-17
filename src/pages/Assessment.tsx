import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COMPETENCIES } from "@/types/competency";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface AssessmentFormValues {
  competencies: {
    [key: string]: {
      score: string;
      notes: string;
    };
  };
}

const Assessment = () => {
  const { toast } = useToast();
  const form = useForm<AssessmentFormValues>({
    defaultValues: {
      competencies: COMPETENCIES.reduce((acc, competency) => ({
        ...acc,
        [competency.name]: {
          score: "3",
          notes: "",
        },
      }), {}),
    },
  });

  const onSubmit = (data: AssessmentFormValues) => {
    console.log("Assessment submitted:", data);
    toast({
      title: "Assessment Submitted",
      description: "Your self-assessment has been recorded.",
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <SidebarTrigger />
            <h1 className="text-4xl font-bold mb-8 text-gray-900">Assessment</h1>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Self-Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="current">
                  <TabsList>
                    <TabsTrigger value="current">Current Assessment</TabsTrigger>
                    <TabsTrigger value="history">Assessment History</TabsTrigger>
                  </TabsList>
                  <TabsContent value="current">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {COMPETENCIES.map((competency) => (
                          <Card key={competency.name}>
                            <CardHeader>
                              <CardTitle className="text-lg">{competency.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <p className="text-muted-foreground mb-4">{competency.description}</p>
                              
                              <FormField
                                control={form.control}
                                name={`competencies.${competency.name}.score`}
                                render={({ field }) => (
                                  <FormItem className="space-y-3">
                                    <FormLabel>Score</FormLabel>
                                    <FormControl>
                                      <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
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
                                name={`competencies.${competency.name}.notes`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Add your notes here..."
                                        className="resize-none"
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
                        <Button type="submit" className="w-full">Submit Assessment</Button>
                      </form>
                    </Form>
                  </TabsContent>
                  <TabsContent value="history">
                    <p className="text-muted-foreground">Assessment history will be available here.</p>
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