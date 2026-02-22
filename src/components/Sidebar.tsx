import React from "react";
import Image from "next/image";

// 선택된 브랜드를 변경하기 위한 props를 정의합니다.
interface SidebarProps {
  onSelectBrand: (brandName: string | null) => void;
  selectedBrand: string | null;
}

function Sidebar({ onSelectBrand, selectedBrand }: SidebarProps) {
  const brands = [
    { name: "Hollys", src: "/Hollys.svg" },
    { name: "Starbucks", src: "/Starbucks.svg" },
    { name: "Compose", src: "/Compose.svg" },
  ];

  return (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        padding: "10px",
        borderRight: "1px solid #eee",
      }}
    >
      {/* 전체 보기 버튼 (선택사항) */}
      <button
        onClick={() => onSelectBrand(null)}
        style={{
          cursor: "pointer",
          border: selectedBrand === null ? "2px solid blue" : "none",
        }}
      >
        ALL
      </button>

      {brands.map((brand) => (
        <div
          key={brand.name}
          onClick={() => onSelectBrand(brand.name)}
          style={{
            cursor: "pointer",
            padding: "5px",
            borderRadius: "10px",
            backgroundColor:
              selectedBrand === brand.name ? "#f0f0f0" : "transparent",
            transition: "0.2s",
          }}
        >
          <Image
            src={brand.src}
            alt={`${brand.name} Logo`}
            width={50}
            height={50}
            style={{
              filter:
                selectedBrand === brand.name
                  ? "grayscale(0%)"
                  : "grayscale(100%)",
            }}
          />
        </div>
      ))}
    </aside>
  );
}

export default Sidebar;
