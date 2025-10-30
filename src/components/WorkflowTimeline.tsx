import { useMemo } from 'react';
import type { GlassRecord } from '../types/cms';

interface WorkflowTimelineProps {
  records: GlassRecord[];
  onNavigateToCatalog: () => void;
}

const statusPriority: Record<string, number> = {
  published: 1,
  draft: 2,
  archived: 3
};

const WorkflowTimeline = ({ records, onNavigateToCatalog }: WorkflowTimelineProps) => {
  const draftCount = records.filter((record) => record.status === 'draft').length;
  const archivedCount = records.filter((record) => record.status === 'archived').length;

  const recentActivity = useMemo(() => {
    return [...records]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }, [records]);

  return (
    <section className="workflow-timeline">
      <header>
        <div>
          <h3>Production workflow</h3>
          <p>Monitor editorial status across the palette library and keep the team aligned.</p>
        </div>
        <button type="button" onClick={onNavigateToCatalog}>
          Open catalog
        </button>
      </header>

      <div className="workflow-stats">
        <article>
          <h4>Draft reviews</h4>
          <p>{draftCount} entries awaiting review</p>
          <span>Schedule a lighting evaluation and finalize photography before publishing.</span>
        </article>
        <article>
          <h4>Archive queue</h4>
          <p>{archivedCount} entries marked for archival</p>
          <span>Confirm client approval before removing from public experiences.</span>
        </article>
      </div>

      <ol>
        {recentActivity.map((record) => (
          <li key={record.id} className={`workflow-item status-${record.status}`}>
            <div className="workflow-meta">
              <span className="workflow-name">{record.name}</span>
              <span className="workflow-updated">Updated {new Date(record.updatedAt).toLocaleDateString()}</span>
            </div>
            <div className="workflow-detail">
              <span className="workflow-status" data-priority={statusPriority[record.status]}>
                {record.status}
              </span>
              <span className="workflow-note">{record.notes || 'Ready for next milestone.'}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default WorkflowTimeline;
