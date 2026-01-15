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

  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const kakao = (window as any).kakao;
    kakao.maps.load(() => {
      const options = {
        center: new kakao.maps.LatLng(37.5665, 126.978),
        level: 3,
      };
      const map = new kakao.maps.Map(mapDivRef.current, options);
      mapRef.current = map;
    });
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const kakao = (window as any).kakao;
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // 오늘의 요일을 구하는 함수 (월, 화, 수, 목, 금, 토, 일)
    const week = ["일", "월", "화", "수", "목", "금", "토"];
    const today = week[new Date().getDay()];

    cafes.forEach((cafe) => {
  // 1. 오늘의 요일 구하기
  const week = ["일", "월", "화", "수", "목", "금", "토"];
  const today = week[new Date().getDay()];

  // 2. 오늘의 영업시간 객체 가져오기
  let todayHoursText = "영업시간 정보 없음";
  
  try {
    if (cafe.openHoursByDay) {
      // 데이터가 문자열(JSON)로 들어올 경우를 대비해 파싱
      const hoursObj = typeof cafe.openHoursByDay === 'string' 
        ? JSON.parse(cafe.openHoursByDay) 
        : cafe.openHoursByDay;

      const todayData = hoursObj[today];

      // 오늘 요일 데이터가 있고, open/close 값이 있는지 확인
      if (todayData && todayData.open && todayData.close) {
        todayHoursText = `${todayData.open} ~ ${todayData.close}`;
      } else if (todayData === "영업 종료" || !todayData) {
        todayHoursText = "영업 종료";
      }
    }
  } catch (e) {
    console.error("영업시간 파싱 에러:", e);
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
  }, [cafes, onToggleFavorite]);

  return <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />;
}