import { Header } from '@/app/components/Header';
import { PropertyListingPage } from '@/app/components/PropertyListingPage';
import type { HeroSearchParams } from '@/lib/searchFilters';

interface BuyPropertiesPageProps {
  onNavigate?: (page: 'home' | 'buy' | 'rent') => void;
  selectedWard?: string | null;
  onSelectProperty?: (id: number) => void;
  initialSearchParams?: HeroSearchParams;
}

export function BuyPropertiesPage({ onNavigate, selectedWard, onSelectProperty, initialSearchParams }: BuyPropertiesPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} currentPage="buy" />
      <PropertyListingPage
        selectedWard={selectedWard}
        onSelectProperty={onSelectProperty}
        initialSearchParams={initialSearchParams?.propertyType === 'buy' ? initialSearchParams : undefined}
      />
    </div>
  );
}