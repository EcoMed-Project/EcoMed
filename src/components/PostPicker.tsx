import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, MapPin, Phone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PostsMap } from "@/components/PostsMap";
import { geocodeCep } from "@/lib/geo.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatCep, sortByDistance, type HealthPost, type PostWithDistance } from "@/lib/geo";

type Props = {
  /** Quando informado, a busca ordena essa lista. Caso contrário, consulta a base nacional de postos. */
  posts?: HealthPost[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  initialCep?: string | null;
  emptyMessage?: string;
  donationsOnly?: boolean;
};

export function PostPicker({
  posts,
  selectedId,
  onSelect,
  initialCep,
  emptyMessage,
  donationsOnly = false,
}: Props) {
  const [cep, setCep] = useState(formatCep(initialCep ?? ""));
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [ranked, setRanked] = useState<PostWithDistance[] | null>(null);
  const geocode = useServerFn(geocodeCep);

  const search = useMutation({
    mutationFn: async () => {
      const result = await geocode({ data: { cep } });
      if (posts) {
        return { result, list: sortByDistance(posts, { lat: result.lat, lng: result.lng }) };
      }
      const { data, error } = await supabase.rpc("nearby_health_posts", {
        _lat: result.lat,
        _lng: result.lng,
        _limit: 30,
        _donations_only: donationsOnly,
      });
      if (error) throw error;
      const list = (data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        city: p.city,
        state: p.state,
        cep: p.cep,
        phone: p.phone,
        lat: p.lat,
        lng: p.lng,
        accepts_donations: p.accepts_donations,
        distanceKm: p.distance_km,
      })) satisfies PostWithDistance[];
      return { result, list };
    },
    onSuccess: ({ result, list }) => {
      setOrigin({ lat: result.lat, lng: result.lng });
      setRanked(list);
      if (list.length === 0) toast.info("Nenhum posto encontrado perto desse CEP.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const list: PostWithDistance[] =
    ranked ?? (posts ?? []).map((p) => ({ ...p, distanceKm: Number.NaN }));


  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cep">Seu CEP</Label>
        <div className="flex gap-2">
          <Input
            id="cep"
            inputMode="numeric"
            placeholder="00000-000"
            value={cep}
            maxLength={9}
            onChange={(e) => setCep(formatCep(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                search.mutate();
              }
            }}
          />
          <Button type="button" onClick={() => search.mutate()} disabled={search.isPending}>
            <Search className="size-4" />
            {search.isPending ? "Buscando..." : "Buscar postos"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Usamos seu CEP apenas para mostrar os postos de saúde mais próximos.
        </p>
      </div>

      <PostsMap posts={list} center={origin} selectedId={selectedId} onSelect={onSelect} />

      {list.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {emptyMessage ?? "Nenhum posto disponível no momento."}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((post, index) => {
            const active = post.id === selectedId;
            return (
              <li key={post.id}>
                <button
                  type="button"
                  onClick={() => onSelect(post.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    active
                      ? "border-primary bg-primary-soft shadow-lift"
                      : "border-border bg-card hover:border-primary/40 hover:shadow-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                      {post.name}
                    </span>
                    {active && <CheckCircle2 className="size-5 shrink-0 text-primary" />}
                  </div>
                  <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    {post.address} — {post.city}/{post.state}
                  </p>
                  {post.phone && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="size-4" /> {post.phone}
                    </p>
                  )}
                  {!Number.isNaN(post.distanceKm) && (
                    <p className="mt-2 text-sm font-semibold text-primary">
                      {post.distanceKm.toFixed(1)} km de distância
                    </p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
