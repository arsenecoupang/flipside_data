// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DashboardPage } from "@/pages/DashboardPage";
import { ArtistPage } from "@/pages/ArtistPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 9 * 60 * 1000,  // 9분
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div
          style={{ minHeight: "100vh", background: "var(--bg-root)", color: "var(--text-1)" }}
        >
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            {/* /artist  → 검색 유도 상태 */}
            <Route path="/artist" element={<ArtistPage />} />
            {/* /artist/:artistName → 검색 결과 */}
            <Route path="/artist/:artistName" element={<ArtistPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
