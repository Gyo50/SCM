// src/app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Map from "@/components/Map";
import Header, { type FilterKey } from "@/components/Header";

export type OpenHours = { open: string; close: string };
export type OpenHoursByDay = Record<number, OpenHours | null>;

export type Cafe = {
  id: number;
  name: string;
  roadAddress: string;

  brand: "STARBUCKS" | "HOLLYS" | "TWOSOME" | "TOMNTOMS" | "COMPOSE" | "ETC";

  kakaoPlaceUrl: string;
  kakaoDirectUrl: string;

  open24h: boolean;
  openHours?: OpenHours | null;
  openHoursByDay?: OpenHoursByDay;

  todayHoursText: string;
  isOpenNow: boolean;
  statusText: string;

  // (선택) 나중에 추가할 수 있는 필드들 예시:
  // outlets?: boolean;
  // singleSeat?: boolean;
};

export default function Page() {
  const [cafes, setCafes] = useState<Cafe[]>([]);

  // ✅ Header에서 쓸 상태들
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<FilterKey[]>([]);

  useEffect(() => {
    const run = async () => {
      const res = await fetch("/api/cafes", { cache: "no-store" });
      const data = (await res.json()) as Cafe[];
      setCafes(data);
    };
    run();
  }, []);

  // ✅ 필터 토글
  const toggleFilter = (k: FilterKey) => {
    setSelected((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
    );
  };

  // ✅ 전체 해제
  const clearFilters = () => setSelected([]);

  // ✅ (최소) 검색 + 일부 필터만 예시로 적용
  const filteredCafes = useMemo(() => {
    const keyword = q.trim().toLowerCase();

    return cafes.filter((cafe) => {
      // 1) 검색
      const matchQ =
        !keyword ||
        cafe.name.toLowerCase().includes(keyword) ||
        cafe.roadAddress.toLowerCase().includes(keyword);

      if (!matchQ) return false;

      // 2) 필터 (현재 네 API에 실제로 있는 필드만 적용)
      if (selected.includes("openNow") && !cafe.isOpenNow) return false;
      if (selected.includes("open24h") && !cafe.open24h) return false;

      // excludeClosingSoon 같은 건 "마감 임박" 판단 로직 필요해서 MVP에서는 일단 통과
      // outlets/singleSeat 같은 건 API에 필드 추가되면 여기서 적용하면 됨

      return true;
    });
  }, [cafes, q, selected]);

  return (
    <div className=" w-full h-full">
      <Header
        q={q}
        onChangeQ={setQ}
        selected={selected}
        onToggle={toggleFilter}
        onClear={clearFilters}
      />

      <div className="h-screen">
        <Map cafes={filteredCafes} />
      </div>
    </div>
  );
}
