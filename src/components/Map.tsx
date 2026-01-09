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

  // 1. 지도 초기화
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const kakao = (window as any).kakao;
    kakao.maps.load(() => {
      const options = {
        center: new kakao.maps.LatLng(37.5665, 126.978),
        level: 6, // 초기 레벨
      };
      const map = new kakao.maps.Map(mapDivRef.current, options);
      mapRef.current = map;
      
      // 화면 크기 변화 대응
      map.relayout();

      // 줌 이벤트: 현재 설정된 레벨(6) 이하에서만 마커 표시
      kakao.maps.event.addListener(map, "zoom_changed", () => {
        const level = map.getLevel();
        markersRef.current.forEach((m) => m.setMap(level <= 6 ? map : null));
      });
    });
  }, []);

  // 2. 마커 업데이트
  useEffect(() => {
    if (!mapRef.current) return;

    const kakao = (window as any).kakao;
    const map = mapRef.current;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const currentLevel = map.getLevel();

    cafes.forEach((cafe) => {
      // 숫자 변환 및 유효성 검사
      const lat = parseFloat(cafe.latitude);
      const lng = parseFloat(cafe.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(lat, lng),
      });

      // 현재 줌 레벨 조건에 맞으면 지도에 표시
      if (currentLevel <= 6) {
        marker.setMap(map);
      }

      kakao.maps.event.addListener(marker, "click", () => {
        onToggleFavorite(cafe.id);
      });

      markersRef.current.push(marker);
    });

    
  }, [cafes, onToggleFavorite]);

  return <div ref={mapDivRef} className="w-full h-full min-h-[400px]" />;
}