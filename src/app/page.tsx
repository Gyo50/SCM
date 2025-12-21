"use client";

import { useEffect, useState } from "react";
import Map from "@/components/Map";
import Header from "@/components/Header";

export type Cafe = {
  id: number;
  name: string;
  roadAddress: string;
  brand: "STARBUCKS" | "HOLLYS" | "TWOSOME" | "TOMNTOMS" | "COMPOSE" | "ETC";
  kakaoPlaceUrl: string;
  kakaoDirectUrl: string;
  open24h: boolean;
  todayHoursText: string;
  isOpenNow: boolean;
  statusText: string;
};

export default function Page() {
  const [cafes, setCafes] = useState<Cafe[]>([]);

  useEffect(() => {
    fetch("/api/cafes", { cache: "no-store" })
      .then((res) => res.json())
      .then(setCafes);
  }, []);

  return (
    <div className="flex flex-col h-dvh w-full">
      {/* ✅ 헤더 */}
      <Header />

      {/* ✅ 헤더 제외한 나머지 영역 */}
      <div className="flex-1 relative">
        <Map cafes={cafes} />
      </div>
    </div>
  );
}
