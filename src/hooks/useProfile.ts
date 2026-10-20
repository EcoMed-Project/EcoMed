import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  cep: string | null;
  cadunico_declared: boolean;
  cadunico_verified: boolean;
  points: number;
};

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });
}

export function useProfile() {
  const { data: session, isLoading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const query = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ data: profile, error }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, phone, cep, cadunico_declared, cadunico_verified, points")
          .eq("id", userId!)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId!),
      ]);
      if (error) throw error;
      const roleList = (roles ?? []).map((r) => r.role);
      return {
        profile: profile as Profile | null,
        roles: roleList,
        isProfessional: roleList.includes("professional") || roleList.includes("admin"),
      };
    },
  });

  return {
    session,
    userId,
    isLoading: sessionLoading || query.isLoading,
    profile: query.data?.profile ?? null,
    isProfessional: query.data?.isProfessional ?? false,
  };
}
