import { useMemo, useState } from 'react';
import { glassPalette, GlassCategory, GlassColor, LightTransmission } from './data/glassPalette';
import FilterToolbar from './components/FilterToolbar';
import PaletteGrid from './components/PaletteGrid';
import ColorDetail from './components/ColorDetail';
import StatsSummary from './components/StatsSummary';
import './styles/app.css';

const categories: (GlassCategory | 'all')[] = ['all', 'Architectural', 'Art', 'Laboratory', 'Automotive', 'Decorative'];
const transmissions: (LightTransmission | 'all')[] = ['all', 'high', 'medium', 'low'];

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<GlassCategory | 'all'>('all');
  const [transmissionFilter, setTransmissionFilter] = useState<LightTransmission | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'reflectance'>('name');
  const [selectedId, setSelectedId] = useState<string | null>(glassPalette[0]?.id ?? null);

  const filteredPalette = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return glassPalette
      .filter((color) => {
        const matchesSearch =
          !normalizedQuery ||
          color.name.toLowerCase().includes(normalizedQuery) ||
          color.hueGroup.toLowerCase().includes(normalizedQuery) ||
          color.tags.some((tag) => tag.includes(normalizedQuery));

        const matchesCategory = categoryFilter === 'all' || color.category === categoryFilter;
        const matchesTransmission =
          transmissionFilter === 'all' || color.lightTransmission === transmissionFilter;

        return matchesSearch && matchesCategory && matchesTransmission;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return a.reflectance - b.reflectance;
      });
  }, [searchTerm, categoryFilter, transmissionFilter, sortBy]);

  const selectedColor: GlassColor | undefined = useMemo(
    () => glassPalette.find((color) => color.id === selectedId),
    [selectedId]
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>GlassVision Studio</h1>
          <p>
            Explore architectural and specialty glass tones, compare performance metrics, and curate
            palettes tailored for your next project.
          </p>
        </div>
        <StatsSummary data={glassPalette} />
      </header>

      <FilterToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categories={categories}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        transmissions={transmissions}
        transmissionFilter={transmissionFilter}
        onTransmissionChange={setTransmissionFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <main className="app-content">
        <section className="palette-section">
          <PaletteGrid
            colors={filteredPalette}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
          />
        </section>

        <aside className="detail-section">
          {selectedColor ? (
            <ColorDetail color={selectedColor} related={filteredPalette} onSelect={setSelectedId} />
          ) : (
            <div className="detail-empty">Select a glass color to learn more about its profile.</div>
          )}
        </aside>
      </main>
    </div>
  );
}

export default App;
