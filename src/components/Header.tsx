// src/components/Header.tsx
"use client";

import Image from "next/image";
import { useMemo } from "react";

export const FILTER_CHIPS = [
  { key: "openNow", label: "지금 영업중" },
  { key: "open24h", label: "24시간" },
  { key: "excludeClosingSoon", label: "마감 임박 제외" },

  { key: "quiet", label: "조용함" },
  { key: "outlets", label: "콘센트 많음" },
  { key: "laptop", label: "노트북 OK" },
  { key: "wifi", label: "와이파이 좋음" },

  { key: "singleSeat", label: "1인석/칸막이" },
] as const;

export type FilterKey = typeof FILTER_CHIPS[number]["key"];

type Props = {
  q: string;
  onChangeQ: (v: string) => void;

  selected: FilterKey[];
  onToggle: (k: FilterKey) => void;
  onClear: () => void;
};

export default function Header({ q, onChangeQ, selected, onToggle, onClear }: Props) {
  const hasSelected = useMemo(() => selected.length > 0, [selected]);

  return (
    <header className="w-full border-b bg-white">
      <div className="max-w-[1024px] mx-auto px-4 py-3 flex items-center gap-3">
        {/* 로고 */}
        <div className="flex items-center gap-2 shrink-0">
          <Image src="/logo.svg" alt="SCM 로고" width={36} height={36} />
          <div className="font-extrabold text-base">SCM</div>
          <div className="text-xs text-gray-500 hidden sm:block">Study Cafe Map</div>
        </div>

        {/* 검색 */}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              value={q}
              onChange={(e) => onChangeQ(e.target.value)}
              placeholder="카페 이름/주소 검색"
              className="w-full rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            {q ? (
              <button
                onClick={() => onChangeQ("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-800"
              >
                지우기
              </button>
            ) : null}
          </div>

          {/* 전체 해제 */}
          <button
            onClick={onClear}
            disabled={!hasSelected}
            className={`rounded-xl px-3 py-2 text-sm border ${
              hasSelected
                ? "bg-white hover:bg-gray-50"
                : "bg-gray-50 text-gray-400 cursor-not-allowed"
            }`}
          >
            전체 해제
          </button>
        </div>
      </div>

      {/* 필터 칩 */}
      <div className="max-w-[1024px] mx-auto px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTER_CHIPS.map((chip) => {
            const active = selected.includes(chip.key);
            return (
              <button
                key={chip.key}
                onClick={() => onToggle(chip.key)}
                className={`shrink-0 rounded-full px-3 py-2 text-sm border transition ${
                  active
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          * “지금 영업중 / 마감 임박”은 MVP에서는 서버에서 샘플 로직으로 처리되어요.
        </div>
      </div>
    </header>
  );
}
