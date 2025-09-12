import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { CampaignManager } from '@/components/CampaignManager';

const CampaignDashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="mb-8">
              <SidebarTrigger />
              <h1 className="text-4xl font-bold text-foreground mt-4">
                Campaign Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage multi-user assessment campaigns and track team progress
              </p>
            </div>
            
            <CampaignManager />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CampaignDashboard;