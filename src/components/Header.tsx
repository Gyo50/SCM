// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Map from "@/components/Map";
import Header from "@/components/Header"; // ✅ 기존 헤더 그대로 사용

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
};

export default function Page() {
  const [cafes, setCafes] = useState<Cafe[]>([]);

  useEffect(() => {
    const run = async () => {
      const res = await fetch("/api/cafes", { cache: "no-store" });
      const data = (await res.json()) as Cafe[];
      setCafes(data);
    };
    run();
  }, []);

  return (
    // ✅ 핵심: 화면을 "헤더 + 나머지"로 나눔
    <div className="flex h-dvh w-full flex-col">
      {/* ✅ 기존 헤더 */}
      <Header />

      {/* ✅ 헤더 아래 나머지 영역이 맵 */}
      <div className="flex-1">
        <Map cafes={cafes} />
      </div>
    </div>
  );
}
