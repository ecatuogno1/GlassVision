import { useEffect } from 'react';
import { useCmsData } from '../context/CmsDataContext';

function ToastHost() {
  const { toastQueue, removeToast } = useCmsData();

  useEffect(() => {
    if (toastQueue.length === 0) {
      return;
    }
    const timers = toastQueue.map((toast) =>
      window.setTimeout(() => {
        removeToast(toast.id);
      }, 6000),
    );
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toastQueue, removeToast]);

  if (toastQueue.length === 0) {
    return null;
  }

  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toastQueue.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.status}`}>
          <div className="toast-header">
            <strong>{toast.title}</strong>
            <button type="button" onClick={() => removeToast(toast.id)} aria-label="Dismiss notification">
              ×
            </button>
          </div>
          {toast.description && <p>{toast.description}</p>}
        </div>
      ))}
    </div>
  );
}

export default ToastHost;
