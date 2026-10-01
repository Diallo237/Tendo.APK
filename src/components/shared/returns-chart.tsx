import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { RotateCcw, Clock, UserX } from 'lucide-react';
import type { ReturnsSummary, ReturnsTimelineEntry } from '@/services/stats.service';

// Retour client (décision du gérant) vs délai de garde dépassé (>7j, automatique)
const COLOR_CLIENT = '#ef4444'; // rouge
const COLOR_DELAY = '#f59e0b';  // ambre

function ReturnsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background shadow-md px-3 py-2 text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name} : {p.value}
        </p>
      ))}
    </div>
  );
}

interface ReturnsChartProps {
  summary?: ReturnsSummary;
  timeline?: ReturnsTimelineEntry[];
  isLoading?: boolean;
  height?: number;
}

export function ReturnsChart({ summary, timeline = [], isLoading = false, height = 220 }: ReturnsChartProps) {
  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className="grid grid-cols-3 gap-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))
        ) : (
          <>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <RotateCcw className="size-4 mx-auto text-muted-foreground mb-1" />
              <p className="font-bold tabular-nums text-2xl">{summary?.total ?? 0}</p>
              <p className="text-xs text-muted-foreground">Retours au total</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <UserX className="size-4 mx-auto mb-1" style={{ color: COLOR_CLIENT }} />
              <p className="font-bold tabular-nums text-2xl">{summary?.client ?? 0}</p>
              <p className="text-xs text-muted-foreground">Retours client</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <Clock className="size-4 mx-auto mb-1" style={{ color: COLOR_DELAY }} />
              <p className="font-bold tabular-nums text-2xl">{summary?.delay ?? 0}</p>
              <p className="text-xs text-muted-foreground">Délai dépassé (7j)</p>
            </div>
          </>
        )}
      </div>

      {/* Graphique empilé */}
      {isLoading ? (
        <Skeleton className="w-full rounded-lg" style={{ height }} />
      ) : timeline.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border bg-muted/20 text-xs text-muted-foreground" style={{ height }}>
          Aucun retour sur la période
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={timeline} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<ReturnsTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="client" stackId="r" name="Retour client" fill={COLOR_CLIENT} radius={[0, 0, 0, 0]} maxBarSize={40} />
            <Bar dataKey="delay" stackId="r" name="Délai dépassé" fill={COLOR_DELAY} radius={[3, 3, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
