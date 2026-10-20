import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, Pill, Sparkles, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/AppHeader";
import { PostPicker } from "@/components/PostPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { formatDate, type HealthPost } from "@/lib/geo";

export const Route = createFileRoute("/_authenticated/solicitar/$medicamento")({
  head: ({ params }) => ({
    meta: [
      { title: `Solicitar ${params.medicamento} — EcoMed Brasil` },
      {
        name: "description",
        content: `Escolha o posto de saúde e solicite ${params.medicamento} disponível no estoque solidário.`,
      },
      { property: "og:title", content: `Solicitar ${params.medicamento} — EcoMed Brasil` },
      {
        property: "og:description",
        content: "Solicite medicamentos triados por profissionais de saúde.",
      },
    ],
  }),
  component: RequestPage,
});

type InventoryRow = {
  id: string;
  health_post_id: string;
  medicine_name: string;
  dosage: string | null;
  quantity: number;
  unit: string;
  expiry_date: string;
  points_cost: number;
  health_posts: HealthPost | null;
};

function RequestPage() {
  const { medicamento } = Route.useParams();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [postId, setPostId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("1");

  const { data: items, isLoading } = useQuery({
    queryKey: ["inventory-by-medicine", medicamento],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select(
          "id, health_post_id, medicine_name, dosage, quantity, unit, expiry_date, points_cost, health_posts(id, name, address, city, state, cep, phone, lat, lng, accepts_donations)",
        )
        .eq("medicine_name", medicamento)
        .gt("quantity", 0);
      if (error) throw error;
      return data as unknown as InventoryRow[];
    },
  });

  const posts = useMemo(
    () => (items ?? []).map((i) => i.health_posts).filter((p): p is HealthPost => !!p),
    [items],
  );
  const selected = (items ?? []).find((i) => i.health_post_id === postId) ?? null;
  const qty = Number(quantity) || 1;
  const cost = selected ? selected.points_cost * qty : 0;
  const isFree = profile?.cadunico_verified ?? false;

  const submit = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Escolha um posto de saúde para a retirada.");
      if (qty < 1 || qty > selected.quantity)
        throw new Error(`Quantidade indisponível. Máximo: ${selected.quantity}.`);
      if (!isFree && (profile?.points ?? 0) < cost)
        throw new Error("Pontos insuficientes para esta solicitação.");

      const { error } = await supabase.from("medicine_requests").insert({
        user_id: profile!.id,
        inventory_id: selected.id,
        quantity: qty,
        medicine_name: selected.medicine_name,
        health_post_id: selected.health_post_id,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Solicitação registrada! Acompanhe o status no seu histórico.");
      await queryClient.invalidateQueries();
      navigate({ to: "/historico" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="min-h-screen bg-soft-gradient">
      <AppHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Pill className="size-5" />
        </span>
        <h1 className="mt-4 text-3xl font-bold">Solicitar {medicamento}</h1>
        <p className="mt-2 text-muted-foreground">
          Escolha o posto de saúde onde deseja retirar e confirme a quantidade.
        </p>

        {isFree ? (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary-soft p-4 text-sm">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>
              Seu CadÚnico está validado: esta solicitação é <strong>gratuita</strong>, sem uso de
              pontos.
            </span>
          </div>
        ) : (
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-card p-4 text-sm shadow-card">
            <Sparkles className="size-4 text-primary" />
            Você tem <strong>{profile?.points ?? 0} pontos</strong> disponíveis.
          </div>
        )}

        {isLoading ? (
          <p className="mt-8 text-muted-foreground">Carregando postos com estoque...</p>
        ) : (
          <form
            className="mt-8 space-y-8"
            onSubmit={(e) => {
              e.preventDefault();
              submit.mutate();
            }}
          >
            <section className="rounded-2xl bg-card p-6 shadow-card">
              <h2 className="text-lg font-semibold">Postos com este medicamento</h2>
              <div className="mt-5">
                <PostPicker
                  posts={posts}
                  selectedId={postId}
                  onSelect={setPostId}
                  initialCep={profile?.cep ?? null}
                  emptyMessage="Nenhum posto com estoque deste medicamento no momento."
                />
              </div>
            </section>

            {selected && (
              <section className="rounded-2xl bg-card p-6 shadow-card">
                <h2 className="text-lg font-semibold">Confirmação</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Dosagem</dt>
                    <dd>{selected.dosage ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Validade</dt>
                    <dd>{formatDate(selected.expiry_date)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Disponível</dt>
                    <dd>
                      {selected.quantity} {selected.unit}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5 max-w-40 space-y-2">
                  <Label htmlFor="qty">Quantidade desejada</Label>
                  <Input
                    id="qty"
                    type="number"
                    min={1}
                    max={selected.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <p className="mt-5 text-sm">
                  Custo:{" "}
                  <strong className="text-primary">
                    {isFree ? "Gratuito (CadÚnico)" : `${cost} pontos`}
                  </strong>
                </p>
              </section>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submit.isPending || !selected}
            >
              {submit.isPending && <Loader2 className="size-4 animate-spin" />}
              Confirmar solicitação
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
