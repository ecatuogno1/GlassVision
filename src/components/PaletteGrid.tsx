import ColorCard from './ColorCard';
import type { GlassColor } from '../data/glassPalette';

interface PaletteGridProps {
  colors: GlassColor[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const PaletteGrid = ({ colors, selectedId, onSelect }: PaletteGridProps) => {
  if (colors.length === 0) {
    return (
      <div className="empty-state">
        <h2>No matches found</h2>
        <p>Try adjusting your filters to discover more glass colors.</p>
      </div>
    );
  }

  return (
    <ul className="palette-grid">
      {colors.map((color) => (
        <li key={color.id}>
          <ColorCard
            color={color}
            isSelected={color.id === selectedId}
            onSelect={() => onSelect(color.id)}
          />
        </li>
      ))}
    </ul>
  );
};

export default PaletteGrid;
