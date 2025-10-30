import type { Dispatch, SetStateAction } from 'react';
import type { GlassCategory, LightTransmission } from '../data/glassPalette';

interface FilterToolbarProps {
  searchTerm: string;
  onSearchChange: Dispatch<SetStateAction<string>>;
  categories: (GlassCategory | 'all')[];
  categoryFilter: GlassCategory | 'all';
  onCategoryChange: Dispatch<SetStateAction<GlassCategory | 'all'>>;
  transmissions: (LightTransmission | 'all')[];
  transmissionFilter: LightTransmission | 'all';
  onTransmissionChange: Dispatch<SetStateAction<LightTransmission | 'all'>>;
  sortBy: 'name' | 'reflectance';
  onSortChange: Dispatch<SetStateAction<'name' | 'reflectance'>>;
}

const FilterToolbar = ({
  searchTerm,
  onSearchChange,
  categories,
  categoryFilter,
  onCategoryChange,
  transmissions,
  transmissionFilter,
  onTransmissionChange,
  sortBy,
  onSortChange
}: FilterToolbarProps) => {
  return (
    <section className="filter-toolbar" aria-label="Filter glass colors">
      <div className="filter-group search">
        <label htmlFor="search" className="sr-only">
          Search glass colors
        </label>
        <input
          id="search"
          type="search"
          value={searchTerm}
          placeholder="Search by name, tone, or tag..."
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={categoryFilter}
          onChange={(event) => onCategoryChange(event.target.value as GlassCategory | 'all')}
        >
          {categories.map((categoryOption) => (
            <option key={categoryOption} value={categoryOption}>
              {categoryOption === 'all' ? 'All uses' : categoryOption}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="transmission">Light transmission</label>
        <select
          id="transmission"
          value={transmissionFilter}
          onChange={(event) => onTransmissionChange(event.target.value as LightTransmission | 'all')}
        >
          {transmissions.map((transmissionOption) => (
            <option key={transmissionOption} value={transmissionOption}>
              {transmissionOption === 'all'
                ? 'All levels'
                : transmissionOption.replace(/^(\w)/, (letter) => letter.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="sort">Sort by</label>
        <select
          id="sort"
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value as 'name' | 'reflectance')}
        >
          <option value="name">Name</option>
          <option value="reflectance">Reflectance</option>
        </select>
      </div>
    </section>
  );
};

export default FilterToolbar;
