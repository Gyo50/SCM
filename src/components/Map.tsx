"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

type Cafe = {
  id: number;
  name: string;
  lat: number;
  lng: number;
};

export default function Map({ cafes }: { cafes: Cafe[] }) {
  useEffect(() => {
    // 브라우저 환경 아니면 무시 (Next SSR 대비)
    if (typeof window === "undefined") return;

    if (!window.kakao || !window.kakao.maps) {
      console.error("카카오 지도 스크립트가 아직 로드되지 않았습니다.");
      return;
    }

    const container = document.getElementById("map");
    if (!container) return;

    const kakao = window.kakao;
    const options = {
      center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울 시청 근처
      level: 5,
    };

    const map = new kakao.maps.Map(container, options);

    cafes.forEach((cafe) => {
      new kakao.maps.Marker({
        map,
        position: new kakao.maps.LatLng(cafe.lat, cafe.lng),
      });
    });
  }, [cafes]);

  return <div id="map" style={{ width: "100%", height: "600px" }} />;
}
