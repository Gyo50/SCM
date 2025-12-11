// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "SCM - Study Cafe Map",
  description: "공부하기 좋은 스터디 카페 지도",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {/* ✅ 카카오 지도 SDK 로드 
            - autoload=false : 우리가 load 타이밍 제어
            - libraries=services : Geocoder(주소→좌표) 사용하려고 추가 */}
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services`}
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
