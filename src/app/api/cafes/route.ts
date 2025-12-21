// src/app/api/cafes/route.ts
import { NextResponse } from "next/server";

type CafeBrand =
  | "STARBUCKS"
  | "HOLLYS"
  | "TWOSOME"
  | "TOMNTOMS"
  | "COMPOSE"
  | "ETC";

type OpenHours = { open: string; close: string };
type OpenHoursByDay = Record<number, OpenHours | null>;

export type Cafe = {
  id: number;
  name: string;
  roadAddress: string;

  brand: CafeBrand;

  kakaoPlaceUrl: string;
  kakaoDirectUrl: string;

  open24h: boolean;
  openHours?: OpenHours | null;
  openHoursByDay?: OpenHoursByDay;

  hasOutlet?: boolean;
  singleSeat?: boolean;
};

export type CafeWithOpen = Cafe & {
  todayHoursText: string; // "07:00 ~ 22:00" / "24시간" / "영업시간 정보 없음"
  isOpenNow: boolean;
  statusText: string; // "영업중 · 22:00까지" / "영업종료 · 내일 07:00 오픈" ...
};

// ✅ 샘플 데이터 (네 구조대로: brand만 추가)
const DATA: Cafe[] = [
  {
    id: 1,
    name: "컴포즈커피",
    roadAddress: "서울특별시 강서구 양천로 431 (가양동)",
    brand: "COMPOSE",
    kakaoPlaceUrl: "https://place.map.kakao.com/1987953441",
    kakaoDirectUrl: "https://kko.to/OUTKLbanpr",

    open24h: false,
    openHoursByDay: {
      0: { open: "09:00", close: "21:00" },
      1: { open: "07:00", close: "22:00" },
      2: { open: "07:00", close: "22:00" },
      3: { open: "07:00", close: "22:00" },
      4: { open: "07:00", close: "22:00" },
      5: { open: "07:00", close: "22:00" },
      6: { open: "08:00", close: "22:00" },
    },
  },
  {
    id: 2,
    name: "그라나다카페",
    roadAddress:
      "서울특별시 강서구 허준로5길 37, A동 (가양동,(지상 1층))",
    brand: "ETC",
    kakaoPlaceUrl: "https://place.map.kakao.com/12578863",
    kakaoDirectUrl: "https://kko.to/RlMeUdroBE",

    open24h: true,
    openHours: null,
  },
  {
    id: 3,
    name: "역삼아레나빌딩",
    roadAddress: "서울특별시 강남구 언주로 425 (역삼동)",
    brand: "HOLLYS",
    kakaoPlaceUrl: "https://kko.to/BwEgF9l_z3",
    kakaoDirectUrl: "https://kko.to/uK5EcxBt1g",

    open24h: false,
    openHours: { open: "07:00", close: "22:00" },
  },
];

// "HH:MM" -> minutes
function toMinutes(hhmm: string): number {
  const [hh, mm] = hhmm.split(":").map((v) => parseInt(v, 10));
  return hh * 60 + mm;
}

function getTodayHours(cafe: Cafe, day: number): OpenHours | null {
  if (cafe.open24h) return null;

  if (cafe.openHoursByDay && cafe.openHoursByDay[day] !== undefined) {
    return cafe.openHoursByDay[day];
  }
  if (cafe.openHours) return cafe.openHours;

  return null;
}

function computeOpenStatus(
  cafe: Cafe,
  now: Date
): Pick<CafeWithOpen, "todayHoursText" | "isOpenNow" | "statusText"> {
  if (cafe.open24h) {
    return {
      todayHoursText: "24시간",
      isOpenNow: true,
      statusText: "24시간 영업",
    };
  }

  const day = now.getDay(); // 0(일)~6(토)
  const todayHours = getTodayHours(cafe, day);

  if (!todayHours) {
    return {
      todayHoursText: "영업시간 정보 없음",
      isOpenNow: false,
      statusText: "영업시간 정보 없음",
    };
  }

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin = toMinutes(todayHours.open);
  const closeMin = toMinutes(todayHours.close);

  // MVP: 자정 넘김 영업은 아직 미지원
  const isOpenNow = nowMin >= openMin && nowMin < closeMin;

  if (isOpenNow) {
    return {
      todayHoursText: `${todayHours.open} ~ ${todayHours.close}`,
      isOpenNow: true,
      statusText: `영업중 · ${todayHours.close}까지`,
    };
  }

  // 오픈 전
  if (nowMin < openMin) {
    return {
      todayHoursText: `${todayHours.open} ~ ${todayHours.close}`,
      isOpenNow: false,
      statusText: `영업종료 · ${todayHours.open} 오픈`,
    };
  }

  // 마감 후 → 내일 오픈
  const tomorrow = (day + 1) % 7;
  const tomorrowHours = getTodayHours(cafe, tomorrow);

  if (tomorrowHours) {
    return {
      todayHoursText: `${todayHours.open} ~ ${todayHours.close}`,
      isOpenNow: false,
      statusText: `영업종료 · 내일 ${tomorrowHours.open} 오픈`,
    };
  }

  return {
    todayHoursText: `${todayHours.open} ~ ${todayHours.close}`,
    isOpenNow: false,
    statusText: `영업종료`,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  let result = [...DATA];

  if (q) {
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.roadAddress.toLowerCase().includes(q)
    );
  }

  const now = new Date();

  const withOpen: CafeWithOpen[] = result.map((cafe) => ({
    ...cafe,
    ...computeOpenStatus(cafe, now),
  }));

  return NextResponse.json(withOpen);
}
