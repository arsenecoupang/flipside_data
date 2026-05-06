// src/components/layout/Header.tsx
import { DiscAlbum, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export function Header() {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
      <div className="flex h-14 items-center px-6 gap-4">
        <div className="flex items-center gap-2 font-bold text-lg text-indigo-600">
          <DiscAlbum className="w-5 h-5" />
          Flipside
        </div>
        <span className="text-xs text-muted-foreground ml-1">LP 재판매 대시보드</span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            새로고침
          </Button>
        </div>
      </div>
    </header>
  );
}
