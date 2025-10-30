import { useMemo } from 'react';
import { useCmsData } from '../context/CmsDataContext';
import type { ContentEntity } from '../types/cms';

interface DashboardAnalyticsProps {
  onNavigate: (view: string) => void;
}

const entityLabels: Record<ContentEntity, string> = {
  projects: 'Projects',
  services: 'Services',
  blog: 'Blog',
  portfolio: 'Portfolio',
  staff: 'Staff',
  clients: 'Clients',
};

function DashboardAnalytics({ onNavigate }: DashboardAnalyticsProps) {
  const { analytics, content, forms, activity, refreshAnalytics } = useCmsData();

  const totals = useMemo(() => {
    const now = new Date();
    const summary = (Object.keys(content) as ContentEntity[]).map((key) => {
      const entries = content[key];
      const published = entries.filter((entry) => entry.status === 'published').length;
      const scheduled = entries.filter((entry) => entry.status === 'scheduled').length;
      const drafts = entries.filter((entry) => entry.status === 'draft' || entry.status === 'review').length;
      const velocity = entries.reduce((acc, entry) => {
        const updated = new Date(entry.updatedAt);
        const diff = Math.max(1, (now.getTime() - updated.getTime()) / 86400000);
        return acc + 1 / diff;
      }, 0);
      return {
        key,
        label: entityLabels[key],
        total: entries.length,
        published,
        scheduled,
        drafts,
        velocity: Math.round(velocity * 10) / 10,
      };
    });
    return summary;
  }, [content]);

  const topForms = useMemo(() => {
    return forms
      .map((form) => ({
        id: form.id,
        name: form.name,
        submissions: form.submissions.length,
        pending: form.submissions.filter((submission) => submission.status !== 'resolved').length,
      }))
      .sort((a, b) => b.submissions - a.submissions)
      .slice(0, 4);
  }, [forms]);

  const recentActivity = activity.slice(0, 6);

  return (
    <div className="dashboard-grid">
      <section className="dashboard-card analytics-summary" aria-labelledby="analytics-heading">
        <header>
          <div>
            <h3 id="analytics-heading">Content velocity</h3>
            <p>Monitor publishing momentum and identify backlogs.</p>
          </div>
          <button type="button" onClick={() => refreshAnalytics()} className="refresh-button">
            Refresh
          </button>
        </header>
        <div className="analytics-summary-grid">
          {totals.map((item) => (
            <article key={item.key}>
              <header>
                <h4>{item.label}</h4>
                <span>{item.total} total</span>
              </header>
              <dl>
                <div>
                  <dt>Published</dt>
                  <dd>{item.published}</dd>
                </div>
                <div>
                  <dt>Scheduled</dt>
                  <dd>{item.scheduled}</dd>
                </div>
                <div>
                  <dt>Draft/Review</dt>
                  <dd>{item.drafts}</dd>
                </div>
              </dl>
              <footer>
                <span className="velocity" aria-label="Content velocity">
                  {item.velocity}x velocity
                </span>
                <button type="button" onClick={() => onNavigate('content')}>
                  Manage
                </button>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-card analytics-performance" aria-labelledby="performance-heading">
        <header>
          <h3 id="performance-heading">Top performing content</h3>
          <p>Trending items are based on engagement rate over the last 7 days.</p>
        </header>
        <ul>
          {analytics.contentPerformance.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{entityLabels[item.type]} · {item.views} views</span>
              </div>
              <span className={`trend trend-${item.trend}`}>{item.trend === 'up' ? '▲' : '▼'}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="dashboard-card analytics-forms" aria-labelledby="forms-heading">
        <header>
          <h3 id="forms-heading">Form health</h3>
          <p>Resolve submissions quickly to keep momentum high.</p>
        </header>
        <ul>
          {topForms.map((form) => (
            <li key={form.id}>
              <div>
                <strong>{form.name}</strong>
                <span>{form.submissions} submissions</span>
              </div>
              <span className={form.pending > 0 ? 'status-warning' : 'status-success'}>
                {form.pending > 0 ? `${form.pending} pending` : 'All resolved'}
              </span>
            </li>
          ))}
        </ul>
        <footer>
          <button type="button" onClick={() => onNavigate('forms')}>
            View forms
          </button>
        </footer>
      </section>

      <section className="dashboard-card analytics-activity" aria-labelledby="activity-heading">
        <header>
          <h3 id="activity-heading">Latest activity</h3>
          <p>Real-time audit trail across the CMS.</p>
        </header>
        <ol className="activity-list">
          {recentActivity.map((entry) => (
            <li key={entry.id}>
              <strong>{entry.actor}</strong>
              <span>{entry.action}</span>
              <time dateTime={entry.timestamp}>{new Date(entry.timestamp).toLocaleString()}</time>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export default DashboardAnalytics;
