import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, Share2, QrCode } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ShareProject() {
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const origin = window.location.origin;
    setUrl(origin);
    QRCode.toDataURL(origin, {
      width: 640,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0f3f33", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const share = async () => {
    const data = {
      title: "EcoMed Brasil",
      text: "Conheça o EcoMed Brasil: descarte correto e reaproveitamento seguro de medicamentos.",
      url,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        /* usuário cancelou */
      }
      return;
    }
    await copy();
  };

  return (
    <section id="compartilhe" className="mx-auto w-full max-w-4xl px-4 py-16">
      <div className="rounded-3xl bg-card p-8 shadow-card sm:p-10">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <QrCode className="size-5" />
          </span>
          <h2 className="mt-4 text-3xl font-bold">Compartilhe nosso projeto</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Aponte a câmera do seu celular para o QR Code e compartilhe nosso projeto.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-white p-4 shadow-sm">
            {qr ? (
              <img
                src={qr}
                alt="QR Code para acessar o EcoMed Brasil"
                className="size-56 sm:size-64"
                width={256}
                height={256}
              />
            ) : (
              <div className="flex size-56 items-center justify-center text-sm text-muted-foreground sm:size-64">
                Gerando QR Code…
              </div>
            )}
          </div>

          <p className="mt-4 break-all text-sm text-muted-foreground">{url}</p>

          <div className="mt-6 flex w-full flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={copy} className="min-w-40">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              Copiar link
            </Button>
            <Button onClick={share} className="min-w-40">
              <Share2 className="size-4" />
              Compartilhar
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
