import { useRef, useState } from 'react';
import { Camera, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CameraCaptureDialog } from '@/components/shared/camera-capture-dialog';

/**
 * Bouton de recherche par image : menu « Prendre une photo » (webcam/caméra via
 * getUserMedia, desktop + mobile) ou « Importer une image » (fichier).
 */
export function ImageSearchButton({
  onSelect,
  isSearching = false,
}: {
  onSelect: (file: File) => void;
  isSearching?: boolean;
}) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
    e.target.value = ''; // autorise à re-sélectionner le même fichier
  };

  return (
    <>
      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            title="Rechercher par image"
            aria-label="Rechercher par image"
            disabled={isSearching}
          >
            {isSearching ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setCameraOpen(true)}>
            <Camera className="size-4 mr-2" /> Prendre une photo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => uploadRef.current?.click()}>
            <Upload className="size-4 mr-2" /> Importer une image
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CameraCaptureDialog open={cameraOpen} onOpenChange={setCameraOpen} onCapture={onSelect} />
    </>
  );
}
