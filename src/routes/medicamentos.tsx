import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pill, Search, Sparkles, ShieldCheck } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { MedicineAlerts } from "@/components/MedicineAlerts";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { formatDate } from "@/lib/geo";
import { getMedicineInfo } from "@/lib/medicine-info";

export const Route = createFileRoute("/medicamentos")({
  head: () => ({
    meta: [
      { title: "Medicamentos disponíveis — EcoMed Brasil" },
      {
        name: "description",
        content:
          "Consulte medicamentos aprovados na triagem e disponíveis para retirada nos postos de saúde parceiros.",
      },
      { property: "og:title", content: "Medicamentos disponíveis — EcoMed Brasil" },
      {
        property: "og:description",
        content: "Veja o estoque solidário de medicamentos triados por profissionais de saúde.",
      },
    ],
  }),
  component: MedicinesPage,
});

type InventoryRow = {
  id: string;
  medicine_name: string;
  dosage: string | null;
  quantity: number;
  unit: string;
  expiry_date: string;
  points_cost: number;
  health_posts: { name: string; city: string; state: string } | null;
};

function MedicinesPage() {
  const [term, setTerm] = useState("");
  const { profile } = useProfile();
  const isFree = profile?.cadunico_verified ?? false;


  const { data, isLoading } = useQuery({
    queryKey: ["inventory-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select(
          "id, medicine_name, dosage, quantity, unit, expiry_date, points_cost, health_posts(name, city, state)",
        )
        .gt("quantity", 0)
        .order("medicine_name");
      if (error) throw error;
      return data as unknown as InventoryRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter((item) => item.medicine_name.toLowerCase().includes(q));
  }, [data, term]);

  return (
    <div className="min-h-screen bg-soft-gradient">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold">Medicamentos disponíveis</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Todos os itens passaram pela triagem de profissionais de saúde. Escolha um medicamento
          para ver os postos com estoque e solicitar a retirada.
        </p>

        <div className="mt-6 flex max-w-md items-center gap-2">
          <Input
            placeholder="Buscar por nome do medicamento"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <Search className="size-5 shrink-0 text-muted-foreground" />
        </div>

        <div
          className={`mt-6 flex items-start gap-3 rounded-2xl p-4 text-sm ${
            isFree ? "bg-primary-soft" : "bg-card shadow-card"
          }`}
        >
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <span>
            {isFree ? (
              <>
                Seu CadÚnico está validado: <strong>todos os medicamentos abaixo são gratuitos</strong>{" "}
                para você, sem gastar pontos.
              </>
            ) : (
              <>
                Inscrito no CadÚnico? Declare no seu perfil e retire os medicamentos{" "}
                <strong>de graça</strong>, sem usar pontos, após a validação no posto de saúde.
              </>
            )}
          </span>
        </div>

        <MedicineAlerts suggestion={term.trim()} />




        {isLoading ? (
          <p className="mt-10 text-muted-foreground">Carregando estoque...</p>
        ) : filtered.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Nenhum medicamento disponível no momento. Volte em breve — o estoque é atualizado a
            cada doação aprovada.
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => {
              const info = getMedicineInfo(item.medicine_name);
              return (
              <li key={item.id} className="flex flex-col rounded-2xl bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Pill className="size-5" />
                  </span>
                  <Badge variant="secondary" className="gap-1">
                    {isFree ? (
                      <>
                        <ShieldCheck className="size-3" /> Grátis (CadÚnico)
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3" /> {item.points_cost} pts
                      </>
                    )}
                  </Badge>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary">
                  {info.category}
                </p>
                <h2 className="text-lg font-semibold">{item.medicine_name}</h2>
                <p className="text-sm text-muted-foreground">{item.dosage ?? "Dosagem não informada"}</p>
                <dl className="mt-4 space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between gap-2">
                    <dt>Disponível</dt>
                    <dd className="font-medium text-foreground">
                      {item.quantity} {item.unit}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Validade</dt>
                    <dd className="font-medium text-foreground">{formatDate(item.expiry_date)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Posto</dt>
                    <dd className="text-right font-medium text-foreground">
                      {item.health_posts?.name} — {item.health_posts?.city}/
                      {item.health_posts?.state}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5 flex flex-col gap-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/medicamento/$id" params={{ id: item.id }}>
                      Ver detalhes
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link to="/solicitar/$medicamento" params={{ medicamento: item.medicine_name }}>
                      Solicitar
                    </Link>
                  </Button>
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
