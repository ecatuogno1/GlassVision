import type { ChangeEvent } from 'react';
import type { GlassCategory, LightTransmission } from '../data/glassPalette';
import type { GlassRecord, GlassStatus } from '../types/cms';

interface GlassEditorProps {
  record: GlassRecord | null;
  mode: 'view' | 'edit' | 'create';
  onChange: (nextRecord: GlassRecord) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
  onArchive: () => void;
  onDuplicate: () => void;
}

const statusOptions: GlassStatus[] = ['published', 'draft', 'archived'];
const categoryOptions: GlassCategory[] = ['Architectural', 'Art', 'Laboratory', 'Automotive', 'Decorative'];
const transmissionOptions: LightTransmission[] = ['high', 'medium', 'low'];

const GlassEditor = ({
  record,
  mode,
  onChange,
  onSave,
  onCancel,
  onStartEdit,
  onArchive,
  onDuplicate
}: GlassEditorProps) => {
  if (!record) {
    return (
      <section className="glass-editor empty">
        <h3>Select an entry to see its details</h3>
        <p>Choose a palette entry from the catalog to review metadata, notes, and publishing settings.</p>
      </section>
    );
  }

  const isReadOnly = mode === 'view';

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    onChange({ ...record, [name]: name === 'reflectance' ? Number(value) : value });
  };

  const handleListChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
    key: 'applications' | 'tags' | 'collections'
  ) => {
    const items = event.target.value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
    onChange({ ...record, [key]: items });
  };

  return (
    <section className="glass-editor">
      <header>
        <div>
          <p className="glass-editor-status">
            <span className={`status-badge ${record.status}`}>
              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
            </span>
            {record.featured && <span className="featured-indicator">Featured</span>}
          </p>
          <h3>{record.name || 'Untitled entry'}</h3>
          <span className="glass-editor-updated">Updated {new Date(record.updatedAt).toLocaleString()}</span>
        </div>
        <div className="glass-editor-controls">
          {mode === 'view' ? (
            <>
              <button type="button" onClick={onDuplicate}>
                Duplicate
              </button>
              <button type="button" onClick={onStartEdit}>
                Edit details
              </button>
            </>
          ) : (
            <>
              <button type="button" className="ghost" onClick={onCancel}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={onSave}>
                Save changes
              </button>
            </>
          )}
        </div>
      </header>

      <div className="glass-editor-grid">
        <fieldset disabled={isReadOnly} aria-label="Primary attributes">
          <label>
            Display name
            <input name="name" value={record.name} onChange={handleFieldChange} placeholder="e.g. Ocean Prism" />
          </label>
          <label>
            Hue grouping
            <input name="hueGroup" value={record.hueGroup} onChange={handleFieldChange} placeholder="e.g. Blue-Green" />
          </label>
          <label>
            Hex code
            <input name="hex" value={record.hex} onChange={handleFieldChange} placeholder="#88CCDD" />
          </label>
          <label>
            Dominant element
            <input
              name="dominantElement"
              value={record.dominantElement}
              onChange={handleFieldChange}
              placeholder="e.g. Copper"
            />
          </label>
          <label>
            Light transmission
            <select
              name="lightTransmission"
              value={record.lightTransmission}
              onChange={(event) => onChange({ ...record, lightTransmission: event.target.value as LightTransmission })}
            >
              {transmissionOptions.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Reflectance
            <input
              type="number"
              min={0}
              max={100}
              name="reflectance"
              value={record.reflectance}
              onChange={handleFieldChange}
            />
          </label>
          <label>
            Category
            <select
              name="category"
              value={record.category}
              onChange={(event) => onChange({ ...record, category: event.target.value as GlassCategory })}
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              name="status"
              value={record.status}
              onChange={(event) => onChange({ ...record, status: event.target.value as GlassStatus })}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Owner
            <input
              name="owner"
              value={record.owner}
              onChange={handleFieldChange}
              placeholder="Team or individual responsible"
            />
          </label>
        </fieldset>

        <fieldset disabled={isReadOnly} aria-label="Narrative and metadata">
          <label>
            Description
            <textarea
              name="description"
              value={record.description}
              onChange={handleFieldChange}
              rows={4}
              placeholder="Describe how this glass behaves in installations"
            />
          </label>
          <label>
            Applications (one per line)
            <textarea
              value={record.applications.join('\n')}
              onChange={(event) => handleListChange(event, 'applications')}
              rows={3}
            />
          </label>
          <label>
            Tags (comma or newline separated)
            <textarea value={record.tags.join('\n')} onChange={(event) => handleListChange(event, 'tags')} rows={2} />
          </label>
          <label>
            Collections
            <textarea
              value={record.collections.join('\n')}
              onChange={(event) => handleListChange(event, 'collections')}
              rows={2}
            />
          </label>
          <label>
            Notes
            <textarea
              name="notes"
              value={record.notes}
              onChange={handleFieldChange}
              rows={3}
              placeholder="Document fabrication notes, client requests, or constraints"
            />
          </label>
        </fieldset>
      </div>

      {mode !== 'create' && (
        <footer>
          <button type="button" className="danger" onClick={onArchive}>
            Archive entry
          </button>
        </footer>
      )}
    </section>
  );
};

export default GlassEditor;
