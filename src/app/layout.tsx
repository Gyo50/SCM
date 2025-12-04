import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "SCM",
  description: "Study Cafe Map",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {/* 카카오 지도 SDK 로드 (autoload=false로 두고 나중에 load 콜백 사용) */}
<Script
  src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services`}
  strategy="beforeInteractive"
/>

        {children}
      </body>
    </html>
  );
}
