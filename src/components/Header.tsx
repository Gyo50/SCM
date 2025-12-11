// src/components/Header.tsx
"use client";

import Image from "next/image";

export default function Header() {
  return (
    <header className="flex items-center justify-between gap-4 p-4 max-w-[1024px] mx-auto">
      
      {/* 왼쪽: 로고 + 제목 */}
      <div className="flex items-center gap-3">
        <Image
          src="/logo.svg"
          alt="SCM 로고"
          width={40}
          height={40}
        />
        <span className="text-lg font-semibold">SCM Study Cafe Map</span>
      </div>

      {/* 오른쪽: 검색창 */}
      <div className="flex items-center">
        <input
          type="text"
          placeholder="지역 / 카페 이름 검색"
          className="border border-gray-300 placeholder-gray-300 rounded-md px-3 py-2 w-56 
                     focus:outline-none focus:ring-2 focus:ring-blue-400 focus:text-black"
        />
      </div>
    </header>
  );
}
