import { createServerFn } from "@tanstack/react-start";

type GeocodeResult = {
  lat: number;
  lng: number;
  formatted: string;
};

const cepSchema = (input: unknown) => {
  const raw = typeof input === "object" && input !== null ? (input as { cep?: unknown }).cep : null;
  const cep = String(raw ?? "").replace(/\D/g, "");
  if (cep.length !== 8) throw new Error("CEP inválido. Informe 8 dígitos.");
  return { cep };
};

export const geocodeCep = createServerFn({ method: "POST" })
  .inputValidator(cepSchema)
  .handler(async ({ data }): Promise<GeocodeResult> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
    if (!lovableKey || !mapsKey) {
      throw new Error("Serviço de localização indisponível no momento.");
    }

    const formattedCep = `${data.cep.slice(0, 5)}-${data.cep.slice(5)}`;
    const response = await fetch(
      `https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json?address=${encodeURIComponent(
        formattedCep,
      )}&components=country:BR`,
      {
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": mapsKey,
        },
      },
    );

    if (response.status === 403) {
      const details: Array<{ reason?: string }> =
        ((await response.json()) as { error?: { details?: Array<{ reason?: string }> } })?.error
          ?.details ?? [];
      const reason = details.find((d) => d.reason)?.reason;
      if (reason === "API_KEY_HTTP_REFERRER_BLOCKED") {
        throw new Error(
          'A chave do Google Maps está restrita por referenciador. Defina as restrições da chave de servidor como "Nenhuma" ou "Endereços IP".',
        );
      }
      if (reason === "API_KEY_SERVICE_BLOCKED") {
        throw new Error(
          "A chave do Google Maps não permite a API de Geocodificação. Adicione essa API à lista permitida da chave.",
        );
      }
      throw new Error("A busca por CEP foi negada pelo provedor de mapas (403).");
    }

    if (!response.ok) {
      const body = await response.text();
      console.error(`Geocode falhou [${response.status}]: ${body}`);
      throw new Error("Não foi possível localizar este CEP agora. Tente novamente.");
    }

    const json = (await response.json()) as {
      status: string;
      results?: Array<{
        formatted_address: string;
        geometry: { location: { lat: number; lng: number } };
      }>;
    };

    const first = json.results?.[0];
    if (json.status !== "OK" || !first) {
      throw new Error("CEP não encontrado. Verifique os números informados.");
    }

    return {
      lat: first.geometry.location.lat,
      lng: first.geometry.location.lng,
      formatted: first.formatted_address,
    };
  });
