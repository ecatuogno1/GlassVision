import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import AppShell from './components/AppShell';
import CatalogToolbar from './components/CatalogToolbar';
import CatalogTable from './components/CatalogTable';
import GlassEditor from './components/GlassEditor';
import CollectionsBoard from './components/CollectionsBoard';
import WorkflowTimeline from './components/WorkflowTimeline';
import StatsSummary from './components/StatsSummary';
import AuthPanel from './components/AuthPanel';
import DashboardAnalytics from './components/DashboardAnalytics';
import { useAuth } from './context/AuthContext';
import { useCmsData, getRoleFromEmail } from './context/CmsDataContext';
import type { GlassRecord, GlassStatus, ContentEntity } from './types/cms';
import type { GlassCategory, LightTransmission } from './data/glassPalette';
import './styles/app.css';
import './styles/auth.css';
import './styles/cms.css';

const ContentManager = lazy(() => import('./components/ContentManager'));
const MediaManager = lazy(() => import('./components/MediaManager'));
const FormManager = lazy(() => import('./components/FormManager'));
const PageBuilder = lazy(() => import('./components/PageBuilder'));

const navConfig = {
  overview: {
    label: 'Overview',
    description: 'Monitor palette health, content performance, and momentum.',
    icon: '📊',
  },
  catalog: {
    label: 'Catalog',
    description: 'Curate the glass palette and manage metadata.',
    icon: '🗂️',
  },
  collections: {
    label: 'Collections',
    description: 'Assemble curated stories and experiential groupings.',
    icon: '🧩',
  },
  workflow: {
    label: 'Workflow',
    description: 'Track production milestones and editorial tasks.',
    icon: '🛠️',
  },
  content: {
    label: 'Content',
    description: 'Manage projects, services, blog posts, and more.',
    icon: '✍️',
  },
  media: {
    label: 'Media',
    description: 'Organize files, imagery, and experiential assets.',
    icon: '🖼️',
  },
  forms: {
    label: 'Forms',
    description: 'Review submissions and optimize capture funnels.',
    icon: '📨',
  },
  pages: {
    label: 'Pages',
    description: 'Compose drag-and-drop page layouts with reusable blocks.',
    icon: '🧱',
  },
} as const;

type ViewKey = keyof typeof navConfig;

const collectionSeeds: string[][] = [
  ['Studio Library', 'Solar Control'],
  ['Heritage Capsule'],
  ['Immersive Retail'],
  ['Transit Experiences'],
  ['Executive Suites'],
  ['Materials Lab'],
  ['Sustainable Core'],
  ['Hospitality Highlights'],
];

const noteSeeds = [
  'Verified spectral data for documentation.',
  'Awaiting final photography from studio session.',
  'Client feedback integrated into description.',
  'Color match confirmed with fabrication team.',
  'Pending installation case study approval.',
  'Ready for immersive visualization showcase.',
];

function createBlankRecord(ownerEmail: string | null): GlassRecord {
  const now = new Date().toISOString();
  return {
    id: '',
    name: '',
    hueGroup: '',
    hex: '#B3C7D6',
    lightTransmission: 'medium',
    reflectance: 12,
    dominantElement: '',
    category: 'Architectural',
    description: '',
    applications: [],
    tags: [],
    status: 'draft',
    featured: false,
    collections: [],
    updatedAt: now,
    owner: ownerEmail ?? 'Studio team',
    notes: '',
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function formatStatusLabel(status: GlassStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function App() {
  const { user, loading, signOut: signOutUser } = useAuth();
  const {
    glassRecords,
    upsertGlassRecord,
    duplicateGlassRecord,
    updateGlassStatus,
    toggleGlassFeatured,
    content,
    mediaLibrary,
    forms,
    pages,
  } = useCmsData();

  const actor = user?.email ?? 'user@glassvision.dev';
  const role = useMemo(() => getRoleFromEmail(user?.email ?? null), [user?.email]);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }
    const stored = window.localStorage.getItem('glassvision-theme');
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.dataset.theme = theme;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('glassvision-theme', theme);
    }
  }, [theme]);

  const [activeView, setActiveView] = useState<ViewKey>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<GlassCategory | 'all'>('all');
  const [transmissionFilter, setTransmissionFilter] = useState<LightTransmission | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<GlassStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'updatedAt' | 'reflectance'>('updatedAt');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'view' | 'edit' | 'create'>('view');
  const [draftRecord, setDraftRecord] = useState<GlassRecord | null>(null);

  useEffect(() => {
    if (glassRecords.length > 0 && !selectedId) {
      setSelectedId(glassRecords[0].id);
      setDraftRecord(glassRecords[0]);
    }
  }, [glassRecords, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    const current = glassRecords.find((record) => record.id === selectedId);
    if (current) {
      setDraftRecord(current);
    }
  }, [glassRecords, selectedId]);

  useEffect(() => {
    if (editorMode !== 'view') {
      return;
    }
    if (!selectedId) {
      return;
    }
    const current = glassRecords.find((record) => record.id === selectedId);
    if (current) {
      setDraftRecord(current);
    }
  }, [glassRecords, selectedId, editorMode]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    return glassRecords
      .filter((record) => {
        const matchesSearch =
          !normalizedQuery ||
          record.name.toLowerCase().includes(normalizedQuery) ||
          record.hueGroup.toLowerCase().includes(normalizedQuery) ||
          record.description.toLowerCase().includes(normalizedQuery) ||
          record.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
          record.collections.some((collection) => collection.toLowerCase().includes(normalizedQuery));
        const matchesCategory = categoryFilter === 'all' || record.category === categoryFilter;
        const matchesTransmission =
          transmissionFilter === 'all' || record.lightTransmission === transmissionFilter;
        const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
        return matchesSearch && matchesCategory && matchesTransmission && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'reflectance') {
          return a.reflectance - b.reflectance;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [glassRecords, searchTerm, categoryFilter, transmissionFilter, statusFilter, sortBy]);

  const publishedCount = useMemo(
    () => glassRecords.filter((record) => record.status === 'published').length,
    [glassRecords],
  );
  const draftCount = useMemo(
    () => glassRecords.filter((record) => record.status === 'draft').length,
    [glassRecords],
  );
  const featuredCount = useMemo(
    () => glassRecords.filter((record) => record.featured && record.status === 'published').length,
    [glassRecords],
  );
  const uniqueCollections = useMemo(() => {
    const set = new Set<string>();
    glassRecords.forEach((record) => record.collections.forEach((collection) => set.add(collection)));
    return set;
  }, [glassRecords]);

  const contentCount = useMemo(
    () =>
      (Object.keys(content) as ContentEntity[]).reduce(
        (accumulator, key) => accumulator + content[key].length,
        0,
      ),
    [content],
  );
  const mediaCount = mediaLibrary.length;
  const openForms = useMemo(
    () => forms.reduce((acc, form) => acc + form.submissions.filter((submission) => submission.status !== 'resolved').length, 0),
    [forms],
  );
  const pageCount = pages.length;

  const navItems = useMemo(() => {
    return (Object.keys(navConfig) as ViewKey[]).map((key) => ({
      id: key,
      label: navConfig[key].label,
      icon: navConfig[key].icon,
      badge:
        key === 'catalog'
          ? glassRecords.length
          : key === 'workflow'
          ? draftCount
          : key === 'collections'
          ? uniqueCollections.size
          : key === 'content'
          ? contentCount
          : key === 'media'
          ? mediaCount
          : key === 'forms'
          ? openForms
          : key === 'pages'
          ? pageCount
          : undefined,
    }));
  }, [glassRecords.length, draftCount, uniqueCollections.size, contentCount, mediaCount, openForms, pageCount]);

  const recentUpdates = useMemo(() => {
    return [...glassRecords]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }, [glassRecords]);

  const handleSelect = (id: string) => {
    const record = glassRecords.find((entry) => entry.id === id);
    if (!record) {
      return;
    }
    setSelectedId(record.id);
    setDraftRecord(record);
    setEditorMode('view');
    setActiveView('catalog');
  };

  const handleCreate = () => {
    const blank = createBlankRecord(actor);
    setSelectedId(null);
    setDraftRecord(blank);
    setEditorMode('create');
    setActiveView('catalog');
  };

  const handleDuplicate = (id: string) => {
    const duplicate = duplicateGlassRecord(id, actor);
    if (!duplicate) {
      return;
    }
    setSelectedId(duplicate.id);
    setDraftRecord(duplicate);
    setEditorMode('edit');
    setActiveView('catalog');
  };

  const handleToggleFeatured = (id: string) => {
    toggleGlassFeatured(id, actor);
    if (draftRecord?.id === id && editorMode === 'view') {
      setDraftRecord({ ...draftRecord, featured: !draftRecord.featured });
    }
  };

  const handleUpdateStatus = (id: string, status: GlassStatus) => {
    updateGlassStatus(id, status, actor);
    if (draftRecord?.id === id && editorMode === 'view') {
      setDraftRecord({ ...draftRecord, status });
    }
  };

  const handleArchive = () => {
    if (!draftRecord) {
      return;
    }
    handleUpdateStatus(draftRecord.id, 'archived');
  };

  const handleChangeDraft = (next: GlassRecord) => {
    setDraftRecord(next);
  };

  const handleCancel = () => {
    if (editorMode === 'create') {
      const fallback = selectedId ? glassRecords.find((record) => record.id === selectedId) : glassRecords[0] ?? null;
      setDraftRecord(fallback ?? null);
      setSelectedId(fallback?.id ?? null);
    } else if (selectedId) {
      const current = glassRecords.find((record) => record.id === selectedId);
      setDraftRecord(current ?? null);
    }
    setEditorMode('view');
  };

  const handleSave = () => {
    if (!draftRecord) {
      return;
    }
    const trimmedName = draftRecord.name.trim() || 'Untitled entry';
    const sanitizeList = (items: string[]) =>
      Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
    const sanitizedRecord: GlassRecord = {
      ...draftRecord,
      name: trimmedName,
      applications: sanitizeList(draftRecord.applications),
      tags: sanitizeList(draftRecord.tags),
      collections: sanitizeList(draftRecord.collections).length
        ? sanitizeList(draftRecord.collections)
        : [collectionSeeds[Math.floor(Math.random() * collectionSeeds.length)][0]],
      notes: draftRecord.notes || noteSeeds[Math.floor(Math.random() * noteSeeds.length)],
      owner: draftRecord.owner || actor,
      updatedAt: new Date().toISOString(),
    };

    const isNew = editorMode === 'create' || !glassRecords.some((record) => record.id === draftRecord.id);
    let finalId = sanitizedRecord.id;

    if (isNew || !finalId) {
      const baseId = slugify(trimmedName) || `entry-${glassRecords.length + 1}`;
      finalId = baseId;
      let suffix = 1;
      while (glassRecords.some((record) => record.id === finalId)) {
        finalId = `${baseId}-${suffix++}`;
      }
    }

    const recordToPersist = { ...sanitizedRecord, id: finalId };

    upsertGlassRecord(recordToPersist, actor);
    setSelectedId(recordToPersist.id);
    setDraftRecord(recordToPersist);
    setEditorMode('view');
    if (activeView !== 'catalog') {
      setActiveView('catalog');
    }
  };

  const toggleThemeMode = () => {
    setTheme((previous) => (previous === 'light' ? 'dark' : 'light'));
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-loading">Loading your experience…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        <AuthPanel />
      </div>
    );
  }

  const topbarExtras = (
    <div className="topbar-controls">
      <StatsSummary data={glassRecords} />
      <button type="button" className="ghost" onClick={toggleThemeMode} aria-label="Toggle theme">
        {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
      </button>
    </div>
  );

  const overviewContent = (
    <div className="overview-view">
      <DashboardAnalytics onNavigate={(view) => setActiveView(view as ViewKey)} />
      <div className="overview-grid">
        <section className="metric-panel">
          <article>
            <h3>Published</h3>
            <strong>{publishedCount}</strong>
            <p>Live in experiences</p>
          </article>
          <article>
            <h3>Drafts</h3>
            <strong>{draftCount}</strong>
            <p>Awaiting editorial review</p>
          </article>
          <article>
            <h3>Featured</h3>
            <strong>{featuredCount}</strong>
            <p>Highlighted in hero placements</p>
          </article>
          <article>
            <h3>Collections</h3>
            <strong>{uniqueCollections.size}</strong>
            <p>Curated thematic groupings</p>
          </article>
        </section>

        <section className="recent-panel">
          <header>
            <h3>Recently updated</h3>
            <p>Stay ahead of what changed in the last sync cycle.</p>
          </header>
          <ul className="recent-list">
            {recentUpdates.map((record) => (
              <li key={record.id}>
                <button type="button" onClick={() => handleSelect(record.id)}>
                  <span className="recent-swatch" style={{ backgroundColor: record.hex }} aria-hidden="true" />
                  <div>
                    <strong>{record.name}</strong>
                    <span>
                      {formatStatusLabel(record.status)} · Updated {new Date(record.updatedAt).toLocaleDateString()}
                    </span>
                    <small>{record.collections.slice(0, 2).join(', ') || 'Unassigned collection'}</small>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="guidance-panel">
          <h3>Operational guidance</h3>
          <ul>
            <li>
              Align on <strong>lighting environment testing</strong> for pending drafts before client previews.
            </li>
            <li>
              Refresh <strong>collection imagery</strong> for featured architectural sets this quarter.
            </li>
            <li>
              Validate <strong>material samples</strong> with the fabrication lab ahead of production.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );

  const catalogContent = (
    <div className="catalog-view">
      <CatalogToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        transmissionFilter={transmissionFilter}
        onTransmissionChange={setTransmissionFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onCreate={handleCreate}
      />
      <div className="catalog-layout">
        <CatalogTable
          records={filteredRecords}
          selectedId={selectedId}
          onSelect={handleSelect}
          onToggleFeatured={handleToggleFeatured}
          onDuplicate={handleDuplicate}
          onUpdateStatus={handleUpdateStatus}
        />
        <GlassEditor
          record={draftRecord}
          mode={editorMode}
          onChange={handleChangeDraft}
          onSave={handleSave}
          onCancel={handleCancel}
          onStartEdit={() => setEditorMode('edit')}
          onArchive={handleArchive}
          onDuplicate={() => (draftRecord ? handleDuplicate(draftRecord.id) : undefined)}
        />
      </div>
    </div>
  );

  const collectionsContent = (
    <div className="collections-view">
      <CollectionsBoard records={glassRecords} onSelect={handleSelect} selectedId={selectedId} />
    </div>
  );

  const workflowContent = (
    <WorkflowTimeline records={glassRecords} onNavigateToCatalog={() => setActiveView('catalog')} />
  );

  const contentContent = (
    <Suspense fallback={<div className="loading-panel">Loading content workspace…</div>}>
      <ContentManager role={role} actor={actor} />
    </Suspense>
  );

  const mediaContent = (
    <Suspense fallback={<div className="loading-panel">Loading media tools…</div>}>
      <MediaManager role={role} actor={actor} />
    </Suspense>
  );

  const formsContent = (
    <Suspense fallback={<div className="loading-panel">Loading forms…</div>}>
      <FormManager role={role} actor={actor} />
    </Suspense>
  );

  const pagesContent = (
    <Suspense fallback={<div className="loading-panel">Loading page builder…</div>}>
      <PageBuilder role={role} actor={actor} />
    </Suspense>
  );

  const viewContent: Record<ViewKey, JSX.Element> = {
    overview: overviewContent,
    catalog: catalogContent,
    collections: collectionsContent,
    workflow: workflowContent,
    content: contentContent,
    media: mediaContent,
    forms: formsContent,
    pages: pagesContent,
  };

  return (
    <AppShell
      title={navConfig[activeView].label}
      description={`${navConfig[activeView].description} · Role: ${role}`}
      navItems={navItems}
      activeNav={activeView}
      onNavigate={(id) => setActiveView(id as ViewKey)}
      userEmail={user.email ?? 'Studio user'}
      onSignOut={() => void signOutUser()}
      headerActions={topbarExtras}
    >
      {viewContent[activeView]}
    </AppShell>
  );
}

export default App;
