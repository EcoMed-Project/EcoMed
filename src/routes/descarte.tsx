import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, LoaderCircle, MapPin, PackageOpen, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCep } from "@/lib/geo";
import { geocodeCep } from "@/lib/geo.functions";

export const Route = createFileRoute("/descarte")({
  head: () => ({
    meta: [
      { title: "Descarte de medicamentos — EcoMed Brasil" },
      {
        name: "description",
        content:
          "Entenda como descartar medicamentos com segurança e encontre uma farmácia parceira próxima pelo CEP.",
      },
      { property: "og:title", content: "Descarte seguro de medicamentos — EcoMed Brasil" },
      {
        property: "og:description",
        content:
          "Localize farmácias parceiras e saiba como funciona o recipiente inteligente de descarte.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DisposalPage,
});

const PARTNER_NAMES = [
  "Raia Drogasil",
  "Pague Menos",
  "Drogaria São Paulo",
  "Drogarias Pacheco",
  "Farmácias São João",
  "Panvel",
  "Drogarias Nissei",
  "Drogal",
  "Drogaria Araujo",
  "Farmácia Indiana",
  "Drogaria Venancio",
  "D1000",
  "Drogarias Globo",
  "Farmácia Permanente",
  "Grupo Tapajós",
  "Farma Ponte",
  "Drogaria Minas-Brasil",
  "Redepharma",
  "Drogaria Moderna",
  "Farmácia Santa Lúcia",
  "Drogão Super",
  "Farmácias Vale Verde",
];

function DisposalPage() {
  const [cep, setCep] = useState("");
  const [searchedCep, setSearchedCep] = useState("");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const geocode = useServerFn(geocodeCep);

  const search = useMutation({
    mutationFn: () => geocode({ data: { cep } }),
    onSuccess: (result) => {
      setSearchedCep(cep);
      setAddress(result.formatted);
      const query = `farmácias próximas a ${result.lat},${result.lng}`;
      setMapUrl(`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`);
    },
    onError: (error: Error) => {
      setMapUrl(null);
      setAddress("");
      toast.error(error.message);
    },
  });

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cep.replace(/\D/g, "").length !== 8) return;
    search.mutate();
  }

  return (
    <div className="min-h-screen bg-soft-gradient">
      <AppHeader />

      <main>
        <section className="bg-hero-gradient text-primary-foreground">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 md:py-20">
            <span className="inline-flex items-center gap-2 rounded-full bg-background/15 px-3 py-1 text-sm font-medium">
              <ShieldCheck className="size-4" /> Descarte seguro
            </span>
            <h1 className="mt-5 max-w-3xl text-3xl font-extrabold leading-tight md:text-5xl">
              Descarte seus medicamentos no lugar certo
            </h1>
            <p className="mt-4 max-w-3xl text-base text-primary-foreground/90 md:text-lg">
              Ao chegar a uma farmácia parceira, haverá um recipiente específico para o descarte de
              medicamentos. Esse recipiente terá uma câmera e duas divisões. Mostre o medicamento
              para a câmera: ela fará a identificação e abrirá automaticamente a divisão correta
              para que o descarte seja realizado com segurança.
            </p>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-10 md:grid-cols-3">
          {[
            {
              icon: Camera,
              title: "1. Mostre o medicamento",
              text: "Posicione a embalagem em frente à câmera do recipiente.",
            },
            {
              icon: ShieldCheck,
              title: "2. Aguarde a identificação",
              text: "O sistema identifica o medicamento e determina o descarte adequado.",
            },
            {
              icon: PackageOpen,
              title: "3. Faça o descarte",
              text: "A divisão correta abre automaticamente para receber o medicamento.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-lg bg-card p-6 shadow-card">
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <item.icon className="size-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="border-y border-border bg-card/70">
          <div className="mx-auto w-full max-w-6xl px-4 py-12">
            <div className="max-w-2xl">
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <MapPin className="size-5" />
              </span>
              <h2 className="mt-4 text-2xl font-bold md:text-3xl">Encontre uma farmácia parceira</h2>
              <p className="mt-2 text-muted-foreground">
                Informe seu CEP para ver no mapa as unidades das redes parceiras mais próximas.
              </p>
            </div>

            <form className="mt-6 max-w-xl" onSubmit={handleSearch}>
              <Label htmlFor="disposal-cep">Seu CEP</Label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <Input
                  id="disposal-cep"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="00000-000"
                  value={cep}
                  maxLength={9}
                  onChange={(event) => setCep(formatCep(event.target.value))}
                />
                <Button
                  type="submit"
                  disabled={cep.replace(/\D/g, "").length !== 8 || search.isPending}
                >
                  {search.isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Search className="size-4" />
                  )}
                  {search.isPending ? "Localizando..." : "Buscar farmácia"}
                </Button>
              </div>
            </form>

            {address && (
              <div className="mt-4 flex max-w-2xl items-start gap-3 rounded-lg border border-border bg-background p-4">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Endereço localizado</p>
                  <p className="mt-1 text-sm text-muted-foreground">{address}</p>
                </div>
              </div>
            )}

            <div className="mt-7 overflow-hidden rounded-lg border border-border bg-muted/40 shadow-card">
              {mapUrl ? (
                <iframe
                  key={mapUrl}
                  title={`Farmácias parceiras próximas ao CEP ${searchedCep}`}
                  src={mapUrl}
                  className="h-[28rem] w-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="flex h-80 flex-col items-center justify-center px-6 text-center text-muted-foreground">
                  <MapPin className="mb-3 size-9 text-primary" />
                  <p className="font-medium text-foreground">O mapa aparecerá aqui</p>
                  <p className="mt-1 text-sm">Digite seu CEP para localizar uma farmácia parceira.</p>
                </div>
              )}
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Redes pesquisadas: {PARTNER_NAMES.join(", ")}.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">EcoMed Brasil</p>
          <p className="mt-1">Descarte correto, triagem segura e reaproveitamento de medicamentos.</p>
        </div>
      </footer>
    </div>
  );
}
