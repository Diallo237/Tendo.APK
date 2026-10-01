import { useDepotShipments } from '@/services/shipping.service';
import PageContainer from '@/components/shared/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, Store, Bell, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-background rounded-xl border p-5 flex items-center gap-4 w-full text-left hover:shadow-sm transition-shadow"
    >
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </button>
  );
}

export default function DepotManagerDashboard() {
  const navigate = useNavigate();
  const { data: allData, isLoading } = useDepotShipments();
  const shipments = allData?.shipments ?? [];

  const inTransit = shipments.filter((s) => s.status === 'sent_to_depot').length;
  const atDepot = shipments.filter((s) => s.status === 'at_depot').length;
  const notified = shipments.filter((s) => s.status === 'client_notified').length;
  const delivered = shipments.filter((s) => s.status === 'delivered').length;

  const goToShipments = (status: string) =>
    navigate(`/depot-manager/shipments?status=${status}`);

  return (
    <PageContainer title="Tableau de bord" subtitle="Vue d'ensemble de votre dépôt">
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Truck}
            label="En transit"
            value={inTransit}
            color="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40"
            onClick={() => goToShipments('sent_to_depot')}
          />
          <StatCard
            icon={Store}
            label="Au dépôt"
            value={atDepot}
            color="bg-orange-100 text-orange-600 dark:bg-orange-950/40"
            onClick={() => goToShipments('at_depot')}
          />
          <StatCard
            icon={Bell}
            label="Client notifié"
            value={notified}
            color="bg-teal-100 text-teal-600 dark:bg-teal-950/40"
            onClick={() => goToShipments('client_notified')}
          />
          <StatCard
            icon={CheckCircle2}
            label="Récupérés"
            value={delivered}
            color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40"
            onClick={() => goToShipments('delivered')}
          />
        </div>
      )}
    </PageContainer>
  );
}
