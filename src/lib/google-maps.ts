let loader: Promise<void> | null = null;

declare global {
  interface Window {
    __ecomedMapsReady?: () => void;
  }
}

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (typeof google !== "undefined" && google.maps) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise<void>((resolve, reject) => {
    const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
    const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] ?? "";
    if (!key) {
      reject(new Error("Mapa indisponível: chave do Google Maps não configurada."));
      return;
    }

    window.__ecomedMapsReady = () => resolve();

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__ecomedMapsReady&channel=${channel}&language=pt-BR&region=BR`;
    script.async = true;
    script.onerror = () => reject(new Error("Não foi possível carregar o mapa."));
    document.head.appendChild(script);
  });

  return loader;
}
