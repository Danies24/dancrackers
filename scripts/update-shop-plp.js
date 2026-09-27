const fs = require('fs');
const file = 'components/shop/shop-plp-client.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Import ArrowUpDown
content = content.replace('import { LayoutGrid, List as ListIcon } from "lucide-react";', 'import { LayoutGrid, List as ListIcon, ArrowDownUp } from "lucide-react";');

// 2. Add sortOrder state and sortedSections
const stateStr = `  const [viewMode, setViewMode] = useState<"grid" | "list">("list");`;
const sortStateStr = `  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);

  const sortedSections = useMemo(() => {
    if (!sortOrder) return sections;
    return sections.map(s => {
      if (s.kind === "combos") return s;
      const sortedProducts = [...s.products].sort((a, b) => {
        const pA = a.price ?? 0;
        const pB = b.price ?? 0;
        return sortOrder === "asc" ? pA - pB : pB - pA;
      });
      return { ...s, products: sortedProducts };
    });
  }, [sections, sortOrder]);
`;
content = content.replace(stateStr, sortStateStr);

// 3. Replace all usage of `sections` with `sortedSections` in the render logic (except the initial productsBySlug etc.)
content = content.replace(/const categorySections = sections/g, 'const categorySections = sortedSections');
content = content.replace(/const allAnchorIds = useMemo\(\(\) => sections/g, 'const allAnchorIds = useMemo(() => sortedSections');
content = content.replace(/const menuSections: ShopMenuSection\[\] = sections/g, 'const menuSections: ShopMenuSection[] = sortedSections');
content = content.replace(/\{sections\.map\(\(section\) => \{/g, '{sortedSections.map((section) => {');

// 4. Move ViewModeToggle up and rename it to ViewAndSortToolbar
const renderProductsEnd = `    );
  }

  return (
    <div className="pb-24">`;
content = content.replace(renderProductsEnd, renderProductsEnd.replace('<div className="pb-24">', `<div className="pb-24">`));

const viewToggleOld = `{categorySections.length > 0 && (
          <div className="flex justify-end">
            <ViewModeToggle mode={viewMode} onChange={handleViewModeChange} />
          </div>
        )}`;
content = content.replace(viewToggleOld, '');

// Put it above sections.map
const mapStart = `{sortedSections.map((section) => {`;
const mapStartWithToolbar = `<div className="mb-4 flex justify-end pr-4">
          <ViewAndSortToolbar mode={viewMode} onModeChange={handleViewModeChange} sort={sortOrder} onSortChange={setSortOrder} />
        </div>
        {sortedSections.map((section) => {`;
content = content.replace(mapStart, mapStartWithToolbar);

// 5. Replace ViewModeToggle component
const oldComponent = `function ViewModeToggle({ mode, onChange }: { mode: "grid" | "list"; onChange: (mode: "grid" | "list") => void }) {
  return (
    <div className="flex items-center overflow-hidden rounded-md border border-border bg-surface">
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        aria-pressed={mode === "grid"}
        className={\`p-1.5 transition-colors \${mode === "grid" ? "bg-maroon-tint text-maroon-ink" : "text-muted"}\`}
      >
        <LayoutGrid size={16} />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-label="List view"
        aria-pressed={mode === "list"}
        className={\`border-l border-border p-1.5 transition-colors \${mode === "list" ? "bg-maroon-tint text-maroon-ink" : "text-muted"}\`}
      >
        <ListIcon size={16} />
      </button>
    </div>
  );
}`;
const newComponent = `function ViewAndSortToolbar({
  mode,
  onModeChange,
  sort,
  onSortChange,
}: {
  mode: "grid" | "list";
  onModeChange: (mode: "grid" | "list") => void;
  sort: "asc" | "desc" | null;
  onSortChange: (sort: "asc" | "desc" | null) => void;
}) {
  return (
    <div className="flex items-center overflow-hidden rounded-md border border-border bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => onModeChange("grid")}
        aria-label="Grid view"
        className={\`p-2 transition-colors \${mode === "grid" ? "bg-maroon-tint text-maroon-ink" : "text-ink-soft hover:bg-secondary-bg"}\`}
      >
        <LayoutGrid size={16} />
      </button>
      <button
        type="button"
        onClick={() => onModeChange("list")}
        aria-label="List view"
        className={\`border-l border-border p-2 transition-colors \${mode === "list" ? "bg-maroon-tint text-maroon-ink" : "text-ink-soft hover:bg-secondary-bg"}\`}
      >
        <ListIcon size={16} />
      </button>
      <div className={\`relative flex items-center border-l border-border p-2 transition-colors \${sort ? "bg-maroon-tint text-maroon-ink" : "text-ink-soft hover:bg-secondary-bg"}\`}>
        <ArrowDownUp size={16} />
        <select
          aria-label="Sort products"
          value={sort || ""}
          onChange={(e) => onSortChange(e.target.value ? (e.target.value as "asc" | "desc") : null)}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        >
          <option value="">Sort (Default)</option>
          <option value="asc">Price: Low to High</option>
          <option value="desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
}`;

content = content.replace(oldComponent, newComponent);

fs.writeFileSync(file, content, 'utf8');
