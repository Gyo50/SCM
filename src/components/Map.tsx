// src/components/Map.tsx
"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Cafe } from "@/app/page";

declare global {
  interface Window {
    kakao: any;
  }
}

interface MapProps {
  cafes: Cafe[];
}

function brandLabel(brand: Cafe["brand"]) {
  switch (brand) {
    case "STARBUCKS":
      return "스타벅스";
    case "HOLLYS":
      return "할리스";
    case "TWOSOME":
      return "투썸";
    case "TOMNTOMS":
      return "탐앤탐스";
    case "COMPOSE":
      return "컴포즈";
    default:
      return "기타";
  }
}

export default function Map({ cafes }: MapProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  const overlayRef = useRef<any>(null);
  const activeCafeIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mapDivRef.current) return;
    if (typeof window === "undefined") return;
    if (!window.kakao || !window.kakao.maps) return;

    window.kakao.maps.load(() => {
      const kakao = window.kakao;

      const defaultCenter = new kakao.maps.LatLng(37.5665, 126.978);
      const map = new kakao.maps.Map(mapDivRef.current, {
        center: defaultCenter,
        level: 6,
      });
      mapRef.current = map;

      // 대략 위치 1회
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            lastLocationRef.current = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
          },
          () => {},
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      }

      // overlay 1개 재사용
      const overlay = new kakao.maps.CustomOverlay({
        position: defaultCenter,
        content: document.createElement("div"),
        yAnchor: 1.25,
        zIndex: 999,
      });
      overlay.setMap(null);
      overlayRef.current = overlay;

      kakao.maps.event.addListener(map, "click", () => {
        overlay.setMap(null);
        activeCafeIdRef.current = null;
        map.setDraggable(true);
      });

      const geocoder = new kakao.maps.services.Geocoder();

      const openCardOverlay = (cafe: Cafe, position: any) => {
        const wrap = document.createElement("div");
        const statusColor = cafe.isOpenNow ? "#16a34a" : "#ef4444"; // green/red
        const badge = brandLabel(cafe.brand);

        wrap.style.cssText = `
          width: 340px;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 10px 24px rgba(0,0,0,0.25);
          overflow: hidden;
          font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
          color: #111;
          user-select: none;
          cursor: default;
        `;

        wrap.innerHTML = `
          <div style="position:relative; padding: 14px 14px 12px;">
            <button data-close="1"
              style="position:absolute; right:10px; top:10px;
                     width:28px; height:28px; border:0; background:transparent;
                     font-size:18px; cursor:pointer; line-height:28px;">
              ×
            </button>

            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
              <span style="
                font-size:11px;
                font-weight:800;
                padding:4px 8px;
                border-radius:999px;
                background:#f3f4f6;
                color:#111;
              ">${badge}</span>

              <span style="
                font-size:11px;
                font-weight:800;
                padding:4px 8px;
                border-radius:999px;
                background:${cafe.isOpenNow ? "#dcfce7" : "#fee2e2"};
                color:${statusColor};
              ">${cafe.isOpenNow ? "OPEN" : "CLOSED"}</span>
            </div>

            <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
              <div style="font-weight:900; font-size:16px; flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${cafe.name}
              </div>
              <button data-action="detail"
                style="border:0; background:transparent; color:#2563eb; cursor:pointer; font-size:12px; padding:0; white-space:nowrap;">
                상세보기
              </button>
            </div>

            <div style="margin-top:8px; font-size:12px; color:#333; line-height:1.4; word-break:break-word;">
              ${cafe.roadAddress}
            </div>

            <div style="margin-top:10px; display:flex; gap:8px; align-items:center;">
              <span style="font-size:12px; font-weight:900; color:${statusColor};">
                ${cafe.statusText}
              </span>
              <span style="font-size:12px; color:#6b7280;">
                · ${cafe.todayHoursText}
              </span>
            </div>
          </div>

          <div style="border-top:1px solid #eee; padding: 10px 12px; display:flex; gap:10px;">
            <button data-action="route"
              style="flex:1; height:36px; border:0; background:#3b82f6; color:#fff;
                     border-radius:12px; cursor:pointer; font-weight:900;">
              길찾기
            </button>
          </div>

          <div style="position:absolute; left:50%; bottom:-10px; transform:translateX(-50%);
                      width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:10px solid #fff;">
          </div>
        `;

        // 카드 위 이벤트는 지도에 전달 X
        const stop = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
        };
        ["mousedown", "click", "dblclick", "wheel", "touchstart", "touchmove", "touchend"].forEach(
          (evt) => wrap.addEventListener(evt, stop, { passive: false } as any)
        );

        wrap.addEventListener("mouseenter", () => map.setDraggable(false));
        wrap.addEventListener("mouseleave", () => map.setDraggable(true));
        wrap.addEventListener("touchstart", () => map.setDraggable(false), { passive: true });
        wrap.addEventListener("touchend", () => map.setDraggable(true), { passive: true });

        wrap.addEventListener("click", (e) => {
          const target = e.target as HTMLElement;
          const close = target?.getAttribute("data-close");
          const action = target?.getAttribute("data-action");

          if (close === "1") {
            overlay.setMap(null);
            activeCafeIdRef.current = null;
            map.setDraggable(true);
            return;
          }
          if (action === "detail") {
            window.open(cafe.kakaoPlaceUrl, "_blank");
            return;
          }
          if (action === "route") {
            window.open(cafe.kakaoDirectUrl, "_blank");
            return;
          }
        });

        overlay.setPosition(position);
        overlay.setContent(wrap);
        overlay.setMap(map);
        activeCafeIdRef.current = cafe.id;
      };

      cafes.forEach((cafe) => {
        geocoder.addressSearch(cafe.roadAddress, (result: any, status: string) => {
          if (status !== kakao.maps.services.Status.OK) return;

          const position = new kakao.maps.LatLng(
            parseFloat(result[0].y),
            parseFloat(result[0].x)
          );

          const marker = new kakao.maps.Marker({ map, position });

          kakao.maps.event.addListener(marker, "click", () => {
            if (activeCafeIdRef.current === cafe.id) return;
            openCardOverlay(cafe, position);
          });
        });
      });

      return () => {
        mapRef.current = null;
        overlayRef.current = null;
      };
    });
  }, [cafes]);

  // ✅ 현재 위치 버튼: 클릭하면 항상 위치 다시 요청 + panTo
  const moveToMyLocation = useCallback(() => {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!kakao || !map) return;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        lastLocationRef.current = { lat, lng };
        map.panTo(new kakao.maps.LatLng(lat, lng));
      },
      (err) => {
        console.error("현재 위치 실패:", err);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          moveToMyLocation();
        }}
        style={{
          position: "absolute",
          right: "16px",
          bottom: "16px",
          width: "44px",
          height: "44px",
          textIndent: "-9999px",
          background: "#ffffff",
          backgroundImage: "url('/current.svg')",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          borderRadius: "10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          cursor: "pointer",
          zIndex: 99999,
          pointerEvents: "auto",
        }}
        aria-label="현재 위치"
        title="현재 위치"
      >
        현재 위치
      </button>
    </div>
  );
}
