import type { Dispatch, SetStateAction } from 'react';
import type { GlassColor } from '../data/glassPalette';

interface ColorDetailProps {
  color: GlassColor;
  related: GlassColor[];
  onSelect: Dispatch<SetStateAction<string | null>>;
}

const formatTransmission = (value: GlassColor['lightTransmission']) => {
  switch (value) {
    case 'high':
      return 'High (65% and above)';
    case 'medium':
      return 'Medium (35-65%)';
    case 'low':
    default:
      return 'Low (below 35%)';
  }
};

const ColorDetail = ({ color, related, onSelect }: ColorDetailProps) => {
  const neighboring = related.filter((candidate) => candidate.id !== color.id).slice(0, 3);

  return (
    <article className="color-detail" aria-live="polite">
      <header className="detail-header" style={{ borderColor: color.hex }}>
        <div className="detail-swatch" style={{ backgroundColor: color.hex }} aria-hidden="true" />
        <div>
          <h2>{color.name}</h2>
          <p>{color.description}</p>
        </div>
      </header>

      <section className="detail-grid">
        <div>
          <h3>Optical properties</h3>
          <ul>
            <li>
              <span>Hue family</span>
              <strong>{color.hueGroup}</strong>
            </li>
            <li>
              <span>Light transmission</span>
              <strong>{formatTransmission(color.lightTransmission)}</strong>
            </li>
            <li>
              <span>Visible reflectance</span>
              <strong>{color.reflectance}%</strong>
            </li>
            <li>
              <span>Dominant element</span>
              <strong>{color.dominantElement}</strong>
            </li>
          </ul>
        </div>
        <div>
          <h3>Application highlights</h3>
          <ul className="detail-list">
            {color.applications.map((application) => (
              <li key={application}>{application}</li>
            ))}
          </ul>
          <div className="tag-list" role="list">
            {color.tags.map((tag) => (
              <span role="listitem" key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {neighboring.length > 0 && (
        <section className="related-colors">
          <h3>Similar tones in this filter set</h3>
          <div className="related-list">
            {neighboring.map((candidate) => (
              <button
                type="button"
                key={candidate.id}
                className="related-chip"
                onClick={() => onSelect(candidate.id)}
              >
                <span className="related-swatch" style={{ backgroundColor: candidate.hex }} />
                <span>{candidate.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};

export default ColorDetail;
