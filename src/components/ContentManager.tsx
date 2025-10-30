import { FormEvent, useEffect, useMemo, useState } from 'react';
import { canPerform, useCmsData } from '../context/CmsDataContext';
import type { ContentEntity, ContentEntry, ContentStatus, UserRole } from '../types/cms';

const entityOrder: ContentEntity[] = ['projects', 'services', 'blog', 'portfolio', 'staff', 'clients'];

const statusOptions: Array<{ value: ContentStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'In review' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

function createBlankEntry(owner: string): ContentEntry {
  const now = new Date().toISOString();
  return {
    id: '',
    title: '',
    slug: '',
    summary: '',
    body: '',
    status: 'draft',
    tags: [],
    category: 'General',
    heroMediaId: undefined,
    createdAt: now,
    updatedAt: now,
    owner,
    roleVisibility: ['admin', 'editor', 'author', 'viewer'],
    seo: {
      title: '',
      description: '',
      keywords: [],
    },
    metrics: {
      views: 0,
      engagements: 0,
      conversions: 0,
    },
  };
}

interface ContentManagerProps {
  role: UserRole;
  actor: string;
}

function ContentManager({ role, actor }: ContentManagerProps) {
  const {
    content,
    permissionMap,
    upsertContentEntry,
    updateContentStatus,
    deleteContentEntry,
    enqueueToast,
  } = useCmsData();

  const [activeEntity, setActiveEntity] = useState<ContentEntity>('projects');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('view');
  const [draft, setDraft] = useState<ContentEntry | null>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);

  useEffect(() => {
    const entries = content[activeEntity] ?? [];
    if (!selectedId && entries.length > 0) {
      setSelectedId(entries[0].id);
      setDraft({ ...entries[0] });
      setMode('view');
    }
  }, [activeEntity, content, selectedId]);

  const filteredEntries = useMemo(() => {
    const entries = content[activeEntity] ?? [];
    const normalized = search.trim().toLowerCase();
    return entries
      .filter((entry) => {
        if (statusFilter !== 'all' && entry.status !== statusFilter) {
          return false;
        }
        if (!normalized) {
          return true;
        }
        return (
          entry.title.toLowerCase().includes(normalized) ||
          entry.summary.toLowerCase().includes(normalized) ||
          entry.tags.some((tag) => tag.toLowerCase().includes(normalized))
        );
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [content, activeEntity, search, statusFilter]);

  useEffect(() => {
    if (selectedId) {
      const next = (content[activeEntity] ?? []).find((entry) => entry.id === selectedId);
      if (next) {
        setDraft({ ...next });
      }
    }
  }, [content, activeEntity, selectedId]);

  const canCreate = canPerform(permissionMap, activeEntity, role, 'create');
  const canUpdate = canPerform(permissionMap, activeEntity, role, 'update');
  const canDelete = canPerform(permissionMap, activeEntity, role, 'delete');
  const canPublish = canPerform(permissionMap, activeEntity, role, 'publish');

  const assistantEndpoint = import.meta.env.VITE_AI_ASSISTANT_WEBHOOK;
  const assistantEnabled = typeof assistantEndpoint === 'string' && assistantEndpoint.length > 0;

  const handleSelect = (id: string) => {
    const entry = (content[activeEntity] ?? []).find((item) => item.id === id);
    if (!entry) {
      return;
    }
    setSelectedId(id);
    setDraft({ ...entry });
    setMode('view');
  };

  const handleCreate = () => {
    if (!canCreate) {
      enqueueToast({ title: 'You do not have permission to create entries', status: 'error' });
      return;
    }
    const entry = createBlankEntry(actor);
    setDraft(entry);
    setSelectedId(null);
    setMode('create');
  };

  const isEditing = mode !== 'view';
  const allowMutations = mode === 'create' || canUpdate;
  const readOnly = !isEditing || !allowMutations;

  const handleDraftChange = (field: string, value: string | string[]) => {
    if (readOnly) {
      return;
    }
    setDraft((previous) => {
      if (!previous) {
        return previous;
      }
      const timestamped = { ...previous, updatedAt: new Date().toISOString() } as ContentEntry;
      if (field === 'tags') {
        return {
          ...timestamped,
          tags: Array.from(new Set((value as string[]).map((tag) => tag.trim()).filter(Boolean))),
        };
      }
      if (field === 'seo.keywords') {
        return {
          ...timestamped,
          seo: {
            ...timestamped.seo,
            keywords: Array.from(new Set((value as string[]).map((tag) => tag.trim()).filter(Boolean))),
          },
        };
      }
      if (field === 'seo.title') {
        return { ...timestamped, seo: { ...timestamped.seo, title: value as string } };
      }
      if (field === 'seo.description') {
        return { ...timestamped, seo: { ...timestamped.seo, description: value as string } };
      }
      if (field === 'title' || field === 'summary' || field === 'body' || field === 'category') {
        return { ...timestamped, [field]: value } as ContentEntry;
      }
      return timestamped;
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft) {
      return;
    }
    const next = upsertContentEntry(activeEntity, draft, actor);
    if (!next) {
      return;
    }
    setSelectedId(next.id);
    setDraft({ ...next });
    setMode('view');
  };

  const handlePublish = (status: ContentStatus) => {
    if (!selectedId || !canPublish) {
      enqueueToast({ title: 'You are not allowed to change publishing state', status: 'error' });
      return;
    }
    updateContentStatus(activeEntity, selectedId, status, actor);
  };

  const handleDelete = () => {
    if (!selectedId || !canDelete) {
      enqueueToast({ title: 'You do not have permission to delete entries', status: 'error' });
      return;
    }
    deleteContentEntry(activeEntity, selectedId, actor);
    setSelectedId(null);
    setDraft(null);
  };

  const handleGenerate = async () => {
    if (!assistantEnabled || !draft || !draft.title.trim()) {
      return;
    }
    setAssistantLoading(true);
    try {
      const response = await fetch(assistantEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Draft a concise ${activeEntity} summary for ${draft.title}` }),
      });
      if (!response.ok) {
        throw new Error(`Assistant responded with ${response.status}`);
      }
      const payload = await response.json();
      const text = payload?.text ?? payload?.result ?? '';
      if (!text) {
        throw new Error('Assistant response missing text');
      }
      setDraft((previous) => (previous ? { ...previous, summary: text, body: previous.body || text } : previous));
      enqueueToast({ title: 'Assistant suggestion added', status: 'success' });
    } catch (error) {
      enqueueToast({ title: 'Assistant request failed', description: String(error), status: 'warning' });
    } finally {
      setAssistantLoading(false);
    }
  };

  return (
    <div className="content-manager">
      <aside className="content-sidebar" aria-label="Content types">
        <header>
          <h3>Content types</h3>
          <p>Select a library to manage entries.</p>
        </header>
        <ul>
          {entityOrder.map((entity) => {
            const entries = content[entity] ?? [];
            return (
              <li key={entity}>
                <button
                  type="button"
                  className={entity === activeEntity ? 'active' : ''}
                  onClick={() => {
                    setActiveEntity(entity);
                    setSelectedId(null);
                    setMode('view');
                  }}
                >
                  <span className="entity-label">{entity.charAt(0).toUpperCase() + entity.slice(1)}</span>
                  <span className="entity-count" aria-label={`${entries.length} entries`}>
                    {entries.length}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <footer>
          <p className="role-hint">Role: {role}</p>
        </footer>
      </aside>

      <section className="content-table">
        <header>
          <div>
            <h3>{activeEntity.charAt(0).toUpperCase() + activeEntity.slice(1)} entries</h3>
            <p>{filteredEntries.length} records match current filters.</p>
          </div>
          <div className="table-actions">
            <input
              type="search"
              placeholder="Search entries"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search entries"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ContentStatus | 'all')}
              aria-label="Filter by status"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {canCreate && (
              <button type="button" className="primary" onClick={handleCreate}>
                New entry
              </button>
            )}
          </div>
        </header>
        <table>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Status</th>
              <th scope="col">Updated</th>
              <th scope="col">Owner</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => {
              const isSelected = entry.id === selectedId;
              return (
                <tr key={entry.id} className={isSelected ? 'selected' : ''}>
                  <td>
                    <button type="button" onClick={() => handleSelect(entry.id)}>
                      <strong>{entry.title || 'Untitled entry'}</strong>
                      <span>{entry.summary.slice(0, 80) || 'No summary yet.'}</span>
                    </button>
                  </td>
                  <td>
                    <span className={`status-pill status-${entry.status}`}>{entry.status}</span>
                  </td>
                  <td>{new Date(entry.updatedAt).toLocaleString()}</td>
                  <td>{entry.owner}</td>
                </tr>
              );
            })}
            {filteredEntries.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  No entries found. Adjust filters or create a new record.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="content-editor" aria-live="polite">
        {!draft && <p>Select or create an entry to begin editing.</p>}
        {draft && (
          <form className="editor-form" onSubmit={handleSubmit}>
            <header>
              <div>
                <h3>{mode === 'create' ? 'Create new entry' : draft.title || 'Untitled entry'}</h3>
                <p>Keep metadata complete for better discovery and scheduling.</p>
              </div>
              <div className="editor-actions">
                {canPublish && selectedId && (
                  <select
                    value={draft.status}
                    onChange={(event) => handlePublish(event.target.value as ContentStatus)}
                    aria-label="Change publishing status"
                  >
                    {statusOptions
                      .filter((option) => option.value !== 'all')
                      .map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                  </select>
                )}
                {canDelete && selectedId && (
                  <button type="button" className="ghost" onClick={handleDelete}>
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setMode((current) => (current === 'edit' ? 'view' : 'edit'))}
                  disabled={!canUpdate}
                >
                  {mode === 'edit' ? 'Stop editing' : 'Edit'}
                </button>
                <button type="submit" className="primary" disabled={readOnly}>
                  Save
                </button>
              </div>
            </header>

            <label>
              <span>Title</span>
              <input
                type="text"
                value={draft.title}
                onChange={(event) => handleDraftChange('title', event.target.value)}
                required
                disabled={readOnly}
              />
            </label>

            <label>
              <span>Summary</span>
              <textarea
                value={draft.summary}
                onChange={(event) => handleDraftChange('summary', event.target.value)}
                rows={3}
                disabled={readOnly}
              />
            </label>

            <label>
              <span>Body content</span>
              <textarea
                value={draft.body}
                onChange={(event) => handleDraftChange('body', event.target.value)}
                rows={8}
                disabled={readOnly}
              />
            </label>

            <label>
              <span>Category</span>
              <input
                type="text"
                value={draft.category}
                onChange={(event) => handleDraftChange('category', event.target.value)}
                disabled={readOnly}
              />
            </label>

            <label>
              <span>Tags</span>
              <input
                type="text"
                value={draft.tags.join(', ')}
                onChange={(event) =>
                  handleDraftChange(
                    'tags',
                    event.target.value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="innovation, architecture, retail"
                disabled={readOnly}
              />
            </label>

            <fieldset>
              <legend>SEO metadata</legend>
              <label>
                <span>SEO title</span>
                <input
                  type="text"
                  value={draft.seo.title}
                  onChange={(event) => handleDraftChange('seo.title', event.target.value)}
                  disabled={readOnly}
                />
              </label>
              <label>
                <span>SEO description</span>
                <textarea
                  value={draft.seo.description}
                  onChange={(event) => handleDraftChange('seo.description', event.target.value)}
                  rows={2}
                  disabled={readOnly}
                />
              </label>
              <label>
                <span>SEO keywords</span>
                <input
                  type="text"
                  value={draft.seo.keywords.join(', ')}
                  onChange={(event) =>
                    handleDraftChange(
                      'seo.keywords',
                      event.target.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="glass, experience, sustainability"
                  disabled={readOnly}
                />
              </label>
            </fieldset>

            <div className="assistant-row">
              <div>
                <span className="assistant-label">Need a starting point?</span>
                <p>Use the AI assistant to generate a summary.</p>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!assistantEnabled || assistantLoading || !draft.title}
              >
                {assistantLoading ? 'Generating…' : 'Generate with assistant'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default ContentManager;
