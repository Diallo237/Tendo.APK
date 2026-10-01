import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import {
  useRegions,
  useDepartements,
  useCommunes,
  type Localite,
} from '@/services/localisation.service';

interface LocalisationSelectProps {
  onLocationChange: (location: {
    region: Localite | null;
    departement: Localite | null;
    commune: Localite | null;
  }) => void;
  required?: boolean;
  initialRegionId?: number | null;
  initialDepartementId?: number | null;
  initialCommuneId?: number | null;
}

function LocaliteCombobox({
  label,
  placeholder,
  items,
  value,
  onSelect,
  disabled,
  loading,
  required,
}: {
  label: string;
  placeholder: string;
  items: Localite[];
  value: Localite | null;
  onSelect: (item: Localite) => void;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-1.5 min-w-0 overflow-hidden">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className="w-full justify-between font-normal truncate"
          >
            <span className="truncate">
              {loading ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin shrink-0" />
                  Chargement...
                </span>
              ) : value ? (
                value.name
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 overflow-hidden"
          style={{ width: 'var(--radix-popover-trigger-width)', minWidth: '200px', maxWidth: 'calc(100vw - 32px)' }}
          align="start"
          side="bottom"
          avoidCollisions
          collisionPadding={16}
          sideOffset={4}
        >
          <Command>
            <CommandInput
              placeholder="Rechercher..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-[200px] overflow-y-auto">
              <CommandEmpty>Aucun résultat.</CommandEmpty>
              <CommandGroup>
                {filtered.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    onSelect={() => {
                      onSelect(item);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 size-4 shrink-0',
                        value?.id === item.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function LocalisationSelect({
  onLocationChange,
  required,
  initialRegionId,
  initialDepartementId,
  initialCommuneId,
}: LocalisationSelectProps) {
  const [region, setRegion] = useState<Localite | null>(null);
  const [departement, setDepartement] = useState<Localite | null>(null);
  const [commune, setCommune] = useState<Localite | null>(null);

  const { data: regions = [], isLoading: loadingRegions } = useRegions();
  const { data: departements = [], isLoading: loadingDeps } = useDepartements(region?.id ?? null);
  const { data: communes = [], isLoading: loadingCommunes } = useCommunes(departement?.id ?? null);

  // Pré-sélection initiale (une seule fois par série de données chargées)
  const initRegion = useRef(false);
  const initDep = useRef(false);
  const initCommune = useRef(false);

  useEffect(() => {
    if (initialRegionId && regions.length > 0 && !initRegion.current) {
      const found = regions.find((r) => r.id === initialRegionId);
      if (found) { setRegion(found); initRegion.current = true; }
    }
  }, [initialRegionId, regions]);

  useEffect(() => {
    if (initialDepartementId && departements.length > 0 && !initDep.current) {
      const found = departements.find((d) => d.id === initialDepartementId);
      if (found) { setDepartement(found); initDep.current = true; }
    }
  }, [initialDepartementId, departements]);

  useEffect(() => {
    if (initialCommuneId && communes.length > 0 && !initCommune.current) {
      const found = communes.find((c) => c.id === initialCommuneId);
      if (found) { setCommune(found); initCommune.current = true; }
    }
  }, [initialCommuneId, communes]);

  useEffect(() => {
    onLocationChange({ region, departement, commune });
  }, [region, departement, commune]);

  const handleRegionSelect = (r: Localite) => {
    setRegion(r);
    setDepartement(null);
    setCommune(null);
    initDep.current = false;
    initCommune.current = false;
  };

  const handleDepSelect = (d: Localite) => {
    setDepartement(d);
    setCommune(null);
    initCommune.current = false;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
      <LocaliteCombobox
        label="Région"
        placeholder="Sélectionner une région"
        items={regions}
        value={region}
        onSelect={handleRegionSelect}
        loading={loadingRegions}
        required={required}
      />

      <LocaliteCombobox
        label="Département"
        placeholder="Sélectionner un département"
        items={departements}
        value={departement}
        onSelect={handleDepSelect}
        disabled={!region}
        loading={!!region && loadingDeps}
        required={required}
      />

      <LocaliteCombobox
        label="Commune"
        placeholder="Sélectionner une commune"
        items={communes}
        value={commune}
        onSelect={(c) => setCommune(c)}
        disabled={!departement}
        loading={!!departement && loadingCommunes}
        required={required}
      />
    </div>
  );
}
