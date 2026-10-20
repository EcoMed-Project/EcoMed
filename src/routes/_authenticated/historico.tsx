import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, PackageCheck, Pill, Clock } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { formatDate, formatDateTime } from "@/lib/geo";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({
    meta: [
      { title: "Meu histórico — EcoMed Brasil" },
      {
        name: "description",
        content: "Acompanhe suas doações, solicitações e o extrato de pontos no EcoMed Brasil.",
      },
      { property: "og:title", content: "Meu histórico — EcoMed Brasil" },
      { property: "og:description", content: "Doações, solicitações e extrato de pontos." },
    ],
  }),
  component: HistoryPage,
});

const donationStatus: Record<string, { label: string; className: string }> = {
  pending: { label: "Em triagem", className: "bg-warning-soft text-warning-foreground" },
  approved: { label: "Aprovada", className: "bg-primary-soft text-primary" },
  rejected: { label: "Não aprovada", className: "bg-destructive/10 text-destructive" },
};

const requestStatus: Record<string, { label: string; className: string }> = {
  pending: { label: "Em análise", className: "bg-warning-soft text-warning-foreground" },
  ready: { label: "Pronta para retirada", className: "bg-primary-soft text-primary" },
  completed: { label: "Retirada concluída", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelada", className: "bg-destructive/10 text-destructive" },
};

function HistoryPage() {
  const { userId, profile } = useProfile();

  const { data } = useQuery({
    queryKey: ["history", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [donations, requests, ledger] = await Promise.all([
        supabase
          .from("donations")
          .select(
            "id, medicine_name, dosage, quantity, unit, expiry_date, status, points_awarded, created_at, review_notes, health_posts(name, city, state)",
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("medicine_requests")
          .select(
            "id, medicine_name, quantity, status, points_spent, used_cadunico, created_at, health_posts(name, city, state)",
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("points_ledger")
          .select("id, delta, reason, created_at")
          .order("created_at", { ascending: false }),
      ]);
      return {
        donations: (donations.data ?? []) as any[],
        requests: (requests.data ?? []) as any[],
        ledger: (ledger.data ?? []) as any[],
      };
    },
  });

  return (
    <div className="min-h-screen bg-soft-gradient">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Meu histórico</h1>
            <p className="mt-2 text-muted-foreground">
              Acompanhe doações, solicitações e seus pontos acumulados.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-card px-5 py-4 shadow-card">
            <Award className="size-6 text-primary" />
            <div>
              <p className="text-2xl font-bold leading-none">{profile?.points ?? 0}</p>
              <p className="text-xs text-muted-foreground">pontos disponíveis</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="donations" className="mt-8">
          <TabsList>
            <TabsTrigger value="donations">Doações</TabsTrigger>
            <TabsTrigger value="requests">Solicitações</TabsTrigger>
            <TabsTrigger value="points">Extrato de pontos</TabsTrigger>
          </TabsList>

          <TabsContent value="donations" className="mt-6 space-y-3">
            {(data?.donations ?? []).length === 0 ? (
              <EmptyState
                icon={PackageCheck}
                text="Você ainda não registrou doações."
                actionLabel="Doar agora"
                to="/doar"
              />
            ) : (
              data!.donations.map((item) => {
                const status = donationStatus[item.status] ?? donationStatus['pending']!;
                return (
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
                          {item.health_posts?.name} — {item.health_posts?.city}/
                          {item.health_posts?.state}
                        </p>
                        {item.review_notes && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Parecer: {item.review_notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge className={status.className}>{status.label}</Badge>
                        {item.points_awarded > 0 && (
                          <p className="mt-2 text-sm font-semibold text-primary">
                            +{item.points_awarded} pts
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(item.created_at)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-6 space-y-3">
            {(data?.requests ?? []).length === 0 ? (
              <EmptyState
                icon={Pill}
                text="Você ainda não solicitou medicamentos."
                actionLabel="Ver disponíveis"
                to="/medicamentos"
              />
            ) : (
              data!.requests.map((item) => {
                const status = requestStatus[item.status] ?? requestStatus['pending']!;
                return (
                  <article key={item.id} className="rounded-2xl bg-card p-5 shadow-card">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">{item.medicine_name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} unidade(s) ·{" "}
                          {item.used_cadunico
                            ? "gratuito via CadÚnico"
                            : `${item.points_spent} pts utilizados`}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Retirada: {item.health_posts?.name} — {item.health_posts?.city}/
                          {item.health_posts?.state}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={status.className}>{status.label}</Badge>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(item.created_at)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="points" className="mt-6 space-y-3">
            {(data?.ledger ?? []).length === 0 ? (
              <EmptyState icon={Clock} text="Nenhuma movimentação de pontos ainda." />
            ) : (
              data!.ledger.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-xl bg-card px-5 py-4 shadow-card"
                >
                  <div>
                    <p className="font-medium">{item.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(item.created_at)}
                    </p>
                  </div>
                  <span
                    className={`text-lg font-bold ${item.delta >= 0 ? "text-primary" : "text-destructive"}`}
                  >
                    {item.delta >= 0 ? "+" : ""}
                    {item.delta}
                  </span>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  text,
  actionLabel,
  to,
}: {
  icon: typeof Award;
  text: string;
  actionLabel?: string;
  to?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <Icon className="mx-auto size-8 text-muted-foreground" />
      <p className="mt-3 text-muted-foreground">{text}</p>
      {actionLabel && to && (
        <Button className="mt-5" asChild>
          <Link to={to}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
