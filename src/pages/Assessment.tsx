import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COMPETENCIES } from "@/types/competency";

const Assessment = () => {
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
                    <div className="space-y-6">
                      {COMPETENCIES.map((competency) => (
                        <Card key={competency.name}>
                          <CardHeader>
                            <CardTitle className="text-lg">{competency.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground mb-4">{competency.description}</p>
                            {/* Score selector will be implemented in future iterations */}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
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