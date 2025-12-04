"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

type Cafe = {
  id: number;
  name: string;
  roadAddress: string;
};

export default function Map({ cafes }: { cafes: Cafe[] }) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!window.kakao || !window.kakao.maps) return;

    window.kakao.maps.load(() => {
      const kakao = window.kakao;
      const defaultCenter = new kakao.maps.LatLng(37.5665, 126.9780);

      const map = new kakao.maps.Map(mapRef.current, {
        center: defaultCenter,
        level: 5,
      });

      // 현재 위치 마커 (있으면 그대로 유지)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const loc = new kakao.maps.LatLng(
            pos.coords.latitude,
            pos.coords.longitude
          );
          new kakao.maps.Marker({ map, position: loc });
          map.setCenter(loc);
        });
      }

      const geocoder = new kakao.maps.services.Geocoder();

      cafes.forEach((cafe) => {
        console.log("검색할 주소:", cafe.roadAddress);

        geocoder.addressSearch(
          cafe.roadAddress,
          (result: any, status: any) => {
            console.log("geocoder 결과:", status, result);

            if (status === kakao.maps.services.Status.OK) {
              const y = parseFloat(result[0].y); // 위도
              const x = parseFloat(result[0].x); // 경도
              const position = new kakao.maps.LatLng(y, x);

              const marker = new kakao.maps.Marker({
                map,
                position,
              });

              const info = new kakao.maps.InfoWindow({
                content: `<div style="padding:8px;font-size:14px;">
                      <b>${cafe.name}</b><br/>
                      ${cafe.roadAddress}
                    </div>`,
              });

              kakao.maps.event.addListener(marker, "click", () => {
                info.open(map, marker);
              });
            } else {
              console.warn(
                "주소 변환 실패:",
                cafe.roadAddress,
                "status:",
                status
              );
            }
          }
        );
      });
    });
  }, [cafes]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "600px", border: "1px solid #ddd" }}
    />
  );
}
