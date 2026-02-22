import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// 1. 필요한 타입 정의 (기존에 쓰던 타입 그대로 유지)
export type CafeBrand = "STARBUCKS" | "HOLLYS" | "TWOSOME" | "TOMNTOMS" | "COMPOSE" | "ETC";
export type OpenHours = { open: string; close: string };
export type OpenHoursByDay = Record<number, OpenHours | null>;

export type Cafe = {
  id: number; // 고유 ID
  name: string; // 카페 이름
  roadAddress: string; // 도로명 주소
  brand: CafeBrand; // 브랜드
  kakaoPlaceUrl: string; // 카카오 상세정보 URL
  kakaoDirectUrl: string; // 카카오 길찾기 URL
  open24h: boolean; // 24시간 영업 여부
  openHours?: OpenHours | null; // 기본 영업시간
  openHoursByDay?: OpenHoursByDay | null; // 요일별 영업시간
  hasOutlet?: boolean; // 콘센트 유무
  singleSeat?: boolean; // 1인석 유무
  parking?: boolean; // 주차장 유무
  latitude: number; // 위도
  longitude: number; // 경도
};

export type CafeWithOpen = Cafe & {
  todayHoursText: string;
  isOpenNow: boolean;
  statusText: string;
};

// 2. 헬퍼 함수들 (기존 로직 복사)
function toMinutes(hhmm: string): number {
  const [hh, mm] = hhmm.split(":").map((v) => parseInt(v, 10));
  return hh * 60 + mm;
}

function getTodayHours(cafe: Cafe, day: number): OpenHours | null {
  if (cafe.open24h) return null;

  const byDay = cafe.openHoursByDay as OpenHoursByDay | undefined;
  
  // ✅ 수정: 해당 요일이 null이어도 openHours가 있으면 fallback
  if (byDay) {
    const today = byDay[day];
    if (today) return today;
  }

  if (cafe.openHours) return cafe.openHours as OpenHours;

  return null;
}

function computeOpenStatus(cafe: Cafe, now: Date) {
  if (cafe.open24h) {
    return { todayHoursText: "24시간", isOpenNow: true, statusText: "24시간 영업" };
  }

  const day = now.getDay();
  const todayHours = getTodayHours(cafe, day);

  if (!todayHours) {
    return { todayHoursText: "정보 없음", isOpenNow: false, statusText: "영업시간 정보 없음" };
  }

  let nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin = toMinutes(todayHours.open);
  let closeMin = toMinutes(todayHours.close);

  // ✅ 수정: close 시간이 open보다 작으면 (즉, 00시 넘김) → 다음날 시간으로 간주
  if (closeMin <= openMin) {
    closeMin += 1440; // 하루(24시간) 더함
    // now가 자정 이후면 시간도 맞춰야 함
    if (nowMin < openMin) {
      // now가 0시~오픈 전 시간대면 → 다음날로 간주
      nowMin += 1440;
    }
  }

  const isOpenNow = nowMin >= openMin && nowMin < closeMin;

  if (isOpenNow) {
    return {
      todayHoursText: `${todayHours.open} ~ ${todayHours.close}`,
      isOpenNow: true,
      statusText: `영업중 · ${todayHours.close}까지`
    };
  }

  if (nowMin < openMin) {
    return {
      todayHoursText: `${todayHours.open} ~ ${todayHours.close}`,
      isOpenNow: false,
      statusText: `영업종료 · ${todayHours.open} 오픈`
    };
  }

  return {
    todayHoursText: `${todayHours.open} ~ ${todayHours.close}`,
    isOpenNow: false,
    statusText: `영업종료`
  };
}


// 3. 메인 GET 함수
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const swLat = searchParams.get("swLat");
  const swLng = searchParams.get("swLng");
  const neLat = searchParams.get("neLat");
  const neLng = searchParams.get("neLng");

  // 1. 기본 쿼리 시작
  let query = supabase.from("cafes").select("*");

  // 2. 좌표 범위 필터링 (중요!)
  if (swLat && swLng && neLat && neLng) {
    query = query
      .gte("latitude", parseFloat(swLat))
      .lte("latitude", parseFloat(neLat))
      .gte("longitude", parseFloat(swLng))
      .lte("longitude", parseFloat(neLng));
  }

  const { data: result, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = new Date();
  const withOpen = (result || []).map((cafe) => ({
    ...cafe,
    ...computeOpenStatus(cafe, now),
  }));

  return NextResponse.json(withOpen);
}