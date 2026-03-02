import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// 1. 타입 정의
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
  parking?: boolean;
  latitude: number;
  longitude: number;
};

// 2. 헬퍼 함수
function toMinutes(hhmm: string): number {
  const [hh, mm] = hhmm.split(":").map((v) => parseInt(v, 10));
  return hh * 60 + mm;
}

function getTodayHours(cafe: Cafe, day: number): OpenHours | null {
  if (cafe.open24h) return null;
  const byDay = cafe.openHoursByDay as OpenHoursByDay | undefined;
  if (byDay && byDay[day]) return byDay[day];
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

  if (closeMin <= openMin) {
    closeMin += 1440;
    if (nowMin < openMin) nowMin += 1440;
  }

  const isOpenNow = nowMin >= openMin && nowMin < closeMin;

  if (isOpenNow) {
    return {
      todayHoursText: `${todayHours.open} ~ ${todayHours.close}`,
      isOpenNow: true,
      statusText: `영업중 · ${todayHours.close}까지`
    };
  }

  return {
    todayHoursText: `${todayHours.open} ~ ${todayHours.close}`,
    isOpenNow: false,
    statusText: nowMin < openMin ? `영업종료 · ${todayHours.open} 오픈` : `영업종료`
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const swLat = searchParams.get("swLat");
  const swLng = searchParams.get("swLng");
  const neLat = searchParams.get("neLat");
  const neLng = searchParams.get("neLng");
  const filters = searchParams.get("filters")?.split(",") || [];

  let query = supabase.from("cafes").select("*");

  if (swLat && swLng && neLat && neLng) {
    query = query
      .gte("latitude", parseFloat(swLat))
      .lte("latitude", parseFloat(neLat))
      .gte("longitude", parseFloat(swLng))
      .lte("longitude", parseFloat(neLng));
  }

  const brandList: CafeBrand[] = ["STARBUCKS", "HOLLYS", "TWOSOME", "TOMNTOMS", "COMPOSE", "ETC"];
  const selectedBrands = filters.filter((f) => brandList.includes(f as CafeBrand));

  if (selectedBrands.length > 0) {
    query = query.in("brand", selectedBrands);
  }

  if (filters.includes("open24h")) query = query.eq("open24h", true);
  if (filters.includes("outlets")) query = query.eq("hasOutlet", true);
  if (filters.includes("parking")) query = query.eq("parking", true);
  if (filters.includes("singleSeat")) query = query.eq("singleSeat", true);

  const { data: result, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = new Date();
  
  let withOpen = (result || []).map((cafe) => ({
    ...cafe,
    ...computeOpenStatus(cafe, now),
  }));
  if (filters.includes("openNow")) {
    withOpen = withOpen.filter((cafe) => cafe.isOpenNow);
  }

  return NextResponse.json(withOpen);
}