import PageContainer from '@/components/shared/page-container';
import { SupplierCharts } from '@/components/shared/supplier-charts';

export default function SupplierStatistics() {
  return (
    <PageContainer
      title="Statistiques"
      subtitle="Visualisez vos performances de vente"
    >
      <SupplierCharts />
    </PageContainer>
  );
}
