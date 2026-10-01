import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronRight, Check, Tag } from 'lucide-react';
import type { Category } from '@/types/category';

export function getDescendantIds(categoryId: number, categories: Category[]): number[] {
  const children = categories.filter(c => c.parent === categoryId);
  return [categoryId, ...children.flatMap(c => getDescendantIds(c.id, categories))];
}

export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hoveredParent, setHoveredParent] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const parents = categories.filter(c => c.parent === null);
  const childrenOf = (id: number) => categories.filter(c => c.parent === id);

  const label = useMemo(() => {
    if (value === 'all') return 'Catégorie';
    const cat = categories.find(c => c.id === parseInt(value));
    return cat?.name ?? 'Catégorie';
  }, [value, categories]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (v: string) => { onChange(v); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm w-full md:w-[180px] justify-between hover:bg-accent transition-colors"
      >
        <span className="flex items-center gap-1.5 truncate">
          <Tag className="size-3.5 text-muted-foreground shrink-0" />
          <span className={value === 'all' ? 'text-muted-foreground' : ''}>{label}</span>
        </span>
        <ChevronRight className={`size-3.5 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 flex shadow-lg rounded-md border bg-popover text-popover-foreground min-w-[180px]">
          {/* Colonne parents */}
          <div className="py-1 min-w-[160px]">
            <button
              className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-accent rounded-sm mx-0.5 ${value === 'all' ? 'text-primary font-medium' : ''}`}
              onClick={() => select('all')}
            >
              {value === 'all' ? <Check className="size-3.5" /> : <span className="w-3.5" />}
              Toutes
            </button>

            {parents.map(cat => {
              const kids = childrenOf(cat.id);
              const isSelected = value === cat.id.toString();
              return (
                <button
                  key={cat.id}
                  className={`w-full text-left px-3 py-1.5 text-sm flex items-center justify-between gap-2 hover:bg-accent rounded-sm mx-0.5 ${isSelected ? 'text-primary font-medium' : ''} ${hoveredParent === cat.id ? 'bg-accent' : ''}`}
                  onClick={() => select(cat.id.toString())}
                  onMouseEnter={() => setHoveredParent(kids.length > 0 ? cat.id : null)}
                  onMouseLeave={() => setHoveredParent(null)}
                >
                  <span className="flex items-center gap-2">
                    {isSelected ? <Check className="size-3.5 shrink-0" /> : <span className="w-3.5" />}
                    {cat.name}
                  </span>
                  {kids.length > 0 && <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Colonne enfants */}
          {hoveredParent !== null && childrenOf(hoveredParent).length > 0 && (
            <div
              className="py-1 border-l min-w-[160px] bg-popover"
              onMouseEnter={() => setHoveredParent(hoveredParent)}
              onMouseLeave={() => setHoveredParent(null)}
            >
              <p className="px-3 py-1 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {categories.find(c => c.id === hoveredParent)?.name}
              </p>
              {childrenOf(hoveredParent).map(child => {
                const isSelected = value === child.id.toString();
                return (
                  <button
                    key={child.id}
                    className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-accent rounded-sm mx-0.5 ${isSelected ? 'text-primary font-medium' : ''}`}
                    onClick={() => select(child.id.toString())}
                  >
                    {isSelected ? <Check className="size-3.5 shrink-0" /> : <span className="w-3.5" />}
                    {child.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
