import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserCog, Shield, Users } from 'lucide-react';
import type { Profile } from '@/types/database';
import type { AppRole } from '@/types/campaign';

interface UserWithRole extends Profile {
  role?: AppRole;
}

export const RoleManager = () => {
  const { user } = useAuth();
  const { isAdmin, role: currentUserRole } = useUserRole();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && isAdmin()) {
      fetchUsers();
    }
  }, [user, isAdmin]);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles = profilesData.map(profile => ({
        ...profile,
        role: rolesData.find(r => r.user_id === profile.user_id)?.role || 'team_member' as AppRole
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, newRole: AppRole) => {
    try {
      const { data, error } = await supabase.rpc('assign_user_role', {
        _user_id: userId,
        _role: newRole
      });

      if (error) throw error;

      if (data) {
        toast({
          title: 'Success',
          description: 'Role assigned successfully',
        });
        fetchUsers(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: 'Failed to assign role',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign role',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'manager':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'manager':
        return <UserCog className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  if (!isAdmin()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You need admin permissions to manage user roles.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Your current role: <Badge variant="secondary">{currentUserRole}</Badge>
          </p>
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
          <h2 className="text-2xl font-bold">User Role Management</h2>
          <p className="text-muted-foreground">
            Manage user roles and permissions across the platform
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {users.map((userItem) => (
          <Card key={userItem.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(userItem.role || 'team_member')}
                    <div>
                      <p className="font-medium">
                        {userItem.full_name || userItem.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {userItem.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(userItem.role || 'team_member')}>
                    {userItem.role || 'team_member'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={userItem.role || 'team_member'}
                    onValueChange={(newRole: AppRole) => assignRole(userItem.user_id, newRole)}
                    disabled={userItem.user_id === user?.id} // Can't change own role
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team_member">Team Member</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {users.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No users found in the system.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};