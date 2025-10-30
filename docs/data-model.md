# GlassVision Data Model Guide

This document outlines the conceptual, logical, and physical data models that support the GlassVision platform for soft-glass and boro artists. It covers core entities, relationships, and best practices for managing artist profiles, vendor catalogs, community training data, analysis results, and operational telemetry.

## 1. Conceptual Overview
GlassVision manages four primary domains:
1. **Identity & Access** – Users, roles, permissions, and authentication artifacts.
2. **Artist & Vendor Catalogs** – Artist studios, collections, vendor inventory (e.g., Mountain Glass), and glass product batches.
3. **Operational Workflows** – Collections, community submissions, assets (images/video), processing configurations, and moderation.
4. **Analysis & Intelligence** – Color measurements, strike behavior insights, training datasets, audit trails, and notifications.

The system emphasizes traceability. Every analysis result is linked back to its input assets, processing configuration, responsible user, and downstream reports.

## 2. Core Entities

### 2.1 User & Access Management
- **User**: Represents a human or service identity with authentication credentials.
- **Role**: Defines a set of permissions (Artist, Studio Admin, Supplier, Moderator).
- **Permission**: Fine-grained action (e.g., `collection:write`, `catalog:publish`, `analysis:execute`).
- **UserSession**: Tracks active authentication tokens, MFA factors, and login metadata.
- **AuditEvent**: Immutable log of actions taken by users or services.

### 2.2 Artist Studios & Collections
- **Organization**: Top-level tenant for multi-studio communities or vendor accounts; owns users and catalogs.
- **ArtistProfile**: Extends `User` with studio name, torch type, preferred C.O.E., and experience level.
- **StudioCollection**: Grouping for rods, frit, or finished pieces managed by an artist or studio.
- **CollectionItem**: Individual entry referencing a vendor product, personal batch notes, kiln schedules, and associated media.
- **ProcessingConfig**: Parameter set describing preprocessing steps, model versions, lighting presets, and output formats.

### 2.3 Vendor Catalog & Community Intelligence
- **Vendor**: Supplier such as Mountain Glass or ABR Imagery with contact metadata and integration credentials.
- **GlassProduct**: Catalog entry with attributes like manufacturer, C.O.E., color family, opacity, and official photos.
- **GlassBatch**: Vendor-reported or community-verified batch that may include formulation notes, strike guidance, and availability.
- **CommunitySample**: Artist-submitted asset linked to a collection item and optionally mapped to a vendor product or batch.
- **Asset**: Raw image or video frame stored in object storage with metadata (capture device, lighting, annealing schedule).
- **AssetAnnotation**: Optional masks, color swatches, or text notes applied by contributors or moderators.
- **AnalysisJob**: Represents a single invocation of the processing pipeline for one or more assets.
- **ColorMeasurement**: Detailed results per asset (dominant colors, LAB values, strike shift metrics, delta-E comparisons).
- **BehaviorInsight**: Summaries of kiln or flame behavior derived from repeated submissions (e.g., strike time, preferred atmosphere).
- **TrainingDataset**: Snapshot of curated assets and labels used for model training or fine-tuning.
- **VarianceAlert**: Triggered when measurements exceed tolerance thresholds or deviate from vendor references; may spawn notifications.
- **Report**: Generated artifact summarizing collection results, community trends, or vendor analytics.
- **WebhookEvent**: Outbound integration payload triggered by job completion, moderation events, or vendor alerts.

## 3. Entity Relationship Diagram (ERD)
```
Organization 1---* ArtistProfile 1---* StudioCollection 1---* CollectionItem
CollectionItem 1---* CommunitySample *---* Asset
Vendor 1---* GlassProduct 1---* GlassBatch
GlassProduct 1---* CollectionItem
AnalysisJob 1---* ColorMeasurement
AnalysisJob 1---* BehaviorInsight
TrainingDataset *---* CommunitySample
CollectionItem 1---* ProcessingConfig
User *---* Role *---* Permission
User 1---* AuditEvent
AnalysisJob 1---* Report
AnalysisJob 1---* WebhookEvent
AnalysisJob 1---* VarianceAlert
```

## 4. Logical Schema (PostgreSQL)

### 4.1 Identity & Access Tables
- `users`
  - `id` (UUID, PK)
  - `organization_id` (UUID, FK -> organizations.id)
  - `email`, `password_hash`, `status`
  - `mfa_secret`, `last_login_at`
  - Timestamps and soft-delete flag
- `roles`
  - `id` (UUID, PK)
  - `organization_id` (UUID, nullable, FK)
  - `name`, `description`
- `role_permissions`
  - `role_id` (FK -> roles.id)
  - `permission` (text)
  - Composite PK (`role_id`, `permission`)
- `user_roles`
  - `user_id` (FK -> users.id)
  - `role_id` (FK -> roles.id)
  - Composite PK (`user_id`, `role_id`)
- `audit_events`
  - `id` (UUID, PK)
  - `actor_user_id`, `actor_service`
  - `action`, `target_type`, `target_id`
  - `metadata` (JSONB)
  - `occurred_at`

### 4.2 Artist, Vendor & Workflow Tables
- `organizations`
  - `id` (UUID, PK)
  - `name`, `type` (`studio`, `vendor`, `community`), `settings` (JSONB)
- `artist_profiles`
  - `id` (UUID, PK, FK -> users.id)
  - `studio_name`, `torch_type`, `preferred_coe`, `experience_level`
  - `bio`, `location`
- `vendors`
  - `id` (UUID, PK)
  - `organization_id` (FK -> organizations.id)
  - `name`, `website`, `contact_email`, `integration_settings` (JSONB)
- `glass_products`
  - `id` (UUID, PK)
  - `vendor_id` (FK -> vendors.id)
  - `manufacturer`, `sku`, `coe`, `color_name`, `color_family`, `opacity`, `finish`
  - `official_media_uri`, `notes`
- `glass_batches`
  - `id` (UUID, PK)
  - `glass_product_id` (FK -> glass_products.id)
  - `batch_code`, `release_date`, `availability_status`, `vendor_notes`
- `studio_collections`
  - `id` (UUID, PK)
  - `organization_id` (FK)
  - `artist_profile_id` (FK -> artist_profiles.id)
  - `name`, `description`, `collection_type` (`rod`, `frit`, `finished_piece`)
- `collection_items`
  - `id` (UUID, PK)
  - `studio_collection_id` (FK)
  - `glass_product_id` (nullable FK)
  - `glass_batch_id` (nullable FK)
  - `custom_label`, `annealing_schedule`, `flame_notes`, `tags` (text[])
  - `default_processing_config_id` (FK -> processing_configs.id)
- `processing_configs`
  - `id` (UUID, PK)
  - `owner_type` (`collection`, `vendor`, `system`)
  - `owner_id` (UUID)
  - `name`, `parameters` (JSONB)
  - `model_version`, `lighting_preset`
- `community_samples`
  - `id` (UUID, PK)
  - `collection_item_id` (FK -> collection_items.id)
  - `submitted_by_user_id` (FK -> users.id)
  - `glass_product_id` (nullable FK)
  - `glass_batch_id` (nullable FK)
  - `status` (`pending`, `approved`, `rejected`, `flagged`)
  - `submitted_at`, `moderated_at`, `moderated_by`
- `assets`
  - `id` (UUID, PK)
  - `community_sample_id` (FK)
  - `storage_uri`
  - `metadata` (JSONB) -- capture device, lighting, annealing cycle, flame atmosphere
  - `capture_timestamp`
- `asset_annotations`
  - `id` (UUID, PK)
  - `asset_id` (FK)
  - `type` (`bounding_box`, `mask`, `swatch`, `note`)
  - `data` (JSONB)

### 4.3 Analysis, Intelligence & Notifications Tables
- `analysis_jobs`
  - `id` (UUID, PK)
  - `community_sample_id` (FK -> community_samples.id)
  - `status`
  - `worker_id`
  - `queued_at`, `started_at`, `completed_at`
- `color_measurements`
  - `id` (UUID, PK)
  - `analysis_job_id` (FK)
  - `asset_id` (FK)
  - `color_space` (`LAB`, `RGB`, etc.)
  - `values` (JSONB)
  - `delta_e`
  - `strike_shift` (JSONB) -- before/after color vectors
  - `tolerance_breach` (boolean)
- `variance_alerts`
  - `id` (UUID, PK)
  - `analysis_job_id` (FK)
  - `asset_id` (FK)
  - `severity`, `message`
  - `acknowledged_at`
- `behavior_insights`
  - `id` (UUID, PK)
  - `collection_item_id` (FK)
  - `metric_type` (`strike_time`, `kiln_cycle`, `oxidation_response`)
  - `metric_value` (JSONB)
  - `source_analysis_ids` (UUID[])
- `training_datasets`
  - `id` (UUID, PK)
  - `name`, `description`
  - `version`
  - `snapshot_manifest` (JSONB)
  - `created_at`, `created_by`
- `reports`
  - `id` (UUID, PK)
  - `analysis_job_id` (FK)
  - `type` (`pdf`, `csv`, `json`)
  - `storage_uri`
- `webhook_events`
  - `id` (UUID, PK)
  - `analysis_job_id` (FK)
  - `endpoint`, `payload` (JSONB)
  - `status`, `response_code`
  - `sent_at`

## 5. Data Flow Lifecycle
1. **Community Submission**: Artists upload images or videos via UI/mobile app, associating them with collection items and optional vendor products. Metadata (lighting, kiln schedule, flame notes) is captured.
2. **Moderation & Catalog Linking**: Moderators or suppliers validate submissions, link them to vendor products/batches, and approve for training or catalog enrichment.
3. **Job Scheduling**: API enqueues an `analysis_job`. Worker pulls job, applies the relevant processing configuration, and runs preprocessing + analysis.
4. **Color & Behavior Measurement**: Results stored in `color_measurements` and `behavior_insights`, referencing assets, vendor references, and strike shift metrics.
5. **Model Enrichment**: Approved samples are added to `training_datasets`, which feed retraining pipelines to improve the identifier.
6. **Alerting & Reporting**: Variance alerts, supplier notifications, and community reports are generated, with downstream webhooks as needed.
7. **Audit Logging & Attribution**: All actions (uploads, approvals, moderation decisions, training usage) recorded in `audit_events` with contributor attribution.

## 6. Storage Considerations
- **Object Storage**: Use bucket per organization with lifecycle policies for archival and contributor licensing enforcement.
- **Database Sharding**: Partition `color_measurements`, `community_samples`, and `training_datasets` by organization or time to maintain performance at scale.
- **Caching**: Utilize Redis for session storage, vendor catalog lookups, moderation queues, and rate limiting.

## 7. Data Governance & Compliance
- Enforce row-level security in PostgreSQL to isolate tenant data and respect contributor licensing.
- Provide data retention policies with configurable purge schedules for community uploads and vendor catalogs.
- Support data export and deletion requests (GDPR "Right to be Forgotten") and contributor attribution reports.
- Use checksums/version hashes to ensure analysis reproducibility and training dataset integrity.

## 8. Analytics Warehouse Schema
For advanced analytics, replicate data into an OLAP warehouse using ELT pipelines (e.g., Fivetran, Airbyte).

Key tables/views:
- `fact_color_measurements`: Denormalized metrics per asset with time, color values, strike shifts, and variance results.
- `fact_behavior_insights`: Aggregated kiln and flame behavior metrics per collection item and vendor batch.
- `fact_alerts`: Alert occurrences with severity, response time, resolution.
- `dim_time`, `dim_vendor`, `dim_glass_product`, `dim_collection`, `dim_artist_profile`, `dim_color_standard`.

Example aggregation query:
```sql
SELECT
  dim_vendor.name AS vendor,
  dim_glass_product.color_name,
  date_trunc('week', fact_color_measurements.measurement_time) AS week,
  AVG(fact_color_measurements.delta_e) AS avg_delta_e,
  SUM(CASE WHEN fact_color_measurements.tolerance_breach THEN 1 ELSE 0 END) AS breach_count
FROM fact_color_measurements
JOIN dim_vendor ON fact_color_measurements.vendor_id = dim_vendor.id
JOIN dim_glass_product ON fact_color_measurements.glass_product_id = dim_glass_product.id
GROUP BY 1, 2, 3
ORDER BY 3 DESC;
```

## 9. API Payload Examples
### 9.1 Community Sample Upload (POST `/v1/collections/{collection_id}/items/{item_id}/samples`)
```json
{
  "filename": "boro_strike_test.jpg",
  "capture_timestamp": "2024-05-01T10:45:00Z",
  "metadata": {
    "torch_type": "GTT Mirage",
    "annealing_schedule": "1050F hold 1h, 2F/min ramp",
    "lighting": "5500K lightbox",
    "vendor": "Mountain Glass",
    "glass_product_id": "prod-uuid"
  }
}
```

### 9.2 Color Measurement Response (GET `/v1/analysis_jobs/{job_id}/results`)
```json
{
  "analysis_job_id": "job-uuid",
  "status": "completed",
  "assets": [
    {
      "asset_id": "asset-uuid",
      "dominant_colors": [
        { "hex": "#4B7A9B", "lab": { "l": 48.1, "a": -7.2, "b": -15.5 } }
      ],
      "delta_e": 1.2,
      "strike_shift": {
        "pre_strike_hex": "#6C9CC5",
        "post_strike_hex": "#4B7A9B",
        "annealing_schedule": "1050F hold 1h"
      },
      "tolerance_breach": false
    }
  ],
  "generated_at": "2024-05-01T11:00:00Z"
}
```

## 10. Data Quality & Validation
- Validate color spaces using standardized libraries (e.g., `colour-science`).
- Require calibration metadata (lighting, kiln schedule, flame notes) for each community submission.
- Implement automated tests verifying schema constraints and referential integrity.
- Monitor data drift in model predictions using statistical quality control charts.

## 11. Future Enhancements
- Support spectral data ingestion (multi/hyperspectral imaging) for more precise color measurements and kiln atmosphere detection.
- Introduce community labeling events and active learning loops to accelerate identifier improvements.
- Provide customer-managed encryption keys (CMEK) and secure enclaves for studios or vendors with proprietary formulations.

