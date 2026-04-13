import Link from "next/link";

type IntegrationCategoryNavItem = {
  id: string;
  label: string;
  count: number;
};

type IntegrationCategoryNavProps = {
  categories: IntegrationCategoryNavItem[];
};

export function IntegrationCategoryNav({ categories }: IntegrationCategoryNavProps) {
  return (
    <nav aria-label="Integration categories" className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {categories.map((category) => (
        <Link
          key={category.id}
          aria-label={`Jump to ${category.label}`}
          className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-left transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/80"
          href={`#${category.id}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-yellow-200">Jump to category</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{category.label}</h3>
            </div>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
              {category.count}
            </span>
          </div>
        </Link>
      ))}
    </nav>
  );
}