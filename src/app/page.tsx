// app/page.tsx
import Map from "@/components/Map";
import Header from "@/components/Header";

type Cafe = {
  id: number;
  name: string;
  roadAddress: string;
  lat?: number;
  lng?: number;
};

export default async function Home() {
  const res = await fetch("http://localhost:3000/api/cafes", {
    cache: "no-store",
  });

  const cafes: Cafe[] = await res.json();

  return (
    <main>
      <Header />
      <Map cafes={cafes} />
    </main>
  );
}
