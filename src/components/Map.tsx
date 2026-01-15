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

  // 1. 지도 초기화 (최초 1회만 실행하도록 의존성 배열을 비웁니다)
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
        
        // 지도가 생성된 직후에 카페가 이미 있다면 마커를 그립니다.
        if (cafes.length > 0) {
          renderMarkers();
        }
      });
    };

    if (kakao && kakao.maps) {
      initMap();
    } else {
      const script = document.querySelector('script[src*="dapi.kakao.com"]');
      script?.addEventListener("load", initMap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 의존성 배열을 비워 "size changed" 에러를 방지합니다.

  // 2. 마커 그리기 로직을 별도 함수로 분리
  const renderMarkers = () => {
    if (!mapRef.current) return;

    const kakao = (window as any).kakao;
    const map = mapRef.current;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const week = ["일", "월", "화", "수", "목", "금", "토"];
    const today = week[new Date().getDay()];

    cafes.forEach((cafe) => {
      let todayHoursText = "영업시간 정보 없음";
      
      try {
        if (cafe.openHoursByDay) {
          const hoursObj = typeof cafe.openHoursByDay === 'string' 
            ? JSON.parse(cafe.openHoursByDay) 
            : cafe.openHoursByDay;

          const todayData = hoursObj[today];

          if (todayData && todayData.open && todayData.close) {
            todayHoursText = `${todayData.open} ~ ${todayData.close}`;
          } else if (todayData === "영업 종료" || !todayData) {
            todayHoursText = "영업 종료";
          }
        }
      } catch (e) {
        todayHoursText = "정보 확인 불가";
      }

      const position = new kakao.maps.LatLng(cafe.latitude, cafe.longitude);
      const marker = new kakao.maps.Marker({ position, map });

      const content = `
        <div style="padding:15px; min-width:250px; line-height:1.6; font-family: sans-serif;">
          <div style="font-weight:bold; font-size:16px; margin-bottom:5px; color:#333;">${cafe.name}</div>
          <div style="font-size:13px; color:#666; margin-bottom:3px;">📍 ${cafe.roadAddress || "주소 정보 없음"}</div>
          <div style="font-size:13px; color:#009688; margin-bottom:10px; font-weight: 500;">
            ⏰ 오늘(${today}) : ${todayHoursText}
          </div>
          <div style="display:flex; gap:10px; border-top:1px solid #eee; padding-top:10px; margin-top:10px;">
            <a href="https://map.kakao.com/link/to/${cafe.name},${cafe.latitude},${cafe.longitude}" 
               target="_blank" 
               style="flex:1; text-align:center; background:#f0f0f0; color:#333; text-decoration:none; font-size:12px; padding:6px 0; border-radius:4px; font-weight:bold;">
               길찾기
            </a>
            <button id="fav-btn-${cafe.id}" 
                    style="flex:1; cursor:pointer; background:#fee500; border:none; border-radius:4px; font-size:12px; padding:6px 0; font-weight:bold; color:#3c1e1e;">
              ★ 즐겨찾기
            </button>
          </div>
        </div>
      `;

      const infowindow = new kakao.maps.InfoWindow({
        content: content,
        removable: true,
      });

      kakao.maps.event.addListener(marker, "click", () => {
        infowindow.open(map, marker);
        setTimeout(() => {
          const btn = document.getElementById(`fav-btn-${cafe.id}`);
          if (btn) btn.onclick = () => onToggleFavorite(cafe.id);
        }, 100);
      });

      markersRef.current.push(marker);
    });
  };

  // 3. cafes 데이터가 들어오거나 변경될 때만 마커 다시 그리기
  useEffect(() => {
    if (mapRef.current) {
      renderMarkers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafes]); 

  return <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />;
}