// src/components/MapView.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import L from "leaflet";
import Link from "next/link";
import MapAutoResize from "@/components/MapAutoResize";
import { PARKINGS } from "@/lib/parkings";

import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconRetinaUrl, iconUrl, shadowUrl,
  iconSize: [25, 41], iconAnchor: [12, 41],
  popupAnchor: [1, -34], tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

const CENTER = { lat: 4.5989, lng: -74.0697 };

function haversineMeters(a:{lat:number;lng:number}, b:{lat:number;lng:number}) {
  const R=6371000, rad=(d:number)=>d*Math.PI/180;
  const dLat=rad(b.lat-a.lat), dLng=rad(b.lng-a.lng);
  const h=Math.sin(dLat/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}

export default function MapView({ fill=false }: { fill?: boolean }) {
  // 1) Esperar DOM
  const [mounted, setMounted] = useState(false);
  useEffect(()=>setMounted(true), []);

  // 2) Esperar a que el wrapper tenga tamaño > 0
  const wrapperRef = useRef<HTMLDivElement|null>(null);
  const [ready, setReady] = useState(false);
  useEffect(()=>{
    if (!mounted) return;
    const el = wrapperRef.current;
    if (!el) return;

    const hasSize = () => el.clientWidth > 0 && el.clientHeight > 0;
    if (hasSize()) { setReady(true); return; }

    const ro = new ResizeObserver(()=>{ if (hasSize()) { setReady(true); ro.disconnect(); }});
    ro.observe(el);
    return ()=>ro.disconnect();
  }, [mounted]);

  const center: LatLngExpression = [CENTER.lat, CENTER.lng];
  const withDistances = useMemo(
    () => PARKINGS.map(p => ({
      ...p,
      distanceM: Math.round(haversineMeters(CENTER, {lat:p.lat, lng:p.lng}))
    })).sort((a,b)=>a.distanceM-b.distanceM),
    []
  );

  // 👇 clave: cuando fill=true, usa h-full (no flex-1)
  const wrapperClass = fill
    ? "relative h-full rounded-2xl overflow-hidden border bg-white"
    : "relative h-[65vh] min-h-[420px] sm:h-[70vh] rounded-2xl overflow-hidden border bg-white";

  if (!mounted || !ready) return <div ref={wrapperRef} className={wrapperClass} />;

  return (
    <div ref={wrapperRef} className={wrapperClass}>
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom
        updateWhenIdle
        className="h-full w-full"
        whenReady={(m)=>m.target.invalidateSize()}
      >
        <MapAutoResize />

        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          detectRetina
          attribution="&copy; OpenStreetMap contributors"
        />

        <CircleMarker center={center} radius={10} pathOptions={{ color: "#2563eb", weight: 3, fillOpacity: 0.15 }}>
          <Popup>
            <div className="space-y-1">
              <div className="font-medium">Referencia</div>
              <div>Cra. 1 #18a-12, La Candelaria</div>
              <a href={`https://www.google.com/maps?q=${CENTER.lat},${CENTER.lng}`} target="_blank" rel="noreferrer" className="underline text-blue-600">
                Abrir en Google Maps
              </a>
            </div>
          </Popup>
        </CircleMarker>

        {withDistances.map(p => (
          <Marker key={p.id} position={[p.lat, p.lng] as LatLngExpression} icon={defaultIcon}>
            <Popup minWidth={240}>
              <div className="space-y-1 text-sm">
                <div className="font-medium">{p.name}</div>
                <div className="text-gray-600">{p.address}</div>
                <div className="text-gray-600">{p.distanceM} m • ${p.pricePerHour}/h</div>
                <div className="text-gray-600">Cupos: {p.available}/{p.spots}</div>
                <div className="pt-2 flex gap-2">
                  <a href={`https://www.google.com/maps?q=${p.lat},${p.lng}`} target="_blank" rel="noreferrer" className="underline text-blue-600">
                    Ver en Google Maps
                  </a>
                  <Link href={`/booking/${p.id}`} className="ml-auto inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-gray-900 text-white hover:bg-gray-800">
                    Reservar
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
