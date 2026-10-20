import { useRef } from "react";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export type DonationPhoto = { id: string; file: File; preview: string };

const MAX_PHOTOS = 4;
const MAX_SIZE = 8 * 1024 * 1024;

export function DonationPhotos({
  photos,
  onChange,
}: {
  photos: DonationPhoto[];
  onChange: (photos: DonationPhoto[]) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast.error("Envie apenas imagens.");
        return false;
      }
      if (f.size > MAX_SIZE) {
        toast.error("Cada foto deve ter no máximo 8 MB.");
        return false;
      }
      return true;
    });
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      toast.error(`Você pode enviar até ${MAX_PHOTOS} fotos.`);
      return;
    }
    const next = incoming.slice(0, room).map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    onChange([...photos, ...next]);
  };

  const remove = (id: string) => {
    const target = photos.find((p) => p.id === id);
    if (target) URL.revokeObjectURL(target.preview);
    onChange(photos.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => cameraRef.current?.click()}>
          <Camera className="size-4" />
          Tirar foto
        </Button>
        <Button type="button" variant="outline" onClick={() => galleryRef.current?.click()}>
          <ImagePlus className="size-4" />
          Escolher foto da galeria
        </Button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {photos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((photo) => (
            <li key={photo.id} className="relative overflow-hidden rounded-xl border border-border">
              <img
                src={photo.preview}
                alt="Foto do medicamento enviada para análise"
                className="aspect-square w-full object-cover"
              />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute right-2 top-2 size-8"
                onClick={() => remove(photo.id)}
                aria-label="Excluir foto"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Envie fotos nítidas e bem iluminadas mostrando a caixa e o estado geral do medicamento.
        Sempre que possível, fotografe a frente, o verso e as laterais da embalagem.
      </p>
    </div>
  );
}
