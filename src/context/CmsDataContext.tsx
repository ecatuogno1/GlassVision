import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { glassPalette } from '../data/glassPalette';
import type {
  ActivityLogEntry,
  AnalyticsSnapshot,
  CmsState,
  ContentEntity,
  ContentEntry,
  ContentStatus,
  FormDefinition,
  FormSubmission,
  GlassRecord,
  MediaAsset,
  PageDefinition,
  PermissionMap,
  ToastMessage,
  UserRole,
} from '../types/cms';
import { GlassStatus } from '../types/cms';
import { logEvent, safeExecute } from '../utils/logging';

const LOCAL_STORAGE_KEY = 'glassvision.cms-state';

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

const statusSeeds: GlassStatus[] = ['published', 'draft', 'published', 'draft', 'archived', 'published'];

const PERMISSIONS: PermissionMap = {
  projects: {
    create: ['admin', 'editor'],
    update: ['admin', 'editor'],
    delete: ['admin'],
    publish: ['admin', 'editor'],
  },
  services: {
    create: ['admin', 'editor', 'author'],
    update: ['admin', 'editor'],
    delete: ['admin'],
    publish: ['admin', 'editor'],
  },
  blog: {
    create: ['admin', 'editor', 'author'],
    update: ['admin', 'editor', 'author'],
    delete: ['admin', 'editor'],
    publish: ['admin', 'editor'],
  },
  portfolio: {
    create: ['admin', 'editor'],
    update: ['admin', 'editor'],
    delete: ['admin'],
    publish: ['admin', 'editor'],
  },
  staff: {
    create: ['admin', 'editor'],
    update: ['admin', 'editor'],
    delete: ['admin'],
    publish: ['admin', 'editor'],
  },
  clients: {
    create: ['admin'],
    update: ['admin', 'editor'],
    delete: ['admin'],
    publish: ['admin'],
  },
  media: {
    create: ['admin', 'editor', 'author'],
    update: ['admin', 'editor'],
    delete: ['admin', 'editor'],
    publish: ['admin'],
  },
  forms: {
    create: ['admin', 'editor'],
    update: ['admin', 'editor'],
    delete: ['admin'],
    publish: ['admin', 'editor'],
  },
  pages: {
    create: ['admin', 'editor'],
    update: ['admin', 'editor'],
    delete: ['admin'],
    publish: ['admin', 'editor'],
  },
};

function buildInitialGlassRecords(): GlassRecord[] {
  const baseDate = new Date('2024-03-22T10:00:00.000Z').getTime();
  return glassPalette.map<GlassRecord>((color, index) => ({
    ...color,
    status: statusSeeds[index % statusSeeds.length],
    featured: index % 3 === 0,
    collections: [...collectionSeeds[index % collectionSeeds.length]],
    updatedAt: new Date(baseDate - index * 86400000).toISOString(),
    owner: index % 2 === 0 ? 'Materials Lab' : 'Design Ops',
    notes: noteSeeds[index % noteSeeds.length],
  }));
}

const fallbackMedia: MediaAsset[] = [
  {
    id: 'media-hero-showroom',
    name: 'Flagship Showroom',
    kind: 'image',
    url: 'https://images.unsplash.com/photo-1529429617124-aee711a0bc66?auto=format&fit=crop&w=1200&q=80',
    thumbnail:
      'https://images.unsplash.com/photo-1529429617124-aee711a0bc66?auto=format&fit=crop&w=400&q=40',
    size: 804323,
    uploadedAt: '2024-03-01T15:10:00.000Z',
    uploadedBy: 'design.ops@glassvision.dev',
    tags: ['showroom', 'hero'],
    folder: 'Campaigns/2024',
    description: 'Retail hero shot used across seasonal campaign touchpoints.',
    width: 1600,
    height: 900,
  },
  {
    id: 'media-brand-film',
    name: 'Brand Film Loop',
    kind: 'video',
    url: 'https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4',
    size: 3040323,
    uploadedAt: '2024-02-18T09:42:00.000Z',
    uploadedBy: 'creative.studio@glassvision.dev',
    tags: ['video', 'ambient'],
    folder: 'Experiences/Immersive',
    description: 'Ambient film for experiential activations.',
  },
  {
    id: 'media-spec-sheet',
    name: 'Spec Sheet Template',
    kind: 'document',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    size: 124032,
    uploadedAt: '2024-01-21T17:25:00.000Z',
    uploadedBy: 'materials.lab@glassvision.dev',
    tags: ['spec', 'pdf'],
    folder: 'Library/Templates',
    description: 'Standardized project specification template.',
  },
];

function sampleContentEntry(
  id: string,
  title: string,
  category: string,
  owner: string,
  overrides: Partial<ContentEntry> = {},
): ContentEntry {
  const now = new Date().toISOString();
  return {
    id,
    title,
    slug: id,
    summary: 'Detailed narrative prepared for stakeholders and clients.',
    body:
      'This entry demonstrates the modular CMS capabilities. Update copy, attach media, and schedule releases with confidence.',
    status: 'published',
    tags: ['innovation', 'experience'],
    category,
    createdAt: now,
    updatedAt: now,
    owner,
    roleVisibility: ['admin', 'editor', 'author', 'viewer'],
    seo: {
      title: `${title} | GlassVision`,
      description: 'Optimized metadata improves discoverability across experiences.',
      keywords: ['glassvision', 'cms', 'experience'],
    },
    metrics: {
      views: Math.floor(Math.random() * 800) + 200,
      engagements: Math.floor(Math.random() * 250) + 50,
      conversions: Math.floor(Math.random() * 60) + 10,
    },
    ...overrides,
  };
}

function buildInitialContent(): Record<ContentEntity, ContentEntry[]> {
  return {
    projects: [
      sampleContentEntry('immersive-lobby', 'Immersive Lobby Transformation', 'Corporate', 'Design Ops', {
        heroMediaId: 'media-hero-showroom',
      }),
      sampleContentEntry('heritage-archive', 'Heritage Archive Experience', 'Culture', 'Materials Lab', {
        status: 'review',
        tags: ['archive', 'storytelling'],
      }),
    ],
    services: [
      sampleContentEntry('consulting', 'Strategic Materials Consulting', 'Service', 'Design Ops', {
        status: 'published',
      }),
    ],
    blog: [
      sampleContentEntry('spectral-analysis', 'Unlocking Spectral Analysis', 'Insights', 'Materials Lab', {
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      }),
      sampleContentEntry('retail-trends', 'Retail Trends 2024', 'Trends', 'Design Ops', {
        status: 'draft',
      }),
    ],
    portfolio: [
      sampleContentEntry('transit-hub', 'Transit Hub Illumination', 'Transit', 'Experience Lab', {
        heroMediaId: 'media-hero-showroom',
      }),
    ],
    staff: [
      sampleContentEntry('maya-lopez', 'Maya Lopez', 'Leadership', 'People Ops', {
        summary: 'Head of Materials Lab with a focus on sustainable innovation.',
        tags: ['leadership'],
        seo: {
          title: 'Maya Lopez | GlassVision',
          description: 'Meet the leaders guiding the materials lab initiative.',
          keywords: ['leadership', 'materials'],
        },
      }),
    ],
    clients: [
      sampleContentEntry('aurora-collective', 'Aurora Collective', 'Hospitality', 'Client Services', {
        summary: 'Global hospitality group specializing in immersive experiences.',
      }),
    ],
  };
}

const initialForms: FormDefinition[] = [
  {
    id: 'lead-intake',
    name: 'Lead Intake',
    description: 'Capture qualified inbound opportunities for the studio team.',
    fields: [
      { id: 'fullName', label: 'Full name', type: 'text', required: true },
      { id: 'email', label: 'Email', type: 'email', required: true },
      {
        id: 'projectType',
        label: 'Project type',
        type: 'select',
        options: ['Retail', 'Corporate', 'Public Space', 'Hospitality'],
        required: true,
      },
      {
        id: 'budgetRange',
        label: 'Budget range',
        type: 'select',
        options: ['<$250k', '$250k-$500k', '$500k-$1M', '$1M+'],
      },
    ],
    submissions: [
      {
        id: 'sub-1',
        formId: 'lead-intake',
        submittedAt: '2024-03-17T18:25:00.000Z',
        submittedBy: 'prospect@aurora.co',
        status: 'reviewed',
        values: {
          fullName: 'Aurora Collective',
          email: 'prospect@aurora.co',
          projectType: 'Hospitality',
          budgetRange: '$1M+',
        },
      },
    ],
    updatedAt: '2024-03-17T18:30:00.000Z',
    owner: 'Client Services',
  },
  {
    id: 'press-kit',
    name: 'Press Kit Request',
    description: 'Media inquiries for branded content and press kits.',
    fields: [
      { id: 'publication', label: 'Publication', type: 'text', required: true },
      { id: 'contactEmail', label: 'Contact email', type: 'email', required: true },
      { id: 'deadline', label: 'Deadline', type: 'text' },
      { id: 'notes', label: 'Notes', type: 'textarea' },
    ],
    submissions: [],
    updatedAt: '2024-02-04T11:14:00.000Z',
    owner: 'Communications',
  },
];

const initialPages: PageDefinition[] = [
  {
    id: 'experience-showcase',
    title: 'Experience Showcase',
    slug: 'experience-showcase',
    status: 'published',
    owner: 'Design Ops',
    updatedAt: '2024-03-12T10:00:00.000Z',
    blocks: [
      {
        id: 'hero-showcase',
        type: 'hero',
        title: 'Hero',
        headline: 'GlassVision Immersive Showcase',
        subheading: 'Curating multisensory environments with precision materials.',
        backgroundMediaId: 'media-hero-showroom',
        alignment: 'center',
      },
      {
        id: 'intro-text',
        type: 'text',
        title: 'Overview',
        content:
          'The showcase page demonstrates the modular page builder. Drag components to reorder sections and keep experiences polished.',
      },
      {
        id: 'cta-connect',
        type: 'cta',
        title: 'Connect CTA',
        ctaLabel: 'Connect with the Studio',
        ctaHref: '/contact',
        emphasis: 'primary',
      },
    ],
  },
];

const initialActivity: ActivityLogEntry[] = [
  {
    id: 'activity-1',
    timestamp: '2024-03-20T12:00:00.000Z',
    actor: 'design.ops@glassvision.dev',
    action: 'Published project Immersive Lobby Transformation',
    target: 'immersive-lobby',
    targetType: 'projects',
  },
  {
    id: 'activity-2',
    timestamp: '2024-03-18T09:00:00.000Z',
    actor: 'materials.lab@glassvision.dev',
    action: 'Uploaded media asset Flagship Showroom',
    target: 'media-hero-showroom',
    targetType: 'media',
  },
  {
    id: 'activity-3',
    timestamp: '2024-03-15T16:00:00.000Z',
    actor: 'client.services@glassvision.dev',
    action: 'Reviewed submission Aurora Collective',
    target: 'lead-intake',
    targetType: 'forms',
  },
];

function calculateAnalytics(state: CmsState): AnalyticsSnapshot {
  const contentPerformance = Object.entries(state.content)
    .flatMap(([type, entries]) =>
      entries.map((entry) => ({
        id: entry.id,
        title: entry.title,
        type: type as ContentEntity,
        views: entry.metrics.views,
        trend: entry.metrics.engagements > entry.metrics.views * 0.2 ? 'up' : 'down',
      })),
    )
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  const dailyActiveUsers = [...state.analytics.dailyActiveUsers];
  if (dailyActiveUsers.length === 0) {
    const base = Array.from({ length: 7 }, () => Math.floor(Math.random() * 50) + 20);
    return {
      contentPerformance,
      dailyActiveUsers: base,
      formConversionRate: 0,
    };
  }

  const totalSubmissions = state.forms.reduce((acc, form) => acc + form.submissions.length, 0);
  const resolvedSubmissions = state.forms.reduce(
    (acc, form) => acc + form.submissions.filter((submission) => submission.status === 'resolved').length,
    0,
  );
  const formConversionRate = totalSubmissions === 0 ? 0 : Math.round((resolvedSubmissions / totalSubmissions) * 100);

  return {
    contentPerformance,
    dailyActiveUsers,
    formConversionRate,
  };
}

const initialState: CmsState = {
  glassRecords: buildInitialGlassRecords(),
  content: buildInitialContent(),
  mediaLibrary: fallbackMedia,
  forms: initialForms,
  pages: initialPages,
  activity: initialActivity,
  analytics: {
    dailyActiveUsers: Array.from({ length: 7 }, (_, index) => 48 + index * 4),
    contentPerformance: [],
    formConversionRate: 0,
  },
};

const hydratedInitialState: CmsState = {
  ...initialState,
  analytics: calculateAnalytics(initialState),
};

type CmsAction =
  | { type: 'SET_STATE'; payload: CmsState }
  | { type: 'UPSERT_GLASS_RECORD'; record: GlassRecord }
  | { type: 'DELETE_GLASS_RECORD'; id: string }
  | { type: 'UPSERT_CONTENT_ENTRY'; entry: ContentEntry; entity: ContentEntity }
  | { type: 'DELETE_CONTENT_ENTRY'; id: string; entity: ContentEntity }
  | { type: 'UPSERT_MEDIA_ASSET'; asset: MediaAsset }
  | { type: 'DELETE_MEDIA_ASSET'; id: string }
  | { type: 'UPSERT_FORM_DEFINITION'; form: FormDefinition }
  | { type: 'UPSERT_FORM_SUBMISSION'; formId: string; submission: FormSubmission }
  | {
      type: 'UPDATE_FORM_SUBMISSION_STATUS';
      formId: string;
      submissionId: string;
      status: FormSubmission['status'];
    }
  | { type: 'UPSERT_PAGE_DEFINITION'; page: PageDefinition }
  | { type: 'DELETE_PAGE_DEFINITION'; id: string }
  | { type: 'PUSH_ACTIVITY'; entry: ActivityLogEntry }
  | { type: 'REFRESH_ANALYTICS' };

function cmsReducer(state: CmsState, action: CmsAction): CmsState {
  switch (action.type) {
    case 'SET_STATE':
      return {
        ...action.payload,
        analytics: calculateAnalytics(action.payload),
      };
    case 'UPSERT_GLASS_RECORD': {
      const existingIndex = state.glassRecords.findIndex((record) => record.id === action.record.id);
      const nextRecords = existingIndex >= 0
        ? state.glassRecords.map((record, index) => (index === existingIndex ? action.record : record))
        : [...state.glassRecords, action.record];
      return { ...state, glassRecords: nextRecords };
    }
    case 'DELETE_GLASS_RECORD':
      return {
        ...state,
        glassRecords: state.glassRecords.filter((record) => record.id !== action.id),
      };
    case 'UPSERT_CONTENT_ENTRY': {
      const entries = state.content[action.entity] ?? [];
      const index = entries.findIndex((entry) => entry.id === action.entry.id);
      const updatedEntries = index >= 0
        ? entries.map((entry, i) => (i === index ? action.entry : entry))
        : [...entries, action.entry];
      return {
        ...state,
        content: {
          ...state.content,
          [action.entity]: updatedEntries,
        },
      };
    }
    case 'DELETE_CONTENT_ENTRY': {
      const entries = state.content[action.entity] ?? [];
      return {
        ...state,
        content: {
          ...state.content,
          [action.entity]: entries.filter((entry) => entry.id !== action.id),
        },
      };
    }
    case 'UPSERT_MEDIA_ASSET': {
      const index = state.mediaLibrary.findIndex((asset) => asset.id === action.asset.id);
      const mediaLibrary = index >= 0
        ? state.mediaLibrary.map((asset, i) => (i === index ? action.asset : asset))
        : [...state.mediaLibrary, action.asset];
      return { ...state, mediaLibrary };
    }
    case 'DELETE_MEDIA_ASSET':
      return {
        ...state,
        mediaLibrary: state.mediaLibrary.filter((asset) => asset.id !== action.id),
      };
    case 'UPSERT_FORM_DEFINITION': {
      const index = state.forms.findIndex((form) => form.id === action.form.id);
      const forms = index >= 0
        ? state.forms.map((form, i) => (i === index ? action.form : form))
        : [...state.forms, action.form];
      return { ...state, forms };
    }
    case 'UPSERT_FORM_SUBMISSION': {
      return {
        ...state,
        forms: state.forms.map((form) =>
          form.id === action.formId
            ? {
                ...form,
                submissions: [action.submission, ...form.submissions],
                updatedAt: action.submission.submittedAt,
              }
            : form,
        ),
      };
    }
    case 'UPDATE_FORM_SUBMISSION_STATUS': {
      return {
        ...state,
        forms: state.forms.map((form) =>
          form.id === action.formId
            ? {
                ...form,
                submissions: form.submissions.map((submission) =>
                  submission.id === action.submissionId
                    ? { ...submission, status: action.status }
                    : submission,
                ),
              }
            : form,
        ),
      };
    }
    case 'UPSERT_PAGE_DEFINITION': {
      const index = state.pages.findIndex((page) => page.id === action.page.id);
      const pages = index >= 0
        ? state.pages.map((page, i) => (i === index ? action.page : page))
        : [...state.pages, action.page];
      return { ...state, pages };
    }
    case 'DELETE_PAGE_DEFINITION':
      return {
        ...state,
        pages: state.pages.filter((page) => page.id !== action.id),
      };
    case 'PUSH_ACTIVITY': {
      const activity = [action.entry, ...state.activity];
      return {
        ...state,
        activity: activity.slice(0, 150),
      };
    }
    case 'REFRESH_ANALYTICS': {
      return {
        ...state,
        analytics: calculateAnalytics(state),
      };
    }
    default:
      return state;
  }
}

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

interface CmsDataContextValue extends CmsState {
  permissionMap: PermissionMap;
  toastQueue: ToastMessage[];
  enqueueToast: (toast: Omit<ToastMessage, 'id' | 'createdAt'>) => void;
  removeToast: (id: string) => void;
  refreshAnalytics: () => void;
  upsertGlassRecord: (record: GlassRecord, actor: string) => void;
  deleteGlassRecord: (id: string, actor: string) => void;
  duplicateGlassRecord: (id: string, actor: string) => GlassRecord | null;
  updateGlassStatus: (id: string, status: GlassStatus, actor: string) => void;
  toggleGlassFeatured: (id: string, actor: string) => void;
  upsertContentEntry: (
    entity: ContentEntity,
    entry: Partial<ContentEntry> & { title: string },
    actor: string,
  ) => ContentEntry | null;
  updateContentStatus: (
    entity: ContentEntity,
    id: string,
    status: ContentStatus,
    actor: string,
  ) => void;
  deleteContentEntry: (entity: ContentEntity, id: string, actor: string) => void;
  uploadMedia: (
    asset: Omit<MediaAsset, 'id' | 'uploadedAt'> & { file?: File | null },
    actor: string,
  ) => MediaAsset | null;
  updateMedia: (id: string, updates: Partial<MediaAsset>, actor: string) => void;
  deleteMedia: (id: string, actor: string) => void;
  submitForm: (
    formId: string,
    submission: Omit<FormSubmission, 'id' | 'submittedAt' | 'status'>,
    actor: string,
  ) => FormSubmission | null;
  updateSubmissionStatus: (
    formId: string,
    submissionId: string,
    status: FormSubmission['status'],
    actor: string,
  ) => void;
  upsertForm: (form: Partial<FormDefinition> & { name: string }, actor: string) => FormDefinition | null;
  upsertPage: (page: Partial<PageDefinition> & { title: string }, actor: string) => PageDefinition | null;
  deletePage: (id: string, actor: string) => void;
}

const CmsDataContext = createContext<CmsDataContextValue | undefined>(undefined);

export function CmsDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cmsReducer, hydratedInitialState);
  const [toastQueue, toastDispatch] = useReducer(
    (queue: ToastMessage[], action: { type: 'push'; toast: ToastMessage } | { type: 'remove'; id: string }) => {
      if (action.type === 'push') {
        return [action.toast, ...queue.filter((item) => Date.now() - item.createdAt < 8000)].slice(0, 5);
      }
      return queue.filter((toast) => toast.id !== action.id);
    },
    [],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const saved = safeExecute(() => window.localStorage.getItem(LOCAL_STORAGE_KEY), null);
    if (!saved) {
      return;
    }
    const parsed = safeExecute(() => JSON.parse(saved) as CmsState, null, 'cms-state hydration');
    if (!parsed) {
      return;
    }
    dispatch({ type: 'SET_STATE', payload: { ...hydratedInitialState, ...parsed } });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    safeExecute(
      () => {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
        return true;
      },
      false,
      'cms-state persistence',
    );
  }, [state]);

  const enqueueToast = useCallback((toast: Omit<ToastMessage, 'id' | 'createdAt'>) => {
    toastDispatch({
      type: 'push',
      toast: {
        ...toast,
        id: generateId('toast'),
        createdAt: Date.now(),
      },
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    toastDispatch({ type: 'remove', id });
  }, []);

  const pushActivity = useCallback((entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => {
    const payload: ActivityLogEntry = {
      ...entry,
      id: generateId('activity'),
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'PUSH_ACTIVITY', entry: payload });
  }, []);

  const upsertGlassRecord = useCallback(
    (record: GlassRecord, actor: string) => {
      dispatch({ type: 'UPSERT_GLASS_RECORD', record });
      dispatch({ type: 'REFRESH_ANALYTICS' });
      pushActivity({
        actor,
        action: `${record.id ? 'Updated' : 'Created'} glass record ${record.name || record.id}`,
        target: record.id,
        targetType: 'glass',
      });
      enqueueToast({
        title: 'Glass record saved',
        description: `${record.name || 'Untitled'} is now ${record.status}.`,
        status: 'success',
      });
      logEvent({
        message: 'Glass record persisted',
        context: { id: record.id, actor },
      });
    },
    [enqueueToast, pushActivity],
  );

  const deleteGlassRecord = useCallback(
    (id: string, actor: string) => {
      dispatch({ type: 'DELETE_GLASS_RECORD', id });
      dispatch({ type: 'REFRESH_ANALYTICS' });
      pushActivity({
        actor,
        action: `Deleted glass record ${id}`,
        target: id,
        targetType: 'glass',
      });
      enqueueToast({ title: 'Glass record removed', description: id, status: 'info' });
    },
    [enqueueToast, pushActivity],
  );

  const duplicateGlassRecord = useCallback(
    (id: string, actor: string) => {
      const existing = state.glassRecords.find((record) => record.id === id);
      if (!existing) {
        enqueueToast({ title: 'Unable to duplicate', description: 'Original record not found.', status: 'error' });
        return null;
      }
      let duplicateId = `${existing.id}-copy`;
      let suffix = 1;
      while (state.glassRecords.some((record) => record.id === duplicateId)) {
        duplicateId = `${existing.id}-copy-${suffix++}`;
      }
      const duplicate: GlassRecord = {
        ...existing,
        id: duplicateId,
        name: `${existing.name} Copy`,
        featured: false,
        status: 'draft',
        updatedAt: new Date().toISOString(),
        notes: existing.notes ? `${existing.notes} (duplicated)` : 'Duplicated for revision.',
      };
      upsertGlassRecord(duplicate, actor);
      enqueueToast({
        title: 'Glass record duplicated',
        description: `${existing.name} duplicated as ${duplicate.name}.`,
        status: 'success',
      });
      return duplicate;
    },
    [enqueueToast, state.glassRecords, upsertGlassRecord],
  );

  const updateGlassStatus = useCallback(
    (id: string, status: GlassStatus, actor: string) => {
      const record = state.glassRecords.find((item) => item.id === id);
      if (!record) {
        enqueueToast({ title: 'Glass record not found', status: 'error' });
        return;
      }
      const updated: GlassRecord = { ...record, status, updatedAt: new Date().toISOString() };
      dispatch({ type: 'UPSERT_GLASS_RECORD', record: updated });
      dispatch({ type: 'REFRESH_ANALYTICS' });
      pushActivity({
        actor,
        action: `Set glass record ${record.name} to ${status}`,
        target: record.id,
        targetType: 'glass',
      });
      enqueueToast({ title: `${record.name} status updated`, status: 'info' });
    },
    [enqueueToast, pushActivity, state.glassRecords],
  );

  const toggleGlassFeatured = useCallback(
    (id: string, actor: string) => {
      const record = state.glassRecords.find((item) => item.id === id);
      if (!record) {
        enqueueToast({ title: 'Glass record not found', status: 'error' });
        return;
      }
      const updated: GlassRecord = {
        ...record,
        featured: !record.featured,
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'UPSERT_GLASS_RECORD', record: updated });
      pushActivity({
        actor,
        action: `${updated.featured ? 'Highlighted' : 'Removed highlight from'} ${record.name}`,
        target: record.id,
        targetType: 'glass',
      });
      enqueueToast({
        title: updated.featured ? 'Added to featured' : 'Removed from featured',
        description: record.name,
        status: 'success',
      });
    },
    [enqueueToast, pushActivity, state.glassRecords],
  );

  const upsertContentEntry = useCallback(
    (
      entity: ContentEntity,
      entry: Partial<ContentEntry> & { title: string },
      actor: string,
    ) => {
      if (!entry.title.trim()) {
        enqueueToast({ title: 'Title is required', status: 'error' });
        return null;
      }
      const now = new Date().toISOString();
      const existingEntries = state.content[entity] ?? [];
      const baseId = entry.id ?? slugify(entry.title);
      let id = baseId || generateId(entity);
      if (!entry.id) {
        let counter = 1;
        while (existingEntries.some((item) => item.id === id)) {
          id = `${baseId}-${counter++}`;
        }
      }
      const persisted: ContentEntry = {
        summary: '',
        body: '',
        status: 'draft',
        tags: [],
        category: 'General',
        createdAt: now,
        updatedAt: now,
        owner: actor,
        roleVisibility: ['admin', 'editor', 'author', 'viewer'],
        seo: {
          title: entry.title,
          description: entry.summary ?? '',
          keywords: [],
        },
        metrics: { views: 0, engagements: 0, conversions: 0 },
        ...entry,
        id,
        slug: slugify(entry.slug ?? entry.title) || id,
        updatedAt: now,
      };
      dispatch({ type: 'UPSERT_CONTENT_ENTRY', entity, entry: persisted });
      dispatch({ type: 'REFRESH_ANALYTICS' });
      pushActivity({
        actor,
        action: `${entry.id ? 'Updated' : 'Created'} ${entity} entry ${persisted.title}`,
        target: persisted.id,
        targetType: entity,
      });
      enqueueToast({
        title: `${persisted.title} saved`,
        status: 'success',
        description: `${entity} entry is now ${persisted.status}.`,
      });
      return persisted;
    },
    [enqueueToast, pushActivity, state.content],
  );

  const updateContentStatus = useCallback(
    (entity: ContentEntity, id: string, status: ContentStatus, actor: string) => {
      const entry = state.content[entity]?.find((item) => item.id === id);
      if (!entry) {
        enqueueToast({ title: 'Entry not found', status: 'error' });
        return;
      }
      const updated: ContentEntry = {
        ...entry,
        status,
        updatedAt: new Date().toISOString(),
        publishedAt: status === 'published' ? new Date().toISOString() : entry.publishedAt,
      };
      dispatch({ type: 'UPSERT_CONTENT_ENTRY', entity, entry: updated });
      dispatch({ type: 'REFRESH_ANALYTICS' });
      pushActivity({
        actor,
        action: `Set ${entity} entry ${entry.title} to ${status}`,
        target: entry.id,
        targetType: entity,
      });
      enqueueToast({ title: `${entry.title} status updated`, status: 'info' });
    },
    [enqueueToast, pushActivity, state.content],
  );

  const deleteContentEntry = useCallback(
    (entity: ContentEntity, id: string, actor: string) => {
      dispatch({ type: 'DELETE_CONTENT_ENTRY', entity, id });
      dispatch({ type: 'REFRESH_ANALYTICS' });
      pushActivity({
        actor,
        action: `Deleted ${entity} entry ${id}`,
        target: id,
        targetType: entity,
      });
      enqueueToast({ title: 'Entry deleted', description: id, status: 'warning' });
    },
    [enqueueToast, pushActivity],
  );

  const uploadMedia = useCallback(
    (
      asset: Omit<MediaAsset, 'id' | 'uploadedAt'> & { file?: File | null },
      actor: string,
    ) => {
      if (!asset.name.trim()) {
        enqueueToast({ title: 'Media name is required', status: 'error' });
        return null;
      }
      const now = new Date().toISOString();
      let url = asset.url;
      let thumbnail = asset.thumbnail;
      if (asset.file) {
        url = URL.createObjectURL(asset.file);
        thumbnail = url;
      }
      const persisted: MediaAsset = {
        ...asset,
        id: asset.id ?? generateId('media'),
        uploadedAt: now,
        uploadedBy: actor,
        url,
        thumbnail,
      };
      dispatch({ type: 'UPSERT_MEDIA_ASSET', asset: persisted });
      pushActivity({
        actor,
        action: `Uploaded media ${persisted.name}`,
        target: persisted.id,
        targetType: 'media',
      });
      enqueueToast({ title: `${persisted.name} uploaded`, status: 'success' });
      return persisted;
    },
    [enqueueToast, pushActivity],
  );

  const updateMedia = useCallback(
    (id: string, updates: Partial<MediaAsset>, actor: string) => {
      const asset = state.mediaLibrary.find((item) => item.id === id);
      if (!asset) {
        enqueueToast({ title: 'Media not found', status: 'error' });
        return;
      }
      const persisted: MediaAsset = { ...asset, ...updates };
      dispatch({ type: 'UPSERT_MEDIA_ASSET', asset: persisted });
      pushActivity({
        actor,
        action: `Updated media ${persisted.name}`,
        target: persisted.id,
        targetType: 'media',
      });
      enqueueToast({ title: `${persisted.name} updated`, status: 'info' });
    },
    [enqueueToast, pushActivity, state.mediaLibrary],
  );

  const deleteMedia = useCallback(
    (id: string, actor: string) => {
      dispatch({ type: 'DELETE_MEDIA_ASSET', id });
      pushActivity({
        actor,
        action: `Deleted media asset ${id}`,
        target: id,
        targetType: 'media',
      });
      enqueueToast({ title: 'Media removed', description: id, status: 'warning' });
    },
    [enqueueToast, pushActivity],
  );

  const submitForm = useCallback(
    (
      formId: string,
      submission: Omit<FormSubmission, 'id' | 'submittedAt' | 'status'>,
      actor: string,
    ) => {
      const form = state.forms.find((item) => item.id === formId);
      if (!form) {
        enqueueToast({ title: 'Form not found', status: 'error' });
        return null;
      }
      const persisted: FormSubmission = {
        ...submission,
        id: generateId('submission'),
        formId,
        submittedAt: new Date().toISOString(),
        status: 'new',
      };
      dispatch({ type: 'UPSERT_FORM_SUBMISSION', formId, submission: persisted });
      dispatch({ type: 'REFRESH_ANALYTICS' });
      pushActivity({
        actor,
        action: `New submission for ${form.name}`,
        target: form.id,
        targetType: 'forms',
      });
      enqueueToast({ title: 'Submission received', status: 'success' });
      return persisted;
    },
    [enqueueToast, pushActivity, state.forms],
  );

  const updateSubmissionStatus = useCallback(
    (formId: string, submissionId: string, status: FormSubmission['status'], actor: string) => {
      dispatch({ type: 'UPDATE_FORM_SUBMISSION_STATUS', formId, submissionId, status });
      dispatch({ type: 'REFRESH_ANALYTICS' });
      pushActivity({
        actor,
        action: `Marked submission ${submissionId} as ${status}`,
        target: formId,
        targetType: 'forms',
      });
      enqueueToast({ title: 'Submission updated', status: 'info' });
    },
    [enqueueToast, pushActivity],
  );

  const upsertForm = useCallback(
    (form: Partial<FormDefinition> & { name: string }, actor: string) => {
      if (!form.name.trim()) {
        enqueueToast({ title: 'Form name is required', status: 'error' });
        return null;
      }
      const id = form.id ?? generateId('form');
      const now = new Date().toISOString();
      const existing = state.forms.find((item) => item.id === id);
      const persisted: FormDefinition = {
        id,
        description: '',
        fields: [],
        submissions: existing?.submissions ?? [],
        updatedAt: now,
        owner: actor,
        ...existing,
        ...form,
        updatedAt: now,
      };
      dispatch({ type: 'UPSERT_FORM_DEFINITION', form: persisted });
      pushActivity({
        actor,
        action: `${existing ? 'Updated' : 'Created'} form ${persisted.name}`,
        target: persisted.id,
        targetType: 'forms',
      });
      enqueueToast({ title: `${persisted.name} saved`, status: 'success' });
      return persisted;
    },
    [enqueueToast, pushActivity, state.forms],
  );

  const upsertPage = useCallback(
    (page: Partial<PageDefinition> & { title: string }, actor: string) => {
      if (!page.title.trim()) {
        enqueueToast({ title: 'Page title is required', status: 'error' });
        return null;
      }
      const id = page.id ?? generateId('page');
      const slug = slugify(page.slug ?? page.title);
      const now = new Date().toISOString();
      const existing = state.pages.find((item) => item.id === id);
      const persisted: PageDefinition = {
        id,
        title: page.title,
        slug: slug || id,
        status: page.status ?? existing?.status ?? 'draft',
        owner: page.owner ?? actor,
        updatedAt: now,
        blocks: page.blocks ?? existing?.blocks ?? [],
      };
      dispatch({ type: 'UPSERT_PAGE_DEFINITION', page: persisted });
      pushActivity({
        actor,
        action: `${existing ? 'Updated' : 'Created'} page ${persisted.title}`,
        target: persisted.id,
        targetType: 'pages',
      });
      enqueueToast({ title: `${persisted.title} saved`, status: 'success' });
      return persisted;
    },
    [enqueueToast, pushActivity, state.pages],
  );

  const deletePage = useCallback(
    (id: string, actor: string) => {
      dispatch({ type: 'DELETE_PAGE_DEFINITION', id });
      pushActivity({
        actor,
        action: `Deleted page ${id}`,
        target: id,
        targetType: 'pages',
      });
      enqueueToast({ title: 'Page removed', status: 'warning' });
    },
    [enqueueToast, pushActivity],
  );

  const refreshAnalytics = useCallback(() => {
    dispatch({ type: 'REFRESH_ANALYTICS' });
  }, []);

  const value = useMemo<CmsDataContextValue>(
    () => ({
      ...state,
      permissionMap: PERMISSIONS,
      toastQueue,
      enqueueToast,
      removeToast,
      refreshAnalytics,
      upsertGlassRecord,
      deleteGlassRecord,
      duplicateGlassRecord,
      upsertContentEntry,
      updateContentStatus,
      deleteContentEntry,
      updateGlassStatus,
      toggleGlassFeatured,
      uploadMedia,
      updateMedia,
      deleteMedia,
      submitForm,
      updateSubmissionStatus,
      upsertForm,
      upsertPage,
      deletePage,
    }),
    [
      state,
      toastQueue,
      enqueueToast,
      removeToast,
      refreshAnalytics,
      upsertGlassRecord,
      deleteGlassRecord,
      duplicateGlassRecord,
      upsertContentEntry,
      updateContentStatus,
      deleteContentEntry,
      uploadMedia,
      updateMedia,
      deleteMedia,
      submitForm,
      updateSubmissionStatus,
      upsertForm,
      upsertPage,
      deletePage,
    ],
  );

  return <CmsDataContext.Provider value={value}>{children}</CmsDataContext.Provider>;
}

export function useCmsData() {
  const context = useContext(CmsDataContext);
  if (!context) {
    throw new Error('useCmsData must be used within a CmsDataProvider');
  }
  return context;
}

export function getRoleFromEmail(email: string | null | undefined): UserRole {
  if (!email) {
    return 'viewer';
  }
  if (email.endsWith('@glassvision.dev')) {
    return 'admin';
  }
  if (email.includes('design')) {
    return 'editor';
  }
  if (email.includes('studio') || email.includes('creative')) {
    return 'author';
  }
  return 'viewer';
}

export function canPerform(
  permissionMap: PermissionMap,
  entity: keyof PermissionMap,
  role: UserRole,
  action: 'create' | 'update' | 'delete' | 'publish',
) {
  return permissionMap[entity][action].includes(role);
}
