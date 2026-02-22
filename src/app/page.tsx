"use client";

import { useState, useEffect, useCallback } from "react";
import Header, { FilterKey } from "@/components/Header";
import Map from "@/components/Map";
import { supabase } from "@/lib/supabase";

export default function Page() {
  const [cafes, setCafes] = useState<any[]>([]);
  const [filteredCafes, setFilteredCafes] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<FilterKey[]>([]);

  // 📌 1. 카페 로드
  const loadCafes = useCallback(async (searchQuery: string) => {
    try {
      const params = new URLSearchParams({ q: searchQuery });
      const res = await fetch(`/api/cafes?${params.toString()}`);
      if (!res.ok) throw new Error("네트워크 응답 에러");
      const data = await res.json();
      setCafes(data);
    } catch (err) {
      console.error("데이터 로드 실패:", err);
    }
  }, []);

  // 📌 2. 검색어 바뀔 때 카페 재로드
  useEffect(() => {
    loadCafes(q);
  }, [q, loadCafes]);

  // 📌 3. 필터 적용
  useEffect(() => {
    let filtered = [...cafes];

    selectedFilters.forEach((key) => {
      if (key === "openNow") filtered = filtered.filter(c => c.isOpenNow);
      else if (key === "open24h") filtered = filtered.filter(c => c.open24h);
      else if (key === "outlets") filtered = filtered.filter(c => c.hasOutlet);
      else if (key === "parking") filtered = filtered.filter(c => c.parking);
      else if (key === "singleSeat") filtered = filtered.filter(c => c.singleSeat);
      else if (key === "onlyFavorites") {
        const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
        filtered = filtered.filter(c => favorites.includes(c.id));
      }
    });

    // 검색어도 다시 적용
    if (q) {
      filtered = filtered.filter((c) =>
        c.name.includes(q) || c.roadAddress?.includes(q)
      );
    }

    setFilteredCafes(filtered);
  }, [selectedFilters, cafes, q]);

  // 📌 4. 즐겨찾기 클릭
  const handleToggleFavorite = async (cafeId: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("즐겨찾기 기능은 로그인이 필요합니다. 상단 카카오 로그인을 이용해 주세요!");
      return;
    }

    console.log("로그인 확인: ", cafeId, "번 카페 즐겨찾기 처리 중...");
    // TODO: DB insert or delete
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header 
        q={q} 
        onChangeQ={setQ} 
        selected={selectedFilters}
        onToggle={(key) => setSelectedFilters(prev => 
          prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        )}
        onClear={() => setSelectedFilters([])}
      /> 
      <div className="flex-1 relative">
        <Map 
          cafes={filteredCafes} 
          onToggleFavorite={handleToggleFavorite} 
        />
      </div>
    </div>
  );
}
