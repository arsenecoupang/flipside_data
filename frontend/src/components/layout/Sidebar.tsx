// src/components/layout/Sidebar.tsx
import { BarChart3, Home, Search, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  page: "dashboard" | "artist";
}

const navItems: NavItem[] = [
  { label: "대시보드", icon: <Home className="w-4 h-4" />, page: "dashboard" },
  { label: "가격 분석", icon: <TrendingUp className="w-4 h-4" />, page: "dashboard" },
  { label: "아티스트 검색", icon: <Search className="w-4 h-4" />, page: "artist" },
  { label: "차트", icon: <BarChart3 className="w-4 h-4" />, page: "dashboard" },
];

interface SidebarProps {
  activePage: "dashboard" | "artist";
  onNavigate: (page: "dashboard" | "artist") => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-52 shrink-0 border-r bg-gray-50/50 min-h-[calc(100vh-3.5rem)]">
      <nav className="flex flex-col gap-1 p-3 pt-4">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.page)}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors text-left",
              activePage === item.page
                ? "bg-indigo-50 text-indigo-700"
                : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
