import { useState, useEffect } from "react";
import { getImageURL } from "../lib/imageStore";

export function useClosetImage(imageId: string | null) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!imageId) {
      setSrc(null);
      setLoading(false);
      return;
    }

    let active = true;
    let currentUrl: string | null = null;
    setLoading(true);

    getImageURL(imageId).then((url) => {
      if (!active) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      currentUrl = url;
      setSrc(url);
      setLoading(false);
    }).catch((err) => {
      console.error("Failed to load image", err);
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [imageId]);

  return { src, loading };
}
