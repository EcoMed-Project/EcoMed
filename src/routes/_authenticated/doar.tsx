import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, PackagePlus } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/AppHeader";
import { PostPicker } from "@/components/PostPicker";
import { DonationPhotos, type DonationPhoto } from "@/components/DonationPhotos";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/_authenticated/doar")({
  head: () => ({
    meta: [
      { title: "Doar medicamento — EcoMed Brasil" },
      {
        name: "description",
        content: "Cadastre um medicamento para doação e escolha o posto de saúde para entrega.",
      },
      { property: "og:title", content: "Doar medicamento — EcoMed Brasil" },
      {
        property: "og:description",
        content: "Cadastre sua doação e escolha o posto de saúde mais próximo.",
      },
    ],
  }),
  component: DonatePage,
});

const units = ["comprimidos", "cápsulas", "frascos", "ampolas", "caixas", "mL"];

function DonatePage() {
  const { userId, profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState(units[0]!);
  const [expiry, setExpiry] = useState("");
  const [notes, setNotes] = useState("");
  const [postId, setPostId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<DonationPhoto[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const submit = useMutation({
    mutationFn: async () => {
      if (!postId) throw new Error("Escolha um posto de saúde para entregar a doação.");
      const qty = Number(quantity);
      if (!Number.isFinite(qty) || qty < 1) throw new Error("Informe uma quantidade válida.");
      if (new Date(expiry) <= new Date())
        throw new Error("A validade precisa ser futura. Medicamentos vencidos não são aceitos.");
      if (photos.length === 0) throw new Error("Envie pelo menos uma foto do medicamento.");
      if (!confirmed) throw new Error("Confirme as regras de doação para continuar.");

      const paths: string[] = [];
      for (const photo of photos) {
        const ext = photo.file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("donation-photos")
          .upload(path, photo.file, { contentType: photo.file.type, upsert: false });
        if (uploadError)
          throw new Error("Não foi possível enviar as fotos. Tente novamente com fotos menores.");
        paths.push(path);
      }

      const { error } = await supabase.from("donations").insert({
        user_id: userId!,
        health_post_id: postId,
        medicine_name: medicineName.trim(),
        dosage: dosage.trim() || null,
        quantity: qty,
        unit,
        expiry_date: expiry,
        notes: notes.trim() || null,
        photo_urls: paths,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success(
        "Sua doação foi enviada e está aguardando análise. As fotos e informações serão verificadas antes que o medicamento fique disponível para outras pessoas.",
      );
      await queryClient.invalidateQueries();
      navigate({ to: "/historico" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canSubmit =
    !!postId &&
    medicineName.trim().length > 1 &&
    !!expiry &&
    Number(quantity) >= 1 &&
    photos.length > 0 &&
    confirmed &&
    !submit.isPending;

  return (
    <div className="min-h-screen bg-soft-gradient">
      <AppHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-bold">Doar medicamento</h1>
        <p className="mt-2 text-muted-foreground">
          Cadastre o medicamento, escolha o posto e leve até lá. Após a triagem aprovada você
          recebe pontos automaticamente.
        </p>

        <form
          className="mt-8 space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
          <section className="rounded-2xl bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold">📋 Regras para doação</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Leia com atenção antes de cadastrar o medicamento.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { ok: true, text: "O medicamento deve estar bem embalado e armazenado adequadamente." },
                { ok: false, text: "Não pode ter sido usado, aberto ou violado (risco de contaminação)." },
                { ok: false, text: "A caixa não pode estar rasgada, danificada ou amassada." },
                { ok: true, text: "A embalagem deve estar lacrada e sem sinais de que foi mexida." },
                { ok: false, text: "Sinais de violação, alteração ou contaminação não serão aceitos." },
                { ok: true, text: "O medicamento deve estar em condições de ser usado por outra pessoa." },
              ].map((rule) => (
                <li
                  key={rule.text}
                  className="flex gap-3 rounded-xl border border-border p-3 text-sm"
                >
                  {rule.ok ? (
                    <CheckCircle2 className="size-5 shrink-0 text-primary" />
                  ) : (
                    <AlertTriangle className="size-5 shrink-0 text-destructive" />
                  )}
                  <span>{rule.text}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold">2. Dados do medicamento</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="medicine">Nome do medicamento</Label>
                <Input
                  id="medicine"
                  required
                  maxLength={120}
                  placeholder="Ex.: Dipirona sódica"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosagem</Label>
                <Input
                  id="dosage"
                  maxLength={60}
                  placeholder="Ex.: 500 mg"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Validade</Label>
                <Input
                  id="expiry"
                  type="date"
                  required
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={1000}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  maxLength={500}
                  placeholder="Ex.: caixa lacrada, armazenada em local seco"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <p className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              Não são aceitos medicamentos vencidos, controlados, sem embalagem original ou com
              sinais de violação.
            </p>
          </section>

          <section className="rounded-2xl bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold">3. Posto de entrega</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Busque pelo seu CEP e selecione o posto mais conveniente.
            </p>
            <div className="mt-5">
              <PostPicker
                donationsOnly
                selectedId={postId}
                onSelect={setPostId}
                initialCep={profile?.cep ?? null}
                emptyMessage="Busque pelo seu CEP para ver os postos habilitados para doação perto de você."
              />

            </div>
          </section>

          <section className="rounded-2xl bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold">📸 4. Fotos do medicamento</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pelo menos uma foto é obrigatória para enviar a doação.
            </p>
            <div className="mt-5">
              <DonationPhotos photos={photos} onChange={setPhotos} />
            </div>
            <p className="mt-4 flex gap-2 rounded-lg bg-warning/10 p-3 text-xs text-muted-foreground">
              <AlertTriangle className="size-4 shrink-0 text-warning" />
              <span>
                Atenção: a foto será analisada para verificar as condições do medicamento. Fotos
                que mostrarem embalagem rasgada, aberta, violada, danificada ou com sinais de
                uso/mexido poderão ser recusadas. Se a foto estiver escura ou ilegível, tire uma
                nova.
              </span>
            </p>
          </section>

          <section className="rounded-2xl bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold">✅ 5. Confirmação</h2>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 text-sm">
              <Checkbox
                checked={confirmed}
                onCheckedChange={(value) => setConfirmed(value === true)}
                className="mt-0.5"
              />
              <span>
                Confirmo que o medicamento está lacrado, sem sinais de uso ou violação e que as
                informações e fotos enviadas são verdadeiras.
              </span>
            </label>
          </section>

          <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
            {submit.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PackagePlus className="size-4" />
            )}
            Enviar medicamento para doação
          </Button>
          {!canSubmit && !submit.isPending && (
            <p className="text-center text-xs text-muted-foreground">
              Preencha os dados, escolha o posto, envie pelo menos uma foto e marque a confirmação
              para liberar o envio.
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
