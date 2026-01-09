import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// 1. 필요한 타입 정의 (기존에 쓰던 타입 그대로 유지)
export type CafeBrand = "STARBUCKS" | "HOLLYS" | "TWOSOME" | "TOMNTOMS" | "COMPOSE" | "ETC";
export type OpenHours = { open: string; close: string };
export type OpenHoursByDay = Record<number, OpenHours | null>;

export type Cafe = {
  id: number;
  name: string;
  roadAddress: string;
  brand: CafeBrand;
  kakaoPlaceUrl: string;
  kakaoDirectUrl: string;
  open24h: boolean;
  openHours?: OpenHours | null;
  openHoursByDay?: OpenHoursByDay | null;
  hasOutlet?: boolean;
  singleSeat?: boolean;
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
  // Supabase에서 올 때 타입 처리를 위해 캐스팅
  const byDay = cafe.openHoursByDay as OpenHoursByDay | undefined;
  if (byDay && byDay[day] !== undefined) return byDay[day];
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

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin = toMinutes(todayHours.open);
  const closeMin = toMinutes(todayHours.close);
  const isOpenNow = nowMin >= openMin && nowMin < closeMin;

  if (isOpenNow) {
    return { todayHoursText: `${todayHours.open} ~ ${todayHours.close}`, isOpenNow: true, statusText: `영업중 · ${todayHours.close}까지` };
  }
  if (nowMin < openMin) {
    return { todayHoursText: `${todayHours.open} ~ ${todayHours.close}`, isOpenNow: false, statusText: `영업종료 · ${todayHours.open} 오픈` };
  }
  return { todayHoursText: `${todayHours.open} ~ ${todayHours.close}`, isOpenNow: false, statusText: `영업종료` };
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