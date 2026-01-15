// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Header, { FilterKey } from "@/components/Header";
import Map from "@/components/Map";
import { supabase } from "@/lib/supabase";

export default function Page() {
  const [cafes, setCafes] = useState([]);
  const [q, setQ] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<FilterKey[]>([]);

  // 1. [수정] 좌표(bounds) 없이 검색어만으로 데이터 로드
  const loadCafes = useCallback(async (searchQuery: string) => {
    try {
      const params = new URLSearchParams({
        q: searchQuery,
      });

      const res = await fetch(`/api/cafes?${params.toString()}`);
      if (!res.ok) throw new Error("네트워크 응답 에러");
      const data = await res.json();
      setCafes(data);
    } catch (err) {
      console.error("데이터 로드 실패:", err);
    }
  }, []);

  // 2. [수정] q가 바뀔 때만 API 호출 (무한 루프 방지)
  useEffect(() => {
    loadCafes(q);
  }, [q, loadCafes]);

  // 3. 즐겨찾기 토글 함수
const handleToggleFavorite = async (cafeId: number) => {
  // 1. Supabase 세션 확인
  const { data: { session } } = await supabase.auth.getSession();

  // 2. 로그인 안 되어 있으면 경고창만 띄움
  if (!session) {
    alert("즐겨찾기 기능은 로그인이 필요합니다. 상단 카카오 로그인을 이용해 주세요!");
    return;
  }

  // 3. 로그인된 유저만 실제 즐겨찾기 로직 진행
  console.log("로그인 확인: ", cafeId, "번 카페 즐겨찾기 처리 중...");
  // 여기에 작성하셨던 DB 저장 로직(insert 등)을 넣어주시면 됩니다.
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
          cafes={cafes} 
          onToggleFavorite={handleToggleFavorite} 
        />
      </div>
    </div>
  );
}