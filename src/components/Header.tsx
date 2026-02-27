"use client";

import Image from "next/image";
import { useMemo, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export type FilterKey =
  | "openNow"
  | "open24h"
  | "outlets"
  | "parking"
  | "singleSeat"
  | "onlyFavorites"
  | "STARBUCKS"
  | "HOLLYS"
  | "TWOSOME";

type FilterChip = {
  key: FilterKey;
  label: string;
};

export const FILTER_CHIPS: readonly FilterChip[] = [
  { key: "openNow", label: "지금 영업중" },
  { key: "open24h", label: "24시간" },
  { key: "outlets", label: "콘센트" },
  { key: "parking", label: "주차" },
  { key: "singleSeat", label: "1인석" },
  { key: "onlyFavorites", label: "저장한 카페" },
  { key: "STARBUCKS", label: "스타벅스" },
  { key: "HOLLYS", label: "할리스" },
  { key: "TWOSOME", label: "투썸플레이스" },
];

type Props = {
  q: string;
  onChangeQ: (v: string) => void;
  selected: FilterKey[];
  onToggle: (k: FilterKey) => void;
  onClear: () => void;
};

export default function Header({
  q,
  onChangeQ,
  selected,
  onToggle,
  onClear,
}: Props) {
  const hasSelected = useMemo(() => selected.length > 0, [selected]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);

  // --- [1] 로그인 상태 감지 ---
  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 상태 변화 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- [2] 로그인/로그아웃 핸들러 ---
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        scopes: "profile_nickname",
        redirectTo: window.location.origin,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollLeft += e.deltaY;
  };

  return (
    <header className="w-full border-b bg-white sticky top-0 z-1000">
      <div className="max-w-[1024px] mx-auto px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <Image src="/logo.svg" alt="SCM 로고" width={32} height={32} />
          <div className="font-extrabold text-base tracking-tight">SCM</div>
        </div>
        <div className="flex-1 relative">
          <input
            value={q}
            onChange={(e) => onChangeQ(e.target.value)}
            placeholder="카페 검색"
            className="w-full rounded-xl border bg-gray-50 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {q && (
            <button
              onClick={() => onChangeQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        <div className="shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-[10px] text-gray-400 leading-none">
                  반가워요!
                </p>
                <p className="text-xs font-bold">
                  {user.user_metadata.full_name || "사용자"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-gray-500 hover:text-red-500 border rounded-lg px-2 py-2"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-[#FEE500] text-[#191919] px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-[#FADA0A] transition-colors"
            >
              <span>로그인</span>
            </button>
          )}
        </div>
      </div>
      <div className="max-w-[1024px] mx-auto px-4 pb-3 flex items-center gap-2">
        <div
          ref={scrollRef}
          onWheel={onWheel}
          className="flex-1 flex gap-2 overflow-x-auto scroll-hide whitespace-nowrap active:cursor-grabbing"
        >
          {FILTER_CHIPS.map((chip) => {
            const active = selected.includes(chip.key);
            if (chip.key === "onlyFavorites" && !user) return null;
            return (
              <button
                key={chip.key}
                onClick={() => onToggle(chip.key)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm border transition-all cursor-pointer ${
                  active
                    ? "bg-blue-600 text-white border-blue-600 font-bold shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={onClear}
          disabled={!hasSelected}
          className={`shrink-0 rounded-lg p-2 border transition cursor-pointer ${
            hasSelected
              ? "bg-white text-blue-600 border-blue-100"
              : "bg-gray-50 text-gray-300 border-gray-100"
          }`}
          title="필터 초기화"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
