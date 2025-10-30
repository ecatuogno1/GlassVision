import { useMemo } from 'react';
import type { GlassRecord } from '../types/cms';

interface CollectionsBoardProps {
  records: GlassRecord[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

const CollectionsBoard = ({ records, onSelect, selectedId }: CollectionsBoardProps) => {
  const grouped = useMemo(() => {
    return records.reduce<Record<string, GlassRecord[]>>((accumulator, record) => {
      for (const collection of record.collections.length > 0 ? record.collections : ['Unassigned']) {
        if (!accumulator[collection]) {
          accumulator[collection] = [];
        }
        accumulator[collection].push(record);
      }
      return accumulator;
    }, {});
  }, [records]);

  const collectionNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  if (collectionNames.length === 0) {
    return (
      <section className="collections-board empty">
        <h3>No collections have been curated yet</h3>
        <p>Assign palette entries to collections in the catalog view to start building showcases.</p>
      </section>
    );
  }

  return (
    <section className="collections-board">
      {collectionNames.map((collectionName) => (
        <article key={collectionName} className="collection-card">
          <header>
            <h3>{collectionName}</h3>
            <span>{grouped[collectionName].length} entries</span>
          </header>
          <ul>
            {grouped[collectionName]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((record) => {
                const isSelected = record.id === selectedId;
                return (
                  <li key={record.id} className={isSelected ? 'selected' : undefined}>
                    <button type="button" onClick={() => onSelect(record.id)}>
                      <span className="collection-swatch" style={{ backgroundColor: record.hex }} aria-hidden="true" />
                      <div>
                        <strong>{record.name}</strong>
                        <small>{record.category} · {record.lightTransmission} transmission</small>
                      </div>
                    </button>
                  </li>
                );
              })}
          </ul>
        </article>
      ))}
    </section>
  );
};

export default CollectionsBoard;
