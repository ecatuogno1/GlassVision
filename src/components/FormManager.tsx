import { FormEvent, useMemo, useState } from 'react';
import { canPerform, useCmsData } from '../context/CmsDataContext';
import type { FormDefinition, FormSubmission, UserRole } from '../types/cms';

interface FormManagerProps {
  role: UserRole;
  actor: string;
}

function createBlankForm(actor: string): FormDefinition {
  const now = new Date().toISOString();
  return {
    id: '',
    name: '',
    description: '',
    fields: [],
    submissions: [],
    updatedAt: now,
    owner: actor,
  };
}

function FormManager({ role, actor }: FormManagerProps) {
  const { forms, permissionMap, upsertForm, updateSubmissionStatus, enqueueToast } = useCmsData();
  const [selectedId, setSelectedId] = useState<string | null>(forms[0]?.id ?? null);
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('view');
  const [draft, setDraft] = useState<FormDefinition | null>(forms[0] ?? null);
  const [statusFilter, setStatusFilter] = useState<'all' | FormSubmission['status']>('all');

  const canCreate = canPerform(permissionMap, 'forms', role, 'create');
  const canUpdate = canPerform(permissionMap, 'forms', role, 'update');
  const filteredSubmissions = useMemo(() => {
    if (!draft) {
      return [];
    }
    return draft.submissions.filter((submission) => statusFilter === 'all' || submission.status === statusFilter);
  }, [draft, statusFilter]);

  const handleSelect = (id: string) => {
    const form = forms.find((item) => item.id === id);
    if (!form) {
      return;
    }
    setSelectedId(id);
    setDraft(form);
    setMode('view');
  };

  const handleCreate = () => {
    if (!canCreate) {
      enqueueToast({ title: 'You do not have permission to create forms', status: 'error' });
      return;
    }
    setDraft(createBlankForm(actor));
    setSelectedId(null);
    setMode('create');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft) {
      return;
    }
    const next = upsertForm(draft, actor);
    if (!next) {
      return;
    }
    setDraft(next);
    setSelectedId(next.id);
    setMode('view');
  };

  const handleStatusChange = (submission: FormSubmission, status: FormSubmission['status']) => {
    updateSubmissionStatus(submission.formId, submission.id, status, actor);
  };

  return (
    <div className="form-manager">
      <aside className="form-sidebar" aria-label="Forms">
        <header>
          <h3>Forms</h3>
          <p>Manage capture points and review submissions.</p>
        </header>
        <ul>
          {forms.map((form) => (
            <li key={form.id}>
              <button
                type="button"
                className={form.id === selectedId ? 'active' : ''}
                onClick={() => handleSelect(form.id)}
              >
                <strong>{form.name}</strong>
                <span>{form.submissions.length} submissions</span>
              </button>
            </li>
          ))}
        </ul>
        <footer>
          <button type="button" onClick={handleCreate} disabled={!canCreate} className="primary">
            New form
          </button>
        </footer>
      </aside>

      <section className="form-detail" aria-live="polite">
        {!draft && <p>Select or create a form to manage it.</p>}
        {draft && (
          <form onSubmit={handleSubmit} className="form-editor">
            <header>
              <div>
                <h3>{draft.name || 'Untitled form'}</h3>
                <p>Last updated {new Date(draft.updatedAt).toLocaleString()}</p>
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
                <button type="submit" className="primary" disabled={mode === 'view' || (!canUpdate && mode !== 'create')}>
                  Save
                </button>
              </div>
            </header>

            <label>
              <span>Name</span>
              <input
                type="text"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                disabled={mode === 'view' || (!canUpdate && mode !== 'create')}
                required
              />
            </label>

            <label>
              <span>Description</span>
              <textarea
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                rows={3}
                disabled={mode === 'view' || (!canUpdate && mode !== 'create')}
              />
            </label>

            <section className="submission-panel" aria-labelledby="submissions-heading">
              <header>
                <div>
                  <h4 id="submissions-heading">Submissions</h4>
                  <p>{draft.submissions.length} total</p>
                </div>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
                  <option value="all">All statuses</option>
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </header>
              <ul>
                {filteredSubmissions.map((submission) => (
                  <li key={submission.id}>
                    <div>
                      <strong>{submission.submittedBy}</strong>
                      <span>{new Date(submission.submittedAt).toLocaleString()}</span>
                      <dl>
                        {Object.entries(submission.values).map(([field, value]) => (
                          <div key={field}>
                            <dt>{field}</dt>
                            <dd>{String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    <div>
                      <select
                        value={submission.status}
                        onChange={(event) => handleStatusChange(submission, event.target.value as FormSubmission['status'])}
                      >
                        <option value="new">New</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </li>
                ))}
                {filteredSubmissions.length === 0 && <li className="empty">No submissions match the selected filter.</li>}
              </ul>
            </section>
          </form>
        )}
      </section>
    </div>
  );
}

export default FormManager;
