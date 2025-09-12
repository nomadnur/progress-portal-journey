import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { AppRole } from '@/types/campaign';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole('team_member'); // Default role
        } else if (data) {
          setRole(data.role);
        } else {
          // No role assigned yet, set default
          setRole('team_member');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('team_member'); // Default role
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.id]);

  const hasRole = (requiredRole: AppRole): boolean => {
    if (!role) return false;
    
    // Admin has all permissions
    if (role === 'admin') return true;
    
    // Manager has manager and team_member permissions
    if (role === 'manager' && (requiredRole === 'manager' || requiredRole === 'team_member')) {
      return true;
    }
    
    // Exact role match
    return role === requiredRole;
  };

  const isManager = (): boolean => hasRole('manager');
  const isAdmin = (): boolean => hasRole('admin');

  return {
    role,
    loading,
    hasRole,
    isManager,
    isAdmin
  };
};