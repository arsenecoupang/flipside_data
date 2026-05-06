// src/components/cards/StatCard.tsx
import { TrendingDown, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Trend {
  value: number;   // 양수: 상승, 음수: 하락
  label?: string;
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: Trend;
  icon?: React.ReactNode;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  loading,
  error,
  onRetry,
}: StatCardProps) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          {title}
        </span>
        {icon && (
          <div
            className="rounded-lg p-1.5"
            style={{ background: "var(--bg-sub)", color: "var(--primary)" }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* 값 */}
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" style={{ background: "var(--bg-sub)" }} />
          <Skeleton className="h-4 w-20" style={{ background: "var(--bg-sub)" }} />
        </div>
      ) : error ? (
        <div className="space-y-1">
          <p className="text-sm" style={{ color: "var(--danger)" }}>로드 실패</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs underline"
              style={{ color: "var(--text-2)" }}
            >
              재시도
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>
            {value}
          </p>

          <div className="flex items-center gap-2">
            {subtitle && (
              <span className="text-xs" style={{ color: "var(--text-2)" }}>
                {subtitle}
              </span>
            )}
            {trend != null && (
              <span
                className="flex items-center gap-0.5 text-xs font-semibold"
                style={{ color: trend.value >= 0 ? "var(--positive)" : "var(--danger)" }}
              >
                {trend.value >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {trend.value >= 0 ? "+" : ""}
                {trend.value.toFixed(1)}%
                {trend.label && (
                  <span style={{ color: "var(--text-muted)" }} className="font-normal ml-0.5">
                    {trend.label}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
