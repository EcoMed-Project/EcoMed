import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

import { loadGoogleMaps } from "@/lib/google-maps";
import type { PostWithDistance } from "@/lib/geo";

type Props = {
  posts: PostWithDistance[];
  center: { lat: number; lng: number } | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function PostsMap({ posts, center, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: center ?? { lat: -14.235, lng: -51.925 },
          zoom: center ? 12 : 4,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        setReady(true);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();

    if (center) {
      const origin = new google.maps.Marker({
        map,
        position: center,
        title: "Sua localização",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#1d4ed8",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      markersRef.current.push(origin);
      bounds.extend(center);
    }

    posts.forEach((post, index) => {
      const marker = new google.maps.Marker({
        map,
        position: { lat: post.lat, lng: post.lng },
        title: post.name,
        label: {
          text: String(index + 1),
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: "700",
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 13,
          fillColor: post.id === selectedId ? "#15803d" : "#4d9d6a",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      marker.addListener("click", () => onSelect(post.id));
      markersRef.current.push(marker);
      bounds.extend({ lat: post.lat, lng: post.lng });
    });

    if (posts.length > 0) {
      map.fitBounds(bounds, 60);
    } else if (center) {
      map.setCenter(center);
      map.setZoom(12);
    }
  }, [posts, center, selectedId, ready, onSelect]);

  if (error) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        <span>
          <MapPin className="mx-auto mb-2 size-5" />
          {error}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-72 w-full overflow-hidden rounded-xl border border-border bg-muted shadow-card sm:h-96"
      role="application"
      aria-label="Mapa dos postos de saúde"
    />
  );
}
