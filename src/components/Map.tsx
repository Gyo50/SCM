"use client";

import { useEffect, useRef, useCallback } from "react";

type Props = {
  cafes: any[];
  onToggleFavorite: (id: number) => void;
};

export default function Map({ cafes, onToggleFavorite }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const overlayRef = useRef<any>(null);

  const renderMarkers = useCallback(() => {
    if (!mapRef.current) return;
    const kakao = (window as any).kakao;
    const map = mapRef.current;

    // 1. 기존 마커 및 오버레이 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (overlayRef.current) overlayRef.current.setMap(null);

    cafes.forEach((cafe) => {
      // cafe 객체에는 이미 route.ts에서 계산한
      // isOpenNow, todayHoursText, statusText, kakaoPlaceUrl 등이 들어있습니다.

      const position = new kakao.maps.LatLng(cafe.latitude, cafe.longitude);
      const marker = new kakao.maps.Marker({ position, map });

      // 2. 오버레이용 DOM 생성 (이벤트 바인딩을 위해 createElement 사용)
      const wrap = document.createElement("div");

      wrap.style.cssText = `
        position: relative; bottom: 50px;
        width: 280px; background: #fff; border-radius: 14px;
        box-shadow: 0 10px 24px rgba(0,0,0,0.2); font-family: sans-serif;
      `;

      wrap.innerHTML = `
        <div style="padding: 16px; position: relative;">
          <button data-action="close" style="position:absolute; top:12px; right:12px; border:0; background:transparent; font-size:18px; color:#999; cursor:pointer; line-height:1; transition:all 0.2s ease; transform:rotateX(0deg); hover:transform:rotateX(90deg); ">✕</button>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-size:11px; font-weight:bold; color:${cafe.isOpenNow ? "#16a34a" : "#ef4444"};">
              ● ${cafe.isOpenNow ? "영업 중" : "영업 종료"}
            </span>
          </div>

          <div style="font-size:18px; font-weight:900; color:#111; margin-bottom:4px; overflow:hidden; text-overflow:ellipsis; white-space:normal; padding-right:20px;">
            ${cafe.name}
            <button data-action="detail" style="border:0; background:transparent; font-size:12px; color:#2563eb; cursor:pointer; font-weight:600; padding:0;">상세보기 ❯</button>
          </div>

          <div style="font-size:13px; color:#666; margin-bottom:12px; line-height:1.4; white-space:normal;">
            📍 ${cafe.roadAddress || "주소 정보 없음"}
          </div>

          <div style="background:#f8f9fa; padding:10px; border-radius:10px; margin-bottom:16px; font-size:13px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:bold; color:#555;">영업시간</span>
            <span style="font-weight:800; color:#111;">${cafe.todayHoursText}</span>
          </div>
          
          <div style="display:flex; gap:8px;">
            <button data-action="route" style="flex:1; background:#fff; border:1px solid #ddd; padding:10px 0; border-radius:8px; font-size:13px; color:#333; font-weight:700; cursor:pointer;">🚙 길찾기</button>
            <button id="fav-btn-${cafe.id}" style="flex:1.2; background:#fee500; border:0; padding:10px 0; border-radius:8px; font-size:13px; font-weight:800; color:#3c1e1e; cursor:pointer;">★ 즐겨찾기</button>
          </div>
        </div>
        <div style="position:absolute; bottom:-10px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:10px solid transparent; border-right:10px solid transparent; border-top:10px solid #fff;"></div>
      `;

      // 3. 오버레이 내 버튼 클릭 이벤트 처리

      const handleOverlayClick = (e: MouseEvent) => {
        e.stopPropagation();
        const target = e.target as HTMLElement;
        const action = target.getAttribute("data-action");

        if (action === "detail") {
          window.open(cafe.kakaoPlaceUrl, "_blank");
        } else if (action === "route") {
          window.open(cafe.kakaoDirectUrl, "_blank");
        } else if (action === "close") {
          // ✅ 수정: X 버튼 클릭 시 오버레이 닫기
          if (overlayRef.current) overlayRef.current.setMap(null);
        }
      };

      wrap.addEventListener("click", handleOverlayClick);
      // 모바일 대응 (터치 이벤트 전파 방지)
      wrap.addEventListener("touchstart", (e) => e.stopPropagation(), {
        passive: true,
      });

      // 4. 마커 클릭 시 오버레이 표시
      kakao.maps.event.addListener(marker, "click", () => {
        if (overlayRef.current) overlayRef.current.setMap(null);
        const customOverlay = new kakao.maps.CustomOverlay({
          content: wrap,
          position: position,
          yAnchor: 1,
          clickable: true, // CustomOverlay의 클릭 가능 설정
        });
        customOverlay.setMap(map);
        overlayRef.current = customOverlay;

        // 즐겨찾기 버튼 이벤트 바인딩
        setTimeout(() => {
          const btn = document.getElementById(`fav-btn-${cafe.id}`);
          if (btn)
            btn.onclick = (e) => {
              e.stopPropagation();
              onToggleFavorite(cafe.id);
            };
        }, 50);
      });

      markersRef.current.push(marker);
    });
  }, [cafes, onToggleFavorite]);

  // 지도 초기화 및 데이터 변경 감지 useEffect 로직은 이전과 동일
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;
    const kakao = (window as any).kakao;
    const initMap = () => {
      kakao.maps.load(() => {
        const options = {
          center: new kakao.maps.LatLng(37.5665, 126.978),
          level: 3,
        };
        mapRef.current = new kakao.maps.Map(mapDivRef.current, options);
        kakao.maps.event.addListener(mapRef.current, "click", () => {
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
  }, [renderMarkers]);

  useEffect(() => {
    if (mapRef.current) renderMarkers();
  }, [cafes, renderMarkers]);

  return <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />;
}
