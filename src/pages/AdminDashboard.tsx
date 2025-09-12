import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { RoleManager } from '@/components/RoleManager';

const AdminDashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <div className="mb-8">
              <SidebarTrigger />
              <h1 className="text-4xl font-bold text-foreground mt-4">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage users, roles, and system configuration
              </p>
            </div>
            
            <RoleManager />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;