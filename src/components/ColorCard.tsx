import type { GlassColor } from '../data/glassPalette';

interface ColorCardProps {
  color: GlassColor;
  isSelected: boolean;
  onSelect: () => void;
}

const ColorCard = ({ color, isSelected, onSelect }: ColorCardProps) => {
  return (
    <button
      type="button"
      className={`color-card${isSelected ? ' selected' : ''}`}
      onClick={onSelect}
      aria-pressed={isSelected}
    >
      <div className="color-swatch" style={{ backgroundColor: color.hex }} aria-hidden="true" />
      <div className="color-content">
        <header>
          <h3>{color.name}</h3>
          <span className="color-hex">{color.hex}</span>
        </header>
        <dl>
          <div>
            <dt>Hue</dt>
            <dd>{color.hueGroup}</dd>
          </div>
          <div>
            <dt>Transmission</dt>
            <dd>{color.lightTransmission}</dd>
          </div>
          <div>
            <dt>Reflectance</dt>
            <dd>{color.reflectance}%</dd>
          </div>
        </dl>
      </div>
    </button>
  );
};

export default ColorCard;
