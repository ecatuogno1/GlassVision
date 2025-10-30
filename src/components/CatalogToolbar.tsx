import type { GlassCategory, LightTransmission } from '../data/glassPalette';
import type { GlassStatus } from '../types/cms';

interface CatalogToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: GlassCategory | 'all';
  onCategoryChange: (value: GlassCategory | 'all') => void;
  transmissionFilter: LightTransmission | 'all';
  onTransmissionChange: (value: LightTransmission | 'all') => void;
  statusFilter: GlassStatus | 'all';
  onStatusChange: (value: GlassStatus | 'all') => void;
  sortBy: 'name' | 'updatedAt' | 'reflectance';
  onSortChange: (value: 'name' | 'updatedAt' | 'reflectance') => void;
  onCreate: () => void;
}

const CatalogToolbar = ({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  transmissionFilter,
  onTransmissionChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  onCreate
}: CatalogToolbarProps) => {
  return (
    <section className="catalog-toolbar" aria-label="Catalog controls">
      <div className="catalog-toolbar-main">
        <label className="sr-only" htmlFor="catalog-search">
          Search catalog
        </label>
        <input
          id="catalog-search"
          type="search"
          placeholder="Search by name, hue, tag, or collection"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="catalog-toolbar-filters">
        <label>
          Category
          <select value={categoryFilter} onChange={(event) => onCategoryChange(event.target.value as GlassCategory | 'all')}>
            <option value="all">All categories</option>
            <option value="Architectural">Architectural</option>
            <option value="Art">Art</option>
            <option value="Laboratory">Laboratory</option>
            <option value="Automotive">Automotive</option>
            <option value="Decorative">Decorative</option>
          </select>
        </label>
        <label>
          Transmission
          <select
            value={transmissionFilter}
            onChange={(event) => onTransmissionChange(event.target.value as LightTransmission | 'all')}
          >
            <option value="all">All levels</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => onStatusChange(event.target.value as GlassStatus | 'all')}>
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label>
          Sort by
          <select value={sortBy} onChange={(event) => onSortChange(event.target.value as 'name' | 'updatedAt' | 'reflectance')}>
            <option value="updatedAt">Last updated</option>
            <option value="name">Name</option>
            <option value="reflectance">Reflectance</option>
          </select>
        </label>
      </div>

      <button type="button" className="catalog-create" onClick={onCreate}>
        New palette entry
      </button>
    </section>
  );
};

export default CatalogToolbar;
