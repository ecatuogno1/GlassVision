import { FormEvent, useMemo, useState } from 'react';
import { canPerform, useCmsData } from '../context/CmsDataContext';
import type { PageBlock, PageBlockType, PageDefinition, UserRole } from '../types/cms';

const blockLabels: Record<PageBlockType, string> = {
  hero: 'Hero banner',
  text: 'Rich text',
  gallery: 'Gallery',
  media: 'Media spotlight',
  cta: 'Call to action',
};

const blockDescriptions: Record<PageBlockType, string> = {
  hero: 'Large headline with background media.',
  text: 'Flexible copy with markdown support.',
  gallery: 'Grid or carousel of media assets.',
  media: 'Single media with caption.',
  cta: 'Button-driven call to action.',
};

interface PageBuilderProps {
  role: UserRole;
  actor: string;
}

function createBlock(type: PageBlockType): PageBlock {
  const id = `${type}-${Math.random().toString(36).slice(2, 7)}`;
  switch (type) {
    case 'hero':
      return {
        id,
        type,
        title: 'Hero block',
        headline: 'Experience headline',
        subheading: 'Supporting copy that introduces the page.',
        alignment: 'center',
      };
    case 'gallery':
      return {
        id,
        type,
        title: 'Gallery',
        mediaIds: [],
        layout: 'grid',
      };
    case 'media':
      return {
        id,
        type,
        title: 'Featured media',
        mediaId: '',
        caption: '',
      };
    case 'cta':
      return {
        id,
        type,
        title: 'CTA',
        ctaLabel: 'Learn more',
        ctaHref: '#',
        emphasis: 'primary',
      };
    default:
      return {
        id,
        type: 'text',
        title: 'Text block',
        content: 'Add compelling narrative content here.',
      };
  }
}

function PageBuilder({ role, actor }: PageBuilderProps) {
  const { pages, permissionMap, upsertPage, deletePage, enqueueToast, mediaLibrary } = useCmsData();
  const [selectedId, setSelectedId] = useState<string | null>(pages[0]?.id ?? null);
  const [draft, setDraft] = useState<PageDefinition | null>(pages[0] ?? null);
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('view');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const canCreate = canPerform(permissionMap, 'pages', role, 'create');
  const canUpdate = canPerform(permissionMap, 'pages', role, 'update');
  const canDelete = canPerform(permissionMap, 'pages', role, 'delete');

  const selectedMediaName = useMemo(() => {
    if (!draft) {
      return {};
    }
    return draft.blocks.reduce<Record<string, string>>((acc, block) => {
      if (block.type === 'media' && block.mediaId) {
        acc[block.id] = mediaLibrary.find((asset) => asset.id === block.mediaId)?.name ?? 'Unset media';
      }
      if (block.type === 'hero' && block.backgroundMediaId) {
        acc[block.id] = mediaLibrary.find((asset) => asset.id === block.backgroundMediaId)?.name ?? 'Unset media';
      }
      return acc;
    }, {});
  }, [draft, mediaLibrary]);

  const handleSelect = (id: string) => {
    const page = pages.find((item) => item.id === id);
    if (!page) {
      return;
    }
    setSelectedId(id);
    setDraft(page);
    setMode('view');
  };

  const handleCreate = () => {
    if (!canCreate) {
      enqueueToast({ title: 'You do not have permission to create pages', status: 'error' });
      return;
    }
    const newPage: PageDefinition = {
      id: '',
      title: 'New page',
      slug: 'new-page',
      status: 'draft',
      owner: actor,
      updatedAt: new Date().toISOString(),
      blocks: [createBlock('hero')],
    };
    setDraft(newPage);
    setSelectedId(null);
    setMode('create');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft) {
      return;
    }
    const next = upsertPage(draft, actor);
    if (!next) {
      return;
    }
    setDraft(next);
    setSelectedId(next.id);
    setMode('view');
  };

  const handleDelete = () => {
    if (!selectedId || !canDelete) {
      enqueueToast({ title: 'You do not have permission to delete pages', status: 'error' });
      return;
    }
    deletePage(selectedId, actor);
    setSelectedId(null);
    setDraft(null);
  };

  const isEditable = mode !== 'view' && (mode === 'create' || canUpdate);

  const updateBlock = (blockId: string, updates: Partial<PageBlock>) => {
    if (!draft || !isEditable) {
      return;
    }
    setDraft({
      ...draft,
      updatedAt: new Date().toISOString(),
      blocks: draft.blocks.map((block) => (block.id === blockId ? { ...block, ...updates } as PageBlock : block)),
    });
  };

  const addBlock = (type: PageBlockType) => {
    if (!draft || !isEditable) {
      return;
    }
    setDraft({
      ...draft,
      updatedAt: new Date().toISOString(),
      blocks: [...draft.blocks, createBlock(type)],
    });
  };

  const removeBlock = (blockId: string) => {
    if (!draft || !isEditable) {
      return;
    }
    setDraft({
      ...draft,
      updatedAt: new Date().toISOString(),
      blocks: draft.blocks.filter((block) => block.id !== blockId),
    });
  };

  const reorderBlocks = (toIndex: number) => {
    if (!draft || dragIndex === null || dragIndex === toIndex || !isEditable) {
      return;
    }
    const nextBlocks = [...draft.blocks];
    const [moved] = nextBlocks.splice(dragIndex, 1);
    nextBlocks.splice(toIndex, 0, moved);
    setDraft({
      ...draft,
      updatedAt: new Date().toISOString(),
      blocks: nextBlocks,
    });
    setDragIndex(null);
  };

  return (
    <div className="page-builder">
      <aside className="page-sidebar" aria-label="Pages">
        <header>
          <h3>Pages</h3>
          <p>Create and arrange experiential layouts.</p>
        </header>
        <ul>
          {pages.map((page) => (
            <li key={page.id}>
              <button
                type="button"
                className={page.id === selectedId ? 'active' : ''}
                onClick={() => handleSelect(page.id)}
              >
                <strong>{page.title}</strong>
                <span>{page.blocks.length} blocks</span>
              </button>
            </li>
          ))}
        </ul>
        <footer>
          <button type="button" onClick={handleCreate} disabled={!canCreate} className="primary">
            New page
          </button>
        </footer>
      </aside>

      <section className="page-editor" aria-live="polite">
        {!draft && <p>Select or create a page to begin composing.</p>}
        {draft && (
          <form onSubmit={handleSubmit} className="page-form">
            <header>
              <div>
                <h3>{draft.title}</h3>
                <p>Slug: {draft.slug} · Updated {new Date(draft.updatedAt).toLocaleString()}</p>
              </div>
              <div className="editor-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setMode((current) => (current === 'edit' ? 'view' : 'edit'))}
                  disabled={!canUpdate}
                >
                  {mode === 'edit' ? 'Stop editing' : 'Edit'}
                </button>
                <button type="button" className="ghost" onClick={handleDelete} disabled={!canDelete || !selectedId}>
                  Delete
                </button>
                <button type="submit" className="primary" disabled={!isEditable}>
                  Save
                </button>
              </div>
            </header>

            <label>
              <span>Page title</span>
              <input
                type="text"
                value={draft.title}
                onChange={(event) =>
                  isEditable && setDraft({ ...draft, title: event.target.value, updatedAt: new Date().toISOString() })
                }
                disabled={!isEditable}
              />
            </label>

            <label>
              <span>Slug</span>
              <input
                type="text"
                value={draft.slug}
                onChange={(event) =>
                  isEditable && setDraft({ ...draft, slug: event.target.value, updatedAt: new Date().toISOString() })
                }
                disabled={!isEditable}
              />
            </label>

            <div className="block-toolbar" role="group" aria-label="Add block">
              {(Object.keys(blockLabels) as PageBlockType[]).map((type) => (
                <button key={type} type="button" onClick={() => addBlock(type)} disabled={!isEditable}>
                  {blockLabels[type]}
                </button>
              ))}
            </div>

            <ol className="block-list">
              {draft.blocks.map((block, index) => (
                <li
                  key={block.id}
                  draggable={isEditable}
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => reorderBlocks(index)}
                  className="block-item"
                >
                  <header>
                    <div>
                      <h4>{block.title}</h4>
                      <p>{blockDescriptions[block.type]}</p>
                    </div>
                    <div>
                      <button type="button" onClick={() => removeBlock(block.id)} disabled={!isEditable} className="ghost">
                        Remove
                      </button>
                      <span className="drag-hint" aria-hidden="true">
                        ↕
                      </span>
                    </div>
                  </header>

                  {block.type === 'hero' && (
                    <div className="block-fields">
                      <label>
                        <span>Headline</span>
                        <input
                          type="text"
                          value={block.headline}
                          onChange={(event) => updateBlock(block.id, { headline: event.target.value })}
                          disabled={!isEditable}
                        />
                      </label>
                      <label>
                        <span>Subheading</span>
                        <textarea
                          value={block.subheading}
                          onChange={(event) => updateBlock(block.id, { subheading: event.target.value })}
                          rows={2}
                          disabled={!isEditable}
                        />
                      </label>
                      <label>
                        <span>Background media</span>
                        <select
                          value={block.backgroundMediaId ?? ''}
                          onChange={(event) => updateBlock(block.id, { backgroundMediaId: event.target.value })}
                          disabled={!isEditable}
                        >
                          <option value="">Select media</option>
                          {mediaLibrary.map((asset) => (
                            <option key={asset.id} value={asset.id}>
                              {asset.name}
                            </option>
                          ))}
                        </select>
                        {selectedMediaName[block.id] && <small>{selectedMediaName[block.id]}</small>}
                      </label>
                    </div>
                  )}

                  {block.type === 'text' && (
                    <label className="block-fields">
                      <span>Content</span>
                      <textarea
                        value={block.content}
                        onChange={(event) => updateBlock(block.id, { content: event.target.value })}
                        rows={4}
                        disabled={!isEditable}
                      />
                    </label>
                  )}

                  {block.type === 'gallery' && (
                    <div className="block-fields">
                      <label>
                        <span>Layout</span>
                        <select
                          value={block.layout}
                          onChange={(event) => updateBlock(block.id, { layout: event.target.value as 'grid' | 'carousel' })}
                          disabled={!isEditable}
                        >
                          <option value="grid">Grid</option>
                          <option value="carousel">Carousel</option>
                        </select>
                      </label>
                      <label>
                        <span>Media IDs</span>
                        <input
                          type="text"
                          value={block.mediaIds.join(', ')}
                          onChange={(event) =>
                            updateBlock(block.id, {
                              mediaIds: event.target.value
                                .split(',')
                                .map((value) => value.trim())
                                .filter(Boolean),
                            })
                          }
                          disabled={!isEditable}
                        />
                      </label>
                    </div>
                  )}

                  {block.type === 'media' && (
                    <div className="block-fields">
                      <label>
                        <span>Media asset</span>
                        <select
                          value={block.mediaId}
                          onChange={(event) => updateBlock(block.id, { mediaId: event.target.value })}
                          disabled={!isEditable}
                        >
                          <option value="">Select media</option>
                          {mediaLibrary.map((asset) => (
                            <option key={asset.id} value={asset.id}>
                              {asset.name}
                            </option>
                          ))}
                        </select>
                        {selectedMediaName[block.id] && <small>{selectedMediaName[block.id]}</small>}
                      </label>
                      <label>
                        <span>Caption</span>
                        <input
                          type="text"
                          value={block.caption ?? ''}
                          onChange={(event) => updateBlock(block.id, { caption: event.target.value })}
                          disabled={!isEditable}
                        />
                      </label>
                    </div>
                  )}

                  {block.type === 'cta' && (
                    <div className="block-fields">
                      <label>
                        <span>Label</span>
                        <input
                          type="text"
                          value={block.ctaLabel}
                          onChange={(event) => updateBlock(block.id, { ctaLabel: event.target.value })}
                          disabled={!isEditable}
                        />
                      </label>
                      <label>
                        <span>Href</span>
                        <input
                          type="text"
                          value={block.ctaHref}
                          onChange={(event) => updateBlock(block.id, { ctaHref: event.target.value })}
                          disabled={!isEditable}
                        />
                      </label>
                      <label>
                        <span>Emphasis</span>
                        <select
                          value={block.emphasis}
                          onChange={(event) => updateBlock(block.id, { emphasis: event.target.value as 'primary' | 'secondary' })}
                          disabled={!isEditable}
                        >
                          <option value="primary">Primary</option>
                          <option value="secondary">Secondary</option>
                        </select>
                      </label>
                    </div>
                  )}
                </li>
              ))}
              {draft.blocks.length === 0 && <li className="empty">No blocks yet. Add components to build the page.</li>}
            </ol>
          </form>
        )}
      </section>
    </div>
  );
}

export default PageBuilder;
