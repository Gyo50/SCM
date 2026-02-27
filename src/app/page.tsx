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

  useEffect(() => {
    loadCafes(q);
  }, [q, loadCafes]);

  useEffect(() => {
    let filtered = [...cafes];
    const brandKeys = ["STARBUCKS", "HOLLYS", "TWOSOME"];

    selectedFilters.forEach((key) => {
      if (key === "openNow") filtered = filtered.filter((c) => c.isOpenNow);
      else if (key === "open24h") filtered = filtered.filter((c) => c.open24h);
      else if (key === "outlets")
        filtered = filtered.filter((c) => c.hasOutlet);
      else if (key === "parking") filtered = filtered.filter((c) => c.parking);
      else if (key === "singleSeat")
        filtered = filtered.filter((c) => c.singleSeat);
      else if (brandKeys.includes(key)) {
        filtered = filtered.filter((c) => c.brand === key);
      } else if (key === "onlyFavorites") {
        const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
        filtered = filtered.filter((c) => favorites.includes(c.id));
      }
    });
    if (q) {
      filtered = filtered.filter(
        (c) => c.name.includes(q) || c.roadAddress?.includes(q),
      );
    }

    setFilteredCafes(filtered);
  }, [selectedFilters, cafes, q]);

  const handleToggleFavorite = async (cafeId: number) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      alert("로그인이 필요합니다. 상단 카카오 로그인을 이용해 주세요!");
      return;
    }
    console.log("로그인 확인: ", cafeId, "번 카페 즐겨찾기 처리 중...");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header
        q={q}
        onChangeQ={setQ}
        selected={selectedFilters}
        onToggle={(key) =>
          setSelectedFilters((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
          )
        }
        onClear={() => setSelectedFilters([])}
      />
      <div className="flex-1 relative">
        <Map cafes={filteredCafes} onToggleFavorite={handleToggleFavorite} />
      </div>
    </div>
  );
}
