import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Leaf,
  HeartHandshake,
  ShieldCheck,
  Recycle,
  MapPin,
  Award,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { ShareProject } from "@/components/ShareProject";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-ecomed.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EcoMed Brasil — Doação e reaproveitamento seguro de medicamentos" },
      {
        name: "description",
        content:
          "Doe medicamentos que você não usa mais, acumule pontos e ajude quem precisa. Triagem feita por profissionais de saúde do SUS.",
      },
      { property: "og:title", content: "EcoMed Brasil — cada doação é um tratamento possível" },
      {
        property: "og:description",
        content:
          "Plataforma integrada ao SUS para descarte correto, triagem e reaproveitamento seguro de medicamentos.",
      },
    ],
  }),
  component: Home,
});

const steps = [
  {
    icon: ClipboardCheck,
    title: "1. Cadastre o medicamento",
    text: "Informe nome, quantidade e validade do medicamento que você não usa mais.",
  },
  {
    icon: MapPin,
    title: "2. Escolha o posto",
    text: "Digite seu CEP e veja no mapa os postos de saúde habilitados mais próximos.",
  },
  {
    icon: ShieldCheck,
    title: "3. Triagem profissional",
    text: "Profissionais de saúde avaliam validade e condições conforme as normas sanitárias.",
  },
  {
    icon: Award,
    title: "4. Receba seus pontos",
    text: "Doação aprovada vira estoque disponível e pontos na sua conta, automaticamente.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-soft-gradient">
      <AppHeader />

      <main>
        <section className="relative overflow-hidden bg-hero-gradient text-primary-foreground">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
                <Leaf className="size-4" /> Integrado ao SUS
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl">
                Cada medicamento doado pode ser o tratamento de alguém.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-primary-foreground/90">
                O EcoMed Brasil conecta quem tem medicamentos sem uso a quem precisa deles, com
                triagem de profissionais de saúde, logística reversa e menos desperdício.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/doar">
                    Doar medicamento <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-white/10 text-primary-foreground hover:bg-white/20"
                  asChild
                >
                  <Link to="/medicamentos">Ver medicamentos disponíveis</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <img
                src={heroImage}
                alt="Profissionais de saúde organizando medicamentos doados em um posto do SUS"
                className="w-full rounded-2xl shadow-lift"
                loading="eager"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold">Como funciona a doação</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            Um caminho simples, seguro e transparente — do seu armário até quem precisa.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <article key={step.title} className="rounded-2xl bg-card p-6 shadow-card">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <step.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card/60">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-14 md:grid-cols-3">
            {[
              {
                icon: Recycle,
                title: "Menos desperdício",
                text: "Medicamentos válidos deixam de virar lixo e voltam para o cuidado das pessoas.",
              },
              {
                icon: HeartHandshake,
                title: "Acesso ampliado",
                text: "Beneficiários do CadÚnico solicitam medicamentos mesmo sem pontos acumulados.",
              },
              {
                icon: ShieldCheck,
                title: "Segurança sanitária",
                text: "Só medicamentos aprovados na triagem profissional voltam para a plataforma.",
              },
            ].map((item) => (
              <article key={item.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <item.icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold">Faça parte dessa rede de cuidado</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Crie sua conta gratuitamente, doe o que não usa mais e acompanhe todo o impacto das
            suas ações no histórico.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/auth" search={{ modo: "cadastro" }}>
                Criar minha conta
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">Já tenho conta</Link>
            </Button>
          </div>
        </section>
        <ShareProject />
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">EcoMed Brasil</p>
          <p className="mt-1">
            Descarte correto, triagem segura e reaproveitamento de medicamentos em parceria com a
            rede pública de saúde.
          </p>
        </div>
      </footer>
    </div>
  );
}
