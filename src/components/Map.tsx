"use client";

import { useEffect, useRef } from "react";

type Props = {
  cafes: any[];
  onToggleFavorite: (id: number) => void;
};

export default function Map({ cafes, onToggleFavorite }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const overlayRef = useRef<any>(null);

  const cafesRef = useRef<any[]>([]);

  // 최신 cafes 유지
  useEffect(() => {
    cafesRef.current = cafes;
    renderMarkers();
  }, [cafes]);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  };

  const renderMarkers = () => {
    const map = mapRef.current;
    if (!map) return;

    const kakao = (window as any).kakao;
    const level = map.getLevel();

    // level 제한
    if (level > 4) {
      clearMarkers();

      if (overlayRef.current) {
        overlayRef.current.setMap(null);
      }

      return;
    }

    const cafes = cafesRef.current;

    clearMarkers();

    cafes.forEach((cafe) => {
      const lat = Number(cafe.latitude);
      const lng = Number(cafe.longitude);

      if (isNaN(lat) || isNaN(lng)) return;

      const position = new kakao.maps.LatLng(lat, lng);

      const marker = new kakao.maps.Marker({
        position,
        map,
      });

      kakao.maps.event.addListener(marker, "click", () => {
        if (overlayRef.current) {
          overlayRef.current.setMap(null);
        }

        const wrap = document.createElement("div");

        wrap.style.cssText = `
          position:relative;
          bottom:50px;
          width:260px;
          background:#fff;
          border-radius:12px;
          box-shadow:0 10px 24px rgba(0,0,0,0.2);
          padding:14px;
        `;

        wrap.innerHTML = `
        <div style="font-weight:900;margin-bottom:6px;">
        ${cafe.name}
        </div>

        <button id="fav-${cafe.id}"
        style="
        width:100%;
        background:#fee500;
        border:0;
        padding:10px;
        border-radius:8px;
        font-weight:800;
        cursor:pointer;">
        ★ 즐겨찾기
        </button>
        `;

        const overlay = new kakao.maps.CustomOverlay({
          content: wrap,
          position,
          yAnchor: 1,
          clickable: true,
        });

        overlay.setMap(map);
        overlayRef.current = overlay;

        setTimeout(() => {
          const btn = document.getElementById(`fav-${cafe.id}`);

          if (btn) {
            btn.onclick = (e) => {
              e.stopPropagation();
              onToggleFavorite(cafe.id);
            };
          }
        }, 50);
      });

      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const kakao = (window as any).kakao;

    const initMap = () => {
      kakao.maps.load(() => {
        const map = new kakao.maps.Map(mapDivRef.current, {
          center: new kakao.maps.LatLng(37.5665, 126.978),
          level: 3,
        });

        mapRef.current = map;

        // 핵심 이벤트
        kakao.maps.event.addListener(map, "idle", renderMarkers);

        kakao.maps.event.addListener(map, "zoom_changed", renderMarkers);

        kakao.maps.event.addListener(map, "click", () => {
          if (overlayRef.current) {
            overlayRef.current.setMap(null);
          }
        });

        renderMarkers();
      });
    };

    if (kakao && kakao.maps) initMap();
    else {
      const script = document.querySelector('script[src*="dapi.kakao.com"]');

      script?.addEventListener("load", initMap);
    }
  }, []);

  return (
    <div
      ref={mapDivRef}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
}
