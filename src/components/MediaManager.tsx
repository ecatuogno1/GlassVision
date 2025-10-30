import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { canPerform, useCmsData } from '../context/CmsDataContext';
import type { MediaAsset, MediaKind, UserRole } from '../types/cms';

const kindLabels: Record<MediaKind, string> = {
  image: 'Image',
  video: 'Video',
  document: 'Document',
  audio: 'Audio',
};

interface MediaManagerProps {
  role: UserRole;
  actor: string;
}

function detectKind(file: File | null): MediaKind {
  if (!file) {
    return 'document';
  }
  if (file.type.startsWith('image/')) {
    return 'image';
  }
  if (file.type.startsWith('video/')) {
    return 'video';
  }
  if (file.type.startsWith('audio/')) {
    return 'audio';
  }
  return 'document';
}

function MediaManager({ role, actor }: MediaManagerProps) {
  const { mediaLibrary, permissionMap, uploadMedia, updateMedia, deleteMedia, enqueueToast } = useCmsData();
  const [search, setSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MediaAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  const canCreate = canPerform(permissionMap, 'media', role, 'create');
  const canUpdate = canPerform(permissionMap, 'media', role, 'update');
  const canDelete = canPerform(permissionMap, 'media', role, 'delete');

  const folders = useMemo(() => {
    const unique = new Set(mediaLibrary.map((asset) => asset.folder));
    return Array.from(unique).sort();
  }, [mediaLibrary]);

  const filteredMedia = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return mediaLibrary
      .filter((asset) => {
        if (folderFilter !== 'all' && asset.folder !== folderFilter) {
          return false;
        }
        if (!normalized) {
          return true;
        }
        return (
          asset.name.toLowerCase().includes(normalized) ||
          asset.tags.some((tag) => tag.toLowerCase().includes(normalized)) ||
          asset.description?.toLowerCase().includes(normalized)
        );
      })
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [mediaLibrary, search, folderFilter]);

  const handleSelect = (id: string) => {
    const asset = mediaLibrary.find((item) => item.id === id);
    if (!asset) {
      return;
    }
    setSelectedId(id);
    setDraft({ ...asset });
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!canCreate) {
      enqueueToast({ title: 'Upload permission denied', status: 'error' });
      return;
    }
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setUploading(true);
    try {
      const asset = await uploadMedia(
        {
          name: file.name,
          kind: detectKind(file),
          size: file.size,
          url: '',
          folder: 'Uploads',
          tags: [],
          description: '',
          file,
        },
        actor,
      );
      if (asset) {
        setSelectedId(asset.id);
        setDraft(asset);
      }
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft || !canUpdate) {
      return;
    }
    updateMedia(draft.id, {
      name: draft.name,
      folder: draft.folder,
      tags: draft.tags,
      description: draft.description,
      thumbnail: draft.thumbnail,
    }, actor);
  };

  const handleDelete = () => {
    if (!selectedId || !canDelete) {
      enqueueToast({ title: 'Delete permission denied', status: 'error' });
      return;
    }
    deleteMedia(selectedId, actor);
    setSelectedId(null);
    setDraft(null);
  };

  const updateDraft = (updates: Partial<MediaAsset>) => {
    setDraft((previous) => (previous ? { ...previous, ...updates } : previous));
  };

  return (
    <div className="media-manager">
      <section className="media-toolbar">
        <div>
          <h3>Media library</h3>
          <p>{filteredMedia.length} assets</p>
        </div>
        <div className="media-actions">
          <input
            type="search"
            placeholder="Search media"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search media library"
          />
          <select value={folderFilter} onChange={(event) => setFolderFilter(event.target.value)} aria-label="Filter by folder">
            <option value="all">All folders</option>
            {folders.map((folder) => (
              <option key={folder} value={folder}>
                {folder}
              </option>
            ))}
          </select>
          <label className={canCreate ? 'upload-button' : 'upload-button disabled'}>
            <input type="file" onChange={handleUpload} disabled={!canCreate || uploading} />
            <span>{uploading ? 'Uploading…' : 'Upload media'}</span>
          </label>
        </div>
      </section>

      <div className="media-content">
        <div className="media-grid" role="list">
          {filteredMedia.map((asset) => (
            <button
              type="button"
              key={asset.id}
              onClick={() => handleSelect(asset.id)}
              className={asset.id === selectedId ? 'media-card selected' : 'media-card'}
            >
              <div className="media-thumb" aria-hidden="true">
                {asset.kind === 'image' ? (
                  <img src={asset.thumbnail ?? asset.url} alt="" loading="lazy" />
                ) : (
                  <span className={`media-kind ${asset.kind}`}>{kindLabels[asset.kind]}</span>
                )}
              </div>
              <div className="media-meta">
                <strong>{asset.name}</strong>
                <span>{(asset.size / 1024).toFixed(1)} KB · {asset.folder}</span>
              </div>
            </button>
          ))}
          {filteredMedia.length === 0 && <p className="empty">No media matches the current filters.</p>}
        </div>

        <aside className="media-detail" aria-live="polite">
          {!draft && <p>Select an asset to view details.</p>}
          {draft && (
            <form onSubmit={handleSubmit} className="media-form">
              <header>
                <div>
                  <h4>{draft.name}</h4>
                  <p>Uploaded {new Date(draft.uploadedAt).toLocaleString()}</p>
                </div>
                <div>
                  <button type="button" onClick={handleDelete} disabled={!canDelete} className="ghost">
                    Delete
                  </button>
                  <button type="submit" className="primary" disabled={!canUpdate}>
                    Save
                  </button>
                </div>
              </header>

              {draft.kind === 'image' && (
                <img src={draft.thumbnail ?? draft.url} alt="Preview" className="media-preview" />
              )}

              <label>
                <span>Name</span>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(event) => updateDraft({ name: event.target.value })}
                  disabled={!canUpdate}
                />
              </label>

              <label>
                <span>Folder</span>
                <input
                  type="text"
                  value={draft.folder}
                  onChange={(event) => updateDraft({ folder: event.target.value })}
                  disabled={!canUpdate}
                />
              </label>

              <label>
                <span>Description</span>
                <textarea
                  value={draft.description ?? ''}
                  onChange={(event) => updateDraft({ description: event.target.value })}
                  rows={3}
                  disabled={!canUpdate}
                />
              </label>

              <label>
                <span>Tags</span>
                <input
                  type="text"
                  value={draft.tags.join(', ')}
                  onChange={(event) =>
                    updateDraft({
                      tags: event.target.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    })
                  }
                  disabled={!canUpdate}
                />
              </label>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}

export default MediaManager;
