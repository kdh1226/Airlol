import { trpc } from "@/lib/trpc";
import { useCallback, useMemo } from "react";

export function useAdminAuth() {
  const utils = trpc.useUtils();

  const adminCheckQuery = trpc.auth.adminCheck.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const adminLoginMutation = trpc.auth.adminLogin.useMutation({
    onSuccess: () => {
      utils.auth.adminCheck.invalidate();
    },
  });

  const adminLogoutMutation = trpc.auth.adminLogout.useMutation({
    onSuccess: () => {
      utils.auth.adminCheck.invalidate();
    },
  });

  const login = useCallback(async (password: string) => {
    await adminLoginMutation.mutateAsync({ password });
  }, [adminLoginMutation]);

  const logout = useCallback(async () => {
    await adminLogoutMutation.mutateAsync();
  }, [adminLogoutMutation]);

  const state = useMemo(() => ({
    isAdmin: adminCheckQuery.data?.isAdmin ?? false,
    loading: adminCheckQuery.isLoading,
    loginPending: adminLoginMutation.isPending,
    logoutPending: adminLogoutMutation.isPending,
  }), [
    adminCheckQuery.data?.isAdmin,
    adminCheckQuery.isLoading,
    adminLoginMutation.isPending,
    adminLogoutMutation.isPending,
  ]);

  return {
    ...state,
    login,
    logout,
  };
}
