// src/App.tsx
import { useState } from "react";
import { DashboardPage } from "@/pages/DashboardPage";
import { ArtistPage } from "@/pages/ArtistPage";

type Page = "dashboard" | "artist";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [artist, setArtist] = useState<string>("");

  const goToArtist = (name: string) => {
    setArtist(name);
    setPage("artist");
  };

  return page === "dashboard" ? (
    <DashboardPage onArtistClick={goToArtist} />
  ) : (
    <ArtistPage artistName={artist} onBack={() => setPage("dashboard")} />
  );
}
