import { useAxiosGet } from '@/hooks/use-api';
import { buildApiUrl } from '@/utils/api-client';

export type StatsPeriod = 'day' | 'week' | 'month';

export interface StatsTimeline {
  label: string;
  orders: number;
  revenue: number;
}

export interface StatsTopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export interface SupplierStats {
  period: StatsPeriod;
  timeline: StatsTimeline[];
  top_products: StatsTopProduct[];
  summary: {
    total_orders: number;
    total_revenue: number;
    active_products: number;
  };
  returns_summary: ReturnsSummary;
  returns_timeline: ReturnsTimelineEntry[];
}

export interface ReturnsSummary {
  /** Retours automatiques : délai de garde dépassé (>7j) */
  delay: number;
  /** Retours décidés par le gérant (client non satisfait, etc.) */
  client: number;
  total: number;
}

export interface ReturnsTimelineEntry {
  label: string;
  client: number;
  delay: number;
}

export interface AdminMonthlyEntry {
  month: string;
  label: string;
  orders: number;
  delivered: number;
  revenue: number;
}

export interface AdminStats {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  delivered_count: number;
  cancelled_count: number;
  orders_by_status: { status: string; count: number }[];
  orders_by_payment: { payment_timing: string; count: number }[];
  monthly: AdminMonthlyEntry[];
  returns_summary: ReturnsSummary;
  returns_timeline: ReturnsTimelineEntry[];
}

export function useAdminStats() {
  return useAxiosGet<AdminStats>(
    ['admin-stats'] as const,
    buildApiUrl('/analytics/admin/stats/'),
  );
}

export function useSupplierStats(period: StatsPeriod = 'month', supplierId?: number | null) {
  const params: Record<string, string> = { period };
  if (supplierId) params.supplier_id = String(supplierId);

  return useAxiosGet<SupplierStats>(
    ['supplier-stats', period, supplierId ?? 'me'] as const,
    buildApiUrl('/analytics/supplier/stats/'),
    { params },
  );
}
