import Map from "@/components/Map";

export default async function Home() {
  const res = await fetch("http://localhost:3000/api/cafes", {
    cache: "no-store", 
  });

  const cafes = await res.json();

  return (
    <main>
      <h1>스터디 카페 지도</h1>
      <Map cafes={cafes} />
    </main>
  );
}
