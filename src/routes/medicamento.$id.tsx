import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, MapPin, Pill, ShieldCheck, Sparkles } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/geo";
import { getMedicineInfo } from "@/lib/medicine-info";

export const Route = createFileRoute("/medicamento/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes do medicamento — EcoMed Brasil" },
      {
        name: "description",
        content:
          "Validade, posto de origem, status da triagem e custo em pontos do medicamento disponível no estoque solidário.",
      },
      { property: "og:title", content: "Detalhes do medicamento — EcoMed Brasil" },
      {
        property: "og:description",
        content: "Veja validade, posto de origem e status da triagem antes de solicitar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MedicineDetailPage,
});

type DetailRow = {
  id: string;
  medicine_name: string;
  dosage: string | null;
  quantity: number;
  unit: string;
  expiry_date: string;
  points_cost: number;
  donation_id: string | null;
  created_at: string;
  health_posts: {
    name: string;
    address: string;
    city: string;
    state: string;
    phone: string | null;
  } | null;
};

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

function MedicineDetailPage() {
  const { id } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["inventory-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select(
          "id, medicine_name, dosage, quantity, unit, expiry_date, points_cost, donation_id, created_at, health_posts(name, address, city, state, phone)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as DetailRow | null;
    },
  });

  return (
    <div className="min-h-screen bg-soft-gradient">
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link to="/medicamentos">
            <ArrowLeft className="size-4" /> Voltar aos medicamentos
          </Link>
        </Button>

        {isLoading ? (
          <p className="text-muted-foreground">Carregando informações...</p>
        ) : !data ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Medicamento não encontrado ou já retirado do estoque.
          </p>
        ) : (
          (() => {
            const info = getMedicineInfo(data.medicine_name);
            const dias = daysUntil(data.expiry_date);
            return (
              <article className="rounded-2xl bg-card p-6 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Pill className="size-6" />
                  </span>
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="size-3" /> {data.points_cost} pts
                  </Badge>
                </div>

                <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-primary">
                  {info.category}
                </p>
                <h1 className="text-3xl font-bold">{data.medicine_name}</h1>
                <p className="mt-1 text-muted-foreground">
                  {data.dosage ?? "Dosagem não informada"}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">{info.description}</p>

                <section className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border p-4">
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                      <CalendarClock className="size-4 text-primary" /> Validade
                    </h2>
                    <p className="mt-1 text-lg font-medium">{formatDate(data.expiry_date)}</p>
                    <p className="text-sm text-muted-foreground">
                      {dias > 0 ? `Vence em ${dias} dia(s)` : "Fora do prazo de validade"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                      <ShieldCheck className="size-4 text-primary" /> Status da triagem
                    </h2>
                    <p className="mt-1 text-lg font-medium">
                      {data.donation_id ? "Aprovado na triagem" : "Cadastrado pelo posto"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {data.donation_id
                        ? "Doação avaliada e aprovada por profissional de saúde antes de entrar no estoque."
                        : "Item incluído diretamente pela equipe de saúde responsável pelo posto."}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border p-4 sm:col-span-2">
                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                      <MapPin className="size-4 text-primary" /> Posto de origem
                    </h2>
                    <p className="mt-1 text-lg font-medium">{data.health_posts?.name ?? "—"}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.health_posts?.address} — {data.health_posts?.city}/
                      {data.health_posts?.state}
                    </p>
                    {data.health_posts?.phone && (
                      <p className="text-sm text-muted-foreground">
                        Telefone: {data.health_posts.phone}
                      </p>
                    )}
                  </div>
                </section>

                <dl className="mt-6 space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between gap-2">
                    <dt>Disponível em estoque</dt>
                    <dd className="font-medium text-foreground">
                      {data.quantity} {data.unit}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Entrada no estoque</dt>
                    <dd className="font-medium text-foreground">{formatDate(data.created_at)}</dd>
                  </div>
                </dl>

                <Button className="mt-6 w-full" asChild>
                  <Link to="/solicitar/$medicamento" params={{ medicamento: data.medicine_name }}>
                    Solicitar este medicamento
                  </Link>
                </Button>
              </article>
            );
          })()
        )}
      </main>
    </div>
  );
}
