import type { GlassColor } from '../data/glassPalette';

export type GlassStatus = 'draft' | 'published' | 'archived';

export type UserRole = 'admin' | 'editor' | 'author' | 'viewer';

export type ContentEntity = 'projects' | 'services' | 'blog' | 'portfolio' | 'staff' | 'clients';

export type ContentStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'archived';

export interface GlassRecord extends GlassColor {
  status: GlassStatus;
  featured: boolean;
  collections: string[];
  updatedAt: string;
  owner: string;
  notes: string;
}

export interface SeoFields {
  title: string;
  description: string;
  keywords: string[];
}

export interface ContentEntry {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  status: ContentStatus;
  tags: string[];
  category: string;
  heroMediaId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  scheduledAt?: string;
  owner: string;
  roleVisibility: UserRole[];
  seo: SeoFields;
  metrics: {
    views: number;
    engagements: number;
    conversions: number;
  };
}

export type MediaKind = 'image' | 'video' | 'document' | 'audio';

export interface MediaAsset {
  id: string;
  name: string;
  kind: MediaKind;
  url: string;
  thumbnail?: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  tags: string[];
  folder: string;
  description?: string;
  width?: number;
  height?: number;
}

export type FormFieldType = 'text' | 'email' | 'select' | 'textarea' | 'checkbox';

export interface FormFieldDefinition {
  id: string;
  label: string;
  type: FormFieldType;
  options?: string[];
  required?: boolean;
  helperText?: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  submittedAt: string;
  submittedBy: string;
  status: 'new' | 'reviewed' | 'resolved';
  values: Record<string, string | boolean>;
}

export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  fields: FormFieldDefinition[];
  submissions: FormSubmission[];
  updatedAt: string;
  owner: string;
}

export type PageBlockType = 'hero' | 'text' | 'gallery' | 'media' | 'cta';

export interface PageBlockBase {
  id: string;
  type: PageBlockType;
  title: string;
}

export interface HeroBlock extends PageBlockBase {
  type: 'hero';
  headline: string;
  subheading: string;
  backgroundMediaId?: string;
  alignment: 'left' | 'center';
}

export interface TextBlock extends PageBlockBase {
  type: 'text';
  content: string;
}

export interface GalleryBlock extends PageBlockBase {
  type: 'gallery';
  mediaIds: string[];
  layout: 'grid' | 'carousel';
}

export interface MediaBlock extends PageBlockBase {
  type: 'media';
  mediaId: string;
  caption?: string;
}

export interface CtaBlock extends PageBlockBase {
  type: 'cta';
  ctaLabel: string;
  ctaHref: string;
  emphasis: 'primary' | 'secondary';
}

export type PageBlock = HeroBlock | TextBlock | GalleryBlock | MediaBlock | CtaBlock;

export interface PageDefinition {
  id: string;
  title: string;
  slug: string;
  status: ContentStatus;
  owner: string;
  updatedAt: string;
  blocks: PageBlock[];
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  targetType: 'glass' | ContentEntity | 'media' | 'form' | 'page';
  metadata?: Record<string, string | number | boolean>;
}

export interface AnalyticsSnapshot {
  dailyActiveUsers: number[];
  contentPerformance: Array<{
    id: string;
    title: string;
    type: ContentEntity;
    views: number;
    trend: 'up' | 'down';
  }>;
  formConversionRate: number;
}

export interface CmsState {
  glassRecords: GlassRecord[];
  content: Record<ContentEntity, ContentEntry[]>;
  mediaLibrary: MediaAsset[];
  forms: FormDefinition[];
  pages: PageDefinition[];
  activity: ActivityLogEntry[];
  analytics: AnalyticsSnapshot;
}

export type ToastStatus = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  status: ToastStatus;
  createdAt: number;
}

export type PermissionMap = Record<ContentEntity | 'media' | 'forms' | 'pages', {
  create: UserRole[];
  update: UserRole[];
  delete: UserRole[];
  publish: UserRole[];
}>;
