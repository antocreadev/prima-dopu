/** @jsxImportSource react */
import { useAuth } from "@clerk/astro/react";

interface CreditsBadgeProps {
  used: number;
  limit: number;
  planName: string;
}

export function CreditsBadge({ used, limit, planName }: CreditsBadgeProps) {
  const remaining = Math.max(0, limit - used);
  const percentage = Math.min(100, (used / limit) * 100);

  const getColorClass = () => {
    if (percentage >= 100) return "bg-red-100 text-red-700 border-red-200";
    if (percentage >= 80)
      return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-green-100 text-green-700 border-green-200";
  };

  const getProgressColor = () => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-orange-500";
    return "bg-green-500";
  };

  return (
    <div className={`rounded-lg border p-3 ${getColorClass()}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Plan {planName}</span>
        <span className="text-sm font-bold">{remaining} restantes</span>
      </div>
      <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getProgressColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs mt-1 opacity-75">
        {used} / {limit} générations
      </div>
    </div>
  );
}

export function CreditsIndicator({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  const remaining = Math.max(0, limit - used);
  const isLow = remaining <= 2;
  const isEmpty = remaining === 0;

  if (isEmpty) {
    return (
      <a
        href="/no-credits"
        className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        0 crédit
      </a>
    );
  }

  return (
    <a
      href="/pricing"
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        isLow
          ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.328.996.002 1.069c0 .527.213 1.028.589 1.4a5.965 5.965 0 012.135 1.178A5.993 5.993 0 0115 12c1.326 0 2.556-.43 3.553-1.158l.392-.168a1 1 0 000-1.84l-7-3zM6 12.688a6.025 6.025 0 01-1-.588V14a1 1 0 001 1h8a1 1 0 001-1v-1.9a6.025 6.025 0 01-1 .588V14H6v-1.312z" />
      </svg>
      {remaining} crédit{remaining > 1 ? "s" : ""}
    </a>
  );
}
