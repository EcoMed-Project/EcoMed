import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellPlus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

export function MedicineAlerts({ suggestion }: { suggestion?: string }) {
  const { userId } = useProfile();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const { data: alerts = [] } = useQuery({
    queryKey: ["medicine-alerts", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicine_alerts")
        .select("id, medicine_name")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addAlert = useMutation({
    mutationFn: async (medicine: string) => {
      const { error } = await supabase
        .from("medicine_alerts")
        .insert({ user_id: userId!, medicine_name: medicine });
      if (error) throw error;
    },
    onSuccess: async () => {
      setName("");
      toast.success("Você será avisado quando o medicamento entrar no estoque.");
      await queryClient.invalidateQueries({ queryKey: ["medicine-alerts", userId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("medicine_alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["medicine-alerts", userId] }),
  });

  if (!userId) return null;

  const value = name || suggestion || "";

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <BellPlus className="size-4 text-primary" /> Avise-me quando chegar
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Cadastre um medicamento e receba um aviso assim que ele for aprovado na triagem e entrar no
        estoque.
      </p>
      <form
        className="mt-4 flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const medicine = value.trim();
          if (medicine.length < 2) return;
          addAlert.mutate(medicine);
        }}
      >
        <Input
          placeholder="Ex.: Dipirona"
          value={value}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" disabled={addAlert.isPending || value.trim().length < 2}>
          Avisar-me
        </Button>
      </form>

      {alerts.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <Badge variant="secondary" className="gap-1 py-1">
                {alert.medicine_name}
                <button
                  type="button"
                  aria-label={`Remover aviso de ${alert.medicine_name}`}
                  onClick={() => removeAlert.mutate(alert.id)}
                  className="ml-1 rounded-full hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
