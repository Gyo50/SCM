// components/Map.tsx
"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

// ✅ 카페 타입 정의
type Cafe = {
  id: number;
  name: string;
  roadAddress: string; // 도로명 주소
  lat?: number;
  lng?: number;
};

interface MapProps {
  cafes: Cafe[];
}

export default function Map({ cafes }: MapProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapDivRef.current) return;
    if (typeof window === "undefined") return;
    if (!window.kakao || !window.kakao.maps) {
      console.error("카카오 지도 SDK가 아직 준비되지 않았습니다.");
      return;
    }

    window.kakao.maps.load(() => {
      const kakao = window.kakao;

      // ✅ 기본 중심(서울 시청 근처)
      const defaultCenter = new kakao.maps.LatLng(37.5665, 126.978);

      const map = new kakao.maps.Map(mapDivRef.current, {
        center: defaultCenter,
        level: 5,
      });

      // ==========================
      // 1) 내 현재 위치 마커 & 지도 중심
      // ==========================
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = new kakao.maps.LatLng(
              pos.coords.latitude,
              pos.coords.longitude
            );

            new kakao.maps.Marker({
              map,
              position: loc,
            });

            map.setCenter(loc);
          },
          (err) => {
            console.error("현재 위치를 가져올 수 없습니다:", err);
          }
        );
      } else {
        console.error("이 브라우저에서는 Geolocation을 지원하지 않습니다.");
      }

      // ==========================
      // 2) 카페 데이터 마커 찍기 (주소 기반 지오코딩)
      // ==========================

      const geocoder = new kakao.maps.services.Geocoder(); // ✅ Geocoder 생성

      cafes.forEach((cafe) => {
        // lat/lng가 있으면 그걸 우선 사용해도 됨 (옵션)
        if (typeof cafe.lat === "number" && typeof cafe.lng === "number") {
          const position = new kakao.maps.LatLng(cafe.lat, cafe.lng);
          const marker = new kakao.maps.Marker({ map, position });

          // [선택] 위도/경도 버전에서도 인포윈도우 쓰고 싶으면 여기도 추가 가능
          const info = new kakao.maps.InfoWindow({
            content: `
              <div style="padding:8px;font-size:13px;max-width:220px;">
                <b>${cafe.name}</b><br/>
                <span>${cafe.roadAddress ?? ""}</span><br/>
                <span style="font-size:12px;color:#555;">(마커를 한 번 더 누르면 카카오맵으로 이동)</span>
              </div>
            `,
          });

          let opened = false;

          kakao.maps.event.addListener(marker, "click", () => {
            if (!opened) {
              info.open(map, marker);
              opened = true;
            } else {
              const url = `https://map.kakao.com/?q=${encodeURIComponent(
                cafe.roadAddress ?? cafe.name
              )}`;
              window.open(url, "_blank");
            }
          });

          return;
        }

        // ✅ 여기부터가 "도로명 주소 기반 지오코딩 + 2번 클릭 로직" 추가된 부분
        geocoder.addressSearch(
          cafe.roadAddress,
          (result: any, status: string) => {
            if (status !== kakao.maps.services.Status.OK) {
              console.warn(
                "주소 변환 실패:",
                cafe.roadAddress,
                "status:",
                status
              );
              return;
            }

            const y = parseFloat(result[0].y); // 위도
            const x = parseFloat(result[0].x); // 경도
            const position = new kakao.maps.LatLng(y, x);

            const marker = new kakao.maps.Marker({
              map,
              position,
            });

            // ✅ [추가] 마커 클릭 시 인포윈도우 + 두 번째 클릭 시 카카오맵 이동
            const info = new kakao.maps.InfoWindow({
              content: `
                <div style="padding:8px;font-size:13px;max-width:220px;color:#000000;">
                  <b>${cafe.name}</b><br/>
                  <span>${cafe.roadAddress}</span><br/>
                </div>
              `,
            });

            let opened = false;

            kakao.maps.event.addListener(marker, "click", () => {
              if (!opened) {
                // 첫 번째 클릭 → 말풍선(인포윈도우) 열기
                info.open(map, marker);
                opened = true;
              } else {
                // 두 번째 클릭 → 카카오맵 새 탭으로 열기
                const url = `https://map.kakao.com/?q=${encodeURIComponent(
                  cafe.roadAddress
                )}`;
                window.open(url, "_blank");
              }
            });
          }
        );
      });
    });
  }, [cafes]);

  return (
    <div
      ref={mapDivRef}
      style={{
        width: "100%",
        height: "800px",
        border: "1px solid #ddd",
      }}
    />
  );
}
