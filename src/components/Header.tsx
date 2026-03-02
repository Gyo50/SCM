"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";

export type FilterKey =
  | "onlyFavorites"
  | "openNow"
  | "open24h"
  | "outlets"
  | "parking"
  | "singleSeat"
  | "STARBUCKS"
  | "HOLLYS"
  | "TWOSOME";

type FilterChip = { key: FilterKey; label: string };

export const FILTER_CHIPS: readonly FilterChip[] = [
  { key: "onlyFavorites", label: "⭐️ 즐겨찾기" },
  { key: "openNow", label: "지금 영업중" },
  { key: "open24h", label: "24시간" },
  { key: "outlets", label: "콘센트" },
  { key: "parking", label: "주차" },
  { key: "singleSeat", label: "1인석" },
  { key: "STARBUCKS", label: "스타벅스" },
  { key: "HOLLYS", label: "할리스" },
  { key: "TWOSOME", label: "투썸플레이스" },
];

export default function Header({
  q,
  onChangeQ,
  selected,
  onToggle,
  onClear,
}: any) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  };

  const userAvatar = useMemo(
    () => user?.user_metadata?.avatar_url || user?.user_metadata?.picture,
    [user],
  );

  return (
    <header className="w-full border-b bg-white sticky top-0 z-[1000] shadow-sm">
      <div className="max-w-[1024px] mx-auto px-4 py-3 flex items-center gap-3">
        {/* 로고: 호버 시 약간 투명해지는 효과 */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
        >
          <Image src="/logo.svg" alt="로고" width={32} height={32} />
          <div className="font-extrabold text-base text-gray-900 tracking-tight">
            SCM
          </div>
        </Link>

        {/* 검색창: 포커스 시 테두리 강조 및 그림자 효과 */}
        <div className="flex-1 relative">
          <input
            value={q}
            onChange={(e) => onChangeQ(e.target.value)}
            placeholder="카페 검색"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-black outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="shrink-0 min-w-[40px] flex justify-end items-center">
          {!loading &&
            (user ? (
              <div className="flex items-center gap-3">
                {/* 프로필 이미지 호버 시 테두리 강조 */}
                <div className="relative w-9 h-9 overflow-hidden rounded-full border border-gray-200 hover:border-blue-300 transition-colors cursor-help shadow-sm">
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt="프로필"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                      User
                    </div>
                  )}
                </div>
                <button
                  onClick={() =>
                    supabase.auth.signOut().then(() => window.location.reload())
                  }
                  className="text-xs font-semibold text-gray-500 hover:text-red-500 active:scale-95 transition-all cursor-pointer px-2 py-1 rounded-md hover:bg-red-50"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-xl font-bold text-xs shadow-sm hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 active:scale-95 transition-all cursor-pointer"
              >
                <Image
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="G"
                  width={14}
                  height={14}
                />
                <span className="text-gray-700">로그인</span>
              </button>
            ))}
        </div>
      </div>

      {/* 필터 칩: 가로 스크롤 가독성 및 클릭 피드백 강화 */}
      <div className="max-w-[1024px] mx-auto px-4 pb-3 flex items-center gap-2 overflow-x-auto scroll-hide whitespace-nowrap scroll-smooth">
        {FILTER_CHIPS.map((chip) => {
          if (chip.key === "onlyFavorites" && !user) return null;
          const isActive = selected.includes(chip.key);

          return (
            <button
              key={chip.key}
              onClick={() => onToggle(chip.key)}
              className={`
                shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border transition-all cursor-pointer active:scale-90
                ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100 hover:bg-blue-700"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
