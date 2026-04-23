import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { compressImage } from "@/lib/imageCompress";

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  className?: string;
  variant?: "outline" | "default" | "ghost" | "secondary";
  children?: React.ReactNode;
  galleryOnly?: boolean;
}

export function CameraCapture({ onCapture, className, variant = "outline", children, galleryOnly = false }: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const compressedBlob = await compressImage(file);
      onCapture(compressedBlob);
    } catch (err) {
      console.error("Failed to process image", err);
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        {...(!galleryOnly && { capture: "environment" })}
        className="hidden"
        ref={inputRef}
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant={variant}
        className={className}
        onClick={() => inputRef.current?.click()}
        disabled={isProcessing}
      >
        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : children || <Camera className="w-5 h-5 mr-2" />}
        {isProcessing ? "Processing..." : (children ? null : "Take Photo")}
      </Button>
    </>
  );
}
