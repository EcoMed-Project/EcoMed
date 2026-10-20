import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Leaf, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { formatCep } from "@/lib/geo";
import { useSession } from "@/hooks/useProfile";

type Search = { modo?: "entrar" | "cadastro" | undefined; redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    modo: search['modo'] === "cadastro" ? "cadastro" : undefined,
    redirect: typeof search['redirect'] === "string" ? search['redirect'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — EcoMed Brasil" },
      {
        name: "description",
        content: "Acesse sua conta EcoMed Brasil para doar medicamentos, acumular pontos e solicitar tratamentos.",
      },
      { property: "og:title", content: "Entrar ou criar conta — EcoMed Brasil" },
      {
        property: "og:description",
        content: "Acesse sua conta para doar e solicitar medicamentos com segurança.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { modo, redirect } = Route.useSearch();
  const [isSignUp, setIsSignUp] = useState(modo === "cadastro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [cep, setCep] = useState("");
  const [cadunico, setCadunico] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const safeRedirect = redirect && redirect.startsWith("/") ? redirect : "/historico";

  useEffect(() => {
    if (session) navigate({ to: safeRedirect, replace: true });
  }, [session, safeRedirect, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, cep, cadunico_declared: cadunico },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSentEmail(true);
          toast.success("Confira seu e-mail para confirmar o cadastro.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      await queryClient.invalidateQueries();
      navigate({ to: safeRedirect });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Não foi possível entrar com Google. Tente novamente.");
      return;
    }
    if (result.redirected) return;
    await queryClient.invalidateQueries();
    navigate({ to: safeRedirect });
  }

  return (
    <div className="flex min-h-screen flex-col bg-soft-gradient">
      <header className="mx-auto flex w-full max-w-6xl items-center px-4 py-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-hero-gradient text-primary-foreground">
            <Leaf className="size-5" />
          </span>
          <span className="font-display text-lg font-bold">
            EcoMed <span className="text-primary">Brasil</span>
          </span>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
        <div className="rounded-2xl bg-card p-6 shadow-lift sm:p-8">
          <h1 className="text-2xl font-bold">{isSignUp ? "Criar conta" : "Entrar"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignUp
              ? "Cadastre-se para doar medicamentos e acumular pontos."
              : "Acesse para acompanhar doações, pontos e solicitações."}
          </p>
          {isSignUp && (
            <p className="mt-3 rounded-xl bg-primary-soft p-3 text-sm">
              🎁 Ganhe <strong>30 pontos de boas-vindas</strong> ao criar sua conta — presente único
              do EcoMed Brasil.
            </p>
          )}


          {sentEmail ? (
            <div className="mt-6 rounded-xl border border-primary/30 bg-primary-soft p-4 text-sm">
              Enviamos um link de confirmação para <strong>{email}</strong>. Confirme seu e-mail
              para acessar sua conta.
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="mt-6 w-full"
                onClick={handleGoogle}
                disabled={loading}
              >
                Continuar com Google
              </Button>

              <div className="my-5 flex items-center gap-3 text-xs uppercase text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {isSignUp && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nome completo</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        maxLength={120}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cepSignup">CEP</Label>
                      <Input
                        id="cepSignup"
                        inputMode="numeric"
                        placeholder="00000-000"
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
                      />
                      <span>
                        Declaro que sou inscrito(a) no CadÚnico.
                        <span className="mt-1 block text-xs text-muted-foreground">
                          A declaração passa por validação de um profissional de saúde no posto.
                        </span>
                      </span>
                    </label>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  {isSignUp ? "Criar conta" : "Entrar"}
                </Button>
              </form>

              <button
                type="button"
                className="mt-5 w-full text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                onClick={() => setIsSignUp((v) => !v)}
              >
                {isSignUp ? "Já tenho conta. Entrar" : "Não tenho conta. Criar agora"}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
