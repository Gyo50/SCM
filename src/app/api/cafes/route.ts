import { NextResponse } from "next/server";

export async function GET() {
  const cafes = [
    {
      "id": 1,
      "name": "스터디카페 A",
      "roadAddress": "서울특별시 마포구 양화로 66"
    }
  ];

  return NextResponse.json(cafes);
}
