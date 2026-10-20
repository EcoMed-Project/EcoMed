import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Award, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { formatCep } from "@/lib/geo";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — EcoMed Brasil" },
      {
        name: "description",
        content: "Atualize seus dados, CEP e a declaração do CadÚnico no EcoMed Brasil.",
      },
      { property: "og:title", content: "Meu perfil — EcoMed Brasil" },
      { property: "og:description", content: "Dados pessoais, pontos e situação do CadÚnico." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, userId } = useProfile();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [cadunico, setCadunico] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setCep(formatCep(profile.cep ?? ""));
    setCadunico(profile.cadunico_declared);
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          cep: cep || null,
          cadunico_declared: cadunico,
        })
        .eq("id", userId!);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Perfil atualizado.");
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="min-h-screen bg-soft-gradient">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-bold">Meu perfil</h1>

        <div className="mt-6 rounded-2xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <Award className="size-7 text-primary" />
            <div>
              <p className="text-2xl font-bold leading-none">{profile?.points ?? 0}</p>
              <p className="text-xs text-muted-foreground">pontos acumulados</p>
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-primary-soft p-3 text-xs">
            🎁 Você ganhou <strong>30 pontos de boas-vindas</strong> ao criar sua conta. O presente
            é concedido uma única vez por conta.
          </p>
        </div>


        <div
          className={`mt-4 flex items-start gap-3 rounded-2xl p-5 text-sm ${
            profile?.cadunico_verified
              ? "bg-primary-soft text-foreground"
              : "bg-warning-soft text-foreground"
          }`}
        >
          {profile?.cadunico_verified ? (
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          ) : (
            <ShieldAlert className="mt-0.5 size-5 shrink-0" />
          )}
          <span>
            {profile?.cadunico_verified
              ? "CadÚnico validado por um profissional de saúde. Suas solicitações são gratuitas."
              : profile?.cadunico_declared
                ? "CadÚnico declarado. A validação será feita por um profissional no posto de saúde."
                : "Se você é inscrito no CadÚnico, marque a declaração abaixo para solicitar medicamentos sem gastar pontos."}
          </span>
        </div>

        <form
          className="mt-8 space-y-5 rounded-2xl bg-card p-6 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input
              id="fullName"
              value={fullName}
              maxLength={120}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={phone}
              maxLength={20}
              placeholder="(00) 00000-0000"
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              inputMode="numeric"
              value={cep}
              maxLength={9}
              onChange={(e) => setCep(formatCep(e.target.value))}
            />
          </div>
          <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
            <Checkbox
              checked={cadunico}
              onCheckedChange={(v) => setCadunico(v === true)}
              className="mt-0.5"
              disabled={profile?.cadunico_verified}
            />
            <span>Declaro que sou inscrito(a) no CadÚnico.</span>
          </label>

          <Button type="submit" className="w-full" disabled={save.isPending}>
            {save.isPending && <Loader2 className="size-4 animate-spin" />}
            Salvar alterações
          </Button>
        </form>
      </main>
    </div>
  );
}
