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

  // ✅ 즐겨찾기 ID 목록을 상태로 관리
  const [favorites, setFavorites] = useState<number[]>([]);

  // 1. 초기 로드: 카페 데이터 및 즐겨찾기 목록
  const loadInitialData = useCallback(async () => {
    // 즐겨찾기 로드
    const stored = JSON.parse(localStorage.getItem("favorites") || "[]").map(
      Number,
    );
    setFavorites(stored);

    // 카페 데이터 로드
    try {
      const res = await fetch("/api/cafes");
      if (res.ok) {
        const data = await res.json();
        setCafes(data);
      }
    } catch (err) {
      console.error("데이터 로드 실패:", err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. 검색 및 필터링 로직 (핵심)
  useEffect(() => {
    let result = [...cafes];

    // ✅ 필터 적용
    selectedFilters.forEach((key) => {
      if (key === "onlyFavorites") {
        // favorites 상태에 포함된 ID만 남김
        result = result.filter((c) => favorites.includes(Number(c.id)));
      } else if (key === "openNow") result = result.filter((c) => c.isOpenNow);
      else if (key === "open24h") result = result.filter((c) => c.open24h);
      else if (key === "outlets") result = result.filter((c) => c.hasOutlet);
      else if (key === "parking") result = result.filter((c) => c.parking);
      else if (key === "singleSeat")
        result = result.filter((c) => c.singleSeat);
      else if (["STARBUCKS", "HOLLYS", "TWOSOME"].includes(key)) {
        result = result.filter((c) => c.brand === key);
      }
    });

    // ✅ 검색어 적용
    if (q) {
      result = result.filter(
        (c) => c.name.includes(q) || c.roadAddress?.includes(q),
      );
    }

    setFilteredCafes(result);
  }, [cafes, q, selectedFilters, favorites]); // favorites가 바뀔 때마다 실행됨!

  // 3. 즐겨찾기 토글 함수
  const handleToggleFavorite = async (cafeId: number) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      alert("로그인이 필요합니다!");
      return;
    }

    const currentFavs = JSON.parse(
      localStorage.getItem("favorites") || "[]",
    ).map(Number);
    let newFavs;

    if (currentFavs.includes(cafeId)) {
      newFavs = currentFavs.filter((id: number) => id !== cafeId);
    } else {
      newFavs = [...currentFavs, cafeId];
    }

    // 로컬스토리지 저장 및 **상태 업데이트**
    localStorage.setItem("favorites", JSON.stringify(newFavs));
    setFavorites(newFavs); // ✅ 이 업데이트가 위 useEffect를 트리거하여 지도를 다시 그림
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header
        q={q}
        onChangeQ={setQ}
        selected={selectedFilters}
        onToggle={(key: FilterKey) =>
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
