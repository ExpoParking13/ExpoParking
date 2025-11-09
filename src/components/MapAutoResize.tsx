"use client";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function MapAutoResize() {
  const map = useMap();

  useEffect(() => {
    const invalidate = () => map.invalidateSize();

    const t = setTimeout(invalidate, 0);
    window.addEventListener("resize", invalidate);
    window.addEventListener("orientationchange", invalidate);

    const ro = new ResizeObserver(invalidate);
    ro.observe(map.getContainer());

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("orientationchange", invalidate);
      ro.disconnect();
    };
  }, [map]);

  return null;
}
