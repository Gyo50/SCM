import { NextResponse } from "next/server";

export async function GET() {
  const cafes = [
    {
      id: 1,
      name: "카페 A",
      lat: 37.12345,
      lng: 127.12345,
      hasWifi: true,
      hasOutlet: true,
      noiseLevel: "quiet",
      address: "서울시 강남구 어디",
    },
  ];

  return NextResponse.json(cafes);
}
