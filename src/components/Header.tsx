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
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ✅ 하이드레이션 오류 방지를 위한 마운트 상태
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. 컴포넌트 마운트 완료 표시
    setMounted(true);

    // 2. 유저 세션 체크
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

  // ✅ 서버 렌더링 시점에는 아무것도 렌더링하지 않거나 최소한의 틀만 반환하여 클라이언트와 맞춤
  if (!mounted)
    return <div className="h-[120px] bg-white w-full fixed top-0 z-[1000]" />;

  return (
    <>
      <header
        className={`w-full fixed top-0 z-[1000] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] border-b shadow-md
          ${isCollapsed ? "-translate-y-full" : "translate-y-0"}
          bg-white/90 backdrop-blur-lg`}
      >
        <div className="max-w-[1024px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
          >
            <Image src="/logo.svg" alt="로고" width={28} height={28} />
            <div className="font-black text-lg text-gray-900 tracking-tighter">
              SCM
            </div>
          </Link>

          <div className="flex-1 relative">
            <input
              value={q}
              onChange={(e) => onChangeQ(e.target.value)}
              placeholder="어떤 카페를 찾으시나요?"
              className="w-full rounded-2xl border border-gray-200 bg-gray-100/50 px-4 py-2 text-sm text-black outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner"
            />
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {!loading &&
              (user ? (
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full pl-3 pr-2 border border-gray-200 shadow-sm">
                  <button
                    onClick={() =>
                      supabase.auth
                        .signOut()
                        .then(() => window.location.reload())
                    }
                    className="text-[10px] font-bold text-gray-400 hover:text-red-500 cursor-pointer mr-1 transition-colors"
                  >
                    OUT
                  </button>
                  <div className="relative w-8 h-8 overflow-hidden rounded-full border border-white shadow-sm shrink-0">
                    {userAvatar ? (
                      <Image
                        src={userAvatar}
                        alt="P"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-100" />
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-2xl font-bold text-xs shadow-sm hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
                >
                  <Image
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="G"
                    width={14}
                    height={14}
                  />
                  로그인
                </button>
              ))}
          </div>
        </div>

        {/* 필터 칩 영역 (가로 스크롤 & 폰트 13px) */}
        <div className="max-w-[1024px] mx-auto px-4 pb-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap scroll-smooth no-scrollbar select-none active:cursor-grabbing">
          {FILTER_CHIPS.map((chip) => {
            if (chip.key === "onlyFavorites" && !user) return null;
            const isActive = selected.includes(chip.key);
            return (
              <button
                key={chip.key}
                onClick={() => onToggle(chip.key)}
                className={`shrink-0 rounded-xl px-4 py-2 text-[13px] font-bold border transition-all cursor-pointer active:scale-95
                  ${isActive ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200" : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"}`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* 접기 버튼 */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white border-b border-l border-r border-gray-200 px-4 py-1 rounded-b-xl shadow-md text-[10px] font-black text-gray-400 hover:text-blue-500 hover:pt-2 transition-all cursor-pointer"
        >
          ▲ 접기
        </button>
      </header>

      {/* 펼치기 버튼 */}
      <button
        onClick={() => setIsCollapsed(false)}
        className={`fixed top-0 left-1/2 -translate-x-1/2 z-[1001] bg-blue-600 text-white px-6 py-2 rounded-b-2xl shadow-xl font-black text-xs transition-all duration-500 cursor-pointer
          ${isCollapsed ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
      >
        ▼ 메뉴 열기
      </button>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
