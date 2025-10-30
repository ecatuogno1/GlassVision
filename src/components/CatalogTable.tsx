import type { GlassRecord, GlassStatus } from '../types/cms';

interface CatalogTableProps {
  records: GlassRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleFeatured: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUpdateStatus: (id: string, status: GlassStatus) => void;
}

const statusLabels: Record<GlassStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived'
};

const CatalogTable = ({
  records,
  selectedId,
  onSelect,
  onToggleFeatured,
  onDuplicate,
  onUpdateStatus
}: CatalogTableProps) => {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  };

  if (records.length === 0) {
    return (
      <div className="catalog-table empty" role="status">
        <h3>No entries match your filters</h3>
        <p>Adjust the filters or create a new palette entry to populate the catalog.</p>
      </div>
    );
  }

  return (
    <div className="catalog-table" role="region" aria-live="polite">
      <table>
        <thead>
          <tr>
            <th scope="col">Palette</th>
            <th scope="col">Category</th>
            <th scope="col">Transmission</th>
            <th scope="col">Status</th>
            <th scope="col">Collections</th>
            <th scope="col">Updated</th>
            <th scope="col" className="table-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const isSelected = record.id === selectedId;
            return (
              <tr
                key={record.id}
                className={isSelected ? 'selected' : undefined}
                onClick={() => onSelect(record.id)}
              >
                <th scope="row">
                  <div className="table-palette">
                    <span className="table-swatch" style={{ backgroundColor: record.hex }} aria-hidden="true" />
                    <div>
                      <p>{record.name}</p>
                      <span>{record.hueGroup}</span>
                    </div>
                  </div>
                </th>
                <td>{record.category}</td>
                <td>{record.lightTransmission}</td>
                <td>
                  <span className={`status-badge ${record.status}`}>
                    {statusLabels[record.status]}
                  </span>
                </td>
                <td>
                  <div className="table-collections">
                    {record.collections.length === 0 ? '—' : record.collections.join(', ')}
                  </div>
                </td>
                <td>{formatDate(record.updatedAt)}</td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className={record.featured ? 'table-icon active' : 'table-icon'}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleFeatured(record.id);
                      }}
                      aria-label={record.featured ? 'Remove from featured' : 'Add to featured'}
                    >
                      ★
                    </button>
                    <button
                      type="button"
                      className="table-icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDuplicate(record.id);
                      }}
                      aria-label="Duplicate entry"
                    >
                      ⧉
                    </button>
                    <select
                      className="table-status"
                      value={record.status}
                      onChange={(event) => {
                        event.stopPropagation();
                        onUpdateStatus(record.id, event.target.value as GlassStatus);
                      }}
                      aria-label={`Update status for ${record.name}`}
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CatalogTable;
