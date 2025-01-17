import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CompetencyRadar } from "@/components/CompetencyRadar";
import { COMPETENCIES } from "@/types/competency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const mockData = COMPETENCIES.map((comp) => ({
  ...comp,
  currentScore: 3 as const,
  targetScore: 5 as const,
}));

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <SidebarTrigger />
            <h1 className="text-4xl font-bold mb-8 text-gray-900">PM Growth Dashboard</h1>
            
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Competency Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <CompetencyRadar competencies={mockData} />
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Next Assessment Due</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-primary">May 1, 2024</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Growth Areas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent"></span>
                        Technology & Data
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent"></span>
                        Strategic Thinking
                      </li>
                    </ul>
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

export default Index;