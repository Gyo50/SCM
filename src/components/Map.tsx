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

  // 최신 cafes 유지 및 렌더링
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

    if (level > 4) {
      clearMarkers();
      if (overlayRef.current) overlayRef.current.setMap(null);
      return;
    }

    const cafesData = cafesRef.current;
    clearMarkers();

    cafesData.forEach((cafe) => {
      const lat = Number(cafe.latitude);
      const lng = Number(cafe.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const position = new kakao.maps.LatLng(lat, lng);
      const marker = new kakao.maps.Marker({ position, map });

      kakao.maps.event.addListener(marker, "click", () => {
        map.panTo(position);
        if (overlayRef.current) overlayRef.current.setMap(null);

        // ✅ [핵심] 오버레이를 열 때마다 로컬스토리지에서 최신 즐겨찾기 상태를 가져옵니다.
        const getLatestIsFav = () => {
          const favorites = JSON.parse(
            localStorage.getItem("favorites") || "[]",
          ).map(Number);
          return favorites.includes(Number(cafe.id));
        };

        let isFav = getLatestIsFav();

        const wrap = document.createElement("div");
        wrap.style.cssText = `
          position: relative; bottom: 50px;
          width: 260px; background: #fff; border-radius: 14px;
          box-shadow: 0 10px 24px rgba(0,0,0,0.15); font-family: sans-serif;
          z-index: 1000;
        `;

        // UI 헬퍼 함수: 별 모양과 텍스트를 현재 상태에 맞춰 반환
        const getFavHTML = (active: boolean) => `
          <span id="fav-icon-${cafe.id}" style="font-size:14px; color:#3c1e1e; ${active ? "" : "-webkit-text-stroke: 1px #3c1e1e; color: transparent;"}">★</span>
          <span id="fav-text-${cafe.id}">${active ? "저장됨" : "즐겨찾기"}</span>
        `;

        wrap.innerHTML = `
          <style>
            .close-btn:hover { transform: rotate(90deg); color: #666 !important; }
            .route-btn:hover { background: #f1f5f9 !important; border-color: #cbd5e1 !important; }
            .fav-btn:hover { background: #f7dc00 !important; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            button { transition: all 0.2s ease; }
          </style>

          <div style="padding: 14px; position: relative;">
            <button id="close-${cafe.id}" class="close-btn"
              style="position:absolute; top:10px; right:10px; border:0; background:transparent; font-size:18px; color:#bbb; cursor:pointer; line-height:1; padding:4px;">✕</button>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding-right:24px;">
              <span style="font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px; background:${cafe.isOpenNow ? "#e6f7ed" : "#fff0f0"}; color:${cafe.isOpenNow ? "#16a34a" : "#ef4444"}; display:flex; align-items:center; gap:3px;">
                <span style="width:4px; height:4px; border-radius:50%; background:currentColor;"></span>
                ${cafe.isOpenNow ? "영업 중" : "영업 종료"}
              </span>
              <button id="detail-${cafe.id}" style="border:0; background:transparent; font-size:11px; color:#2563eb; cursor:pointer; font-weight:600; padding:0;">상세보기 ❯</button>
            </div>

            <div style="margin-bottom:10px;">
              <div style="font-size:17px; font-weight:800; color:#1a1a1a; margin-bottom:2px; letter-spacing:-0.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${cafe.name}</div>
              <div style="font-size:12px; color:#777; display:flex; align-items:center; gap:3px;">
                <span>📍</span>
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${cafe.roadAddress || "주소 정보 없음"}</span>
              </div>
            </div>

            <div style="background:#f8f9fa; border-radius:8px; padding:8px 10px; margin-bottom:14px; display:flex; align-items:center; gap:6px; border:1px solid #f1f3f5;">
              <span style="font-size:12px;">⏰</span>
              <span style="font-size:12px; color:#333; font-weight:700;">${cafe.todayHoursText}</span>
            </div>

            <div style="display:flex; gap:6px;">
              <button id="route-${cafe.id}" class="route-btn"
                style="flex:1; border:1px solid #e2e8f0; background:#fff; color:#475569; padding:10px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:4px;">🚙 길찾기</button>
              <button id="fav-${cafe.id}" class="fav-btn"
                style="flex:1.2; background:#fee500; border:0; color:#3c1e1e; padding:10px; border-radius:8px; font-size:12px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px;">
                ${getFavHTML(isFav)}
              </button>
            </div>
          </div>
          <div style="position:absolute; bottom:-10px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:10px solid transparent; border-right:10px solid transparent; border-top:10px solid #fff;"></div>
        `;

        wrap.addEventListener("click", (e) => e.stopPropagation());

        const overlay = new kakao.maps.CustomOverlay({
          content: wrap,
          position,
          yAnchor: 1,
          clickable: true,
        });

        overlay.setMap(map);
        overlayRef.current = overlay;

        // 이벤트 바인딩
        wrap
          .querySelector(`#close-${cafe.id}`)
          ?.addEventListener("click", () => overlay.setMap(null));
        wrap
          .querySelector(`#detail-${cafe.id}`)
          ?.addEventListener("click", () =>
            window.open(cafe.kakaoPlaceUrl, "_blank"),
          );
        wrap
          .querySelector(`#route-${cafe.id}`)
          ?.addEventListener("click", () =>
            window.open(cafe.kakaoDirectUrl, "_blank"),
          );

        wrap.querySelector(`#fav-${cafe.id}`)?.addEventListener("click", () => {
          onToggleFavorite(cafe.id);

          // 클릭 직후 UI 갱신 (현재 메모리상의 isFav 반전)
          isFav = !isFav;
          const favBtn = wrap.querySelector(`#fav-${cafe.id}`) as HTMLElement;
          if (favBtn) favBtn.innerHTML = getFavHTML(isFav);
        });
      });
      markersRef.current.push(marker);
    });
  };

  // 지도 초기화 로직 (동일)
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
        kakao.maps.event.addListener(map, "idle", renderMarkers);
        kakao.maps.event.addListener(map, "zoom_changed", renderMarkers);
        kakao.maps.event.addListener(map, "click", () => {
          if (overlayRef.current) overlayRef.current.setMap(null);
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

  return <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />;
}
