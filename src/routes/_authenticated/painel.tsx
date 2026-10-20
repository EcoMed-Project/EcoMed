import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, XCircle, ShieldCheck, PackageCheck, Boxes } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { formatDate, formatDateTime } from "@/lib/geo";
import { dispatchNotificationEmails } from "@/lib/notifications.functions";

async function sendPendingEmails() {
  try {
    await dispatchNotificationEmails();
  } catch (error) {
    console.error("Falha ao disparar e-mails de notificação", error);
  }
}

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel do profissional — EcoMed Brasil" },
      {
        name: "description",
        content:
          "Triagem de doações, liberação de solicitações e validação do CadÚnico para profissionais de saúde.",
      },
      { property: "og:title", content: "Painel do profissional — EcoMed Brasil" },
      { property: "og:description", content: "Gestão de triagem, estoque e retiradas." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { isProfessional, isLoading } = useProfile();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ["professional-dashboard"],
    enabled: isProfessional,
    queryFn: async () => {
      const [donations, requests, inventory] = await Promise.all([
        supabase
          .from("donations")
          .select(
            "id, medicine_name, dosage, quantity, unit, expiry_date, status, notes, created_at, user_id, profiles(full_name, cadunico_declared, cadunico_verified), health_posts(name, city, state)",
          )
          .eq("status", "pending")
          .order("created_at"),
        supabase
          .from("medicine_requests")
          .select(
            "id, medicine_name, quantity, status, used_cadunico, created_at, profiles(full_name), health_posts(name, city, state)",
          )
          .in("status", ["pending", "ready"])
          .order("created_at"),
        supabase
          .from("inventory")
          .select("id, medicine_name, dosage, quantity, unit, expiry_date, health_posts(name, city)")
          .gt("quantity", 0)
          .order("medicine_name"),
      ]);
      return {
        donations: (donations.data ?? []) as any[],
        requests: (requests.data ?? []) as any[],
        inventory: (inventory.data ?? []) as any[],
      };
    },
  });

  const reviewDonation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("donations")
        .update({ status, review_notes: notes[id]?.trim() || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Triagem registrada.");
      await sendPendingEmails();
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateRequest = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "ready" | "completed" | "cancelled" }) => {
      const { error } = await supabase.from("medicine_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Solicitação atualizada.");
      await sendPendingEmails();
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const verifyCadunico = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ cadunico_verified: true })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("CadÚnico validado.");
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!isLoading && !isProfessional) {
    return (
      <div className="min-h-screen bg-soft-gradient">
        <AppHeader />
        <main className="mx-auto w-full max-w-2xl px-4 py-20 text-center">
          <ShieldCheck className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Área restrita</h1>
          <p className="mt-2 text-muted-foreground">
            Este painel é exclusivo para profissionais de saúde autorizados pelo posto.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gradient">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold">Painel do profissional</h1>
        <p className="mt-2 text-muted-foreground">
          Faça a triagem das doações, valide o CadÚnico e controle as retiradas.
        </p>

        <Tabs defaultValue="triagem" className="mt-8">
          <TabsList>
            <TabsTrigger value="triagem">Triagem</TabsTrigger>
            <TabsTrigger value="retiradas">Retiradas</TabsTrigger>
            <TabsTrigger value="estoque">Estoque</TabsTrigger>
          </TabsList>

          <TabsContent value="triagem" className="mt-6 space-y-3">
            {(data?.donations ?? []).length === 0 ? (
              <Empty icon={PackageCheck} text="Nenhuma doação aguardando triagem." />
            ) : (
              data!.donations.map((item) => (
                <article key={item.id} className="rounded-2xl bg-card p-5 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">
                        {item.medicine_name} {item.dosage ? `· ${item.dosage}` : ""}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit} · validade {formatDate(item.expiry_date)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Doador: {item.profiles?.full_name || "—"} · {item.health_posts?.name}
                      </p>
                      {item.notes && (
                        <p className="mt-1 text-sm text-muted-foreground">Obs.: {item.notes}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(item.created_at)}
                    </span>
                  </div>

                  {item.profiles?.cadunico_declared && !item.profiles?.cadunico_verified && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-warning-soft p-3 text-sm">
                      <span>Doador declarou inscrição no CadÚnico e aguarda validação.</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => verifyCadunico.mutate(item.user_id)}
                      >
                        <ShieldCheck className="size-4" /> Validar CadÚnico
                      </Button>
                    </div>
                  )}

                  <Input
                    className="mt-4"
                    placeholder="Parecer da triagem (opcional)"
                    value={notes[item.id] ?? ""}
                    onChange={(e) => setNotes((p) => ({ ...p, [item.id]: e.target.value }))}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => reviewDonation.mutate({ id: item.id, status: "approved" })}
                      disabled={reviewDonation.isPending}
                    >
                      <CheckCircle2 className="size-4" /> Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => reviewDonation.mutate({ id: item.id, status: "rejected" })}
                      disabled={reviewDonation.isPending}
                    >
                      <XCircle className="size-4" /> Recusar
                    </Button>
                  </div>
                </article>
              ))
            )}
          </TabsContent>

          <TabsContent value="retiradas" className="mt-6 space-y-3">
            {(data?.requests ?? []).length === 0 ? (
              <Empty icon={Boxes} text="Nenhuma solicitação em aberto." />
            ) : (
              data!.requests.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-5 shadow-card"
                >
                  <div>
                    <h2 className="font-semibold">{item.medicine_name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} unidade(s) · {item.profiles?.full_name || "—"}
                      {item.used_cadunico ? " · CadÚnico" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.health_posts?.name}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {item.status === "ready" ? "Pronta" : "Em análise"}
                    </Badge>
                    {item.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => updateRequest.mutate({ id: item.id, status: "ready" })}
                      >
                        Liberar retirada
                      </Button>
                    )}
                    {item.status === "ready" && (
                      <Button
                        size="sm"
                        onClick={() => updateRequest.mutate({ id: item.id, status: "completed" })}
                      >
                        Confirmar retirada
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateRequest.mutate({ id: item.id, status: "cancelled" })}
                    >
                      Cancelar
                    </Button>
                  </div>
                </article>
              ))
            )}
          </TabsContent>

          <TabsContent value="estoque" className="mt-6 space-y-3">
            {(data?.inventory ?? []).length === 0 ? (
              <Empty icon={Boxes} text="Estoque vazio." />
            ) : (
              data!.inventory.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card px-5 py-4 shadow-card"
                >
                  <div>
                    <p className="font-medium">
                      {item.medicine_name} {item.dosage ? `· ${item.dosage}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.health_posts?.name} — {item.health_posts?.city}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">
                      {item.quantity} {item.unit}
                    </p>
                    <p className="text-muted-foreground">
                      validade {formatDate(item.expiry_date)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof Boxes; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <Icon className="mx-auto size-8 text-muted-foreground" />
      <p className="mt-3 text-muted-foreground">{text}</p>
    </div>
  );
}
