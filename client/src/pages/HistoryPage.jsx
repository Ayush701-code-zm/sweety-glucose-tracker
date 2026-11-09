import { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState';
import { api } from '../lib/api';
import { formatDate } from '../lib/dates';

const PAGE_SIZE = 20;

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .listReadings({ page, limit: PAGE_SIZE })
      .then(setResult)
      .catch((err) => setError(err.message));
  }, [page]);

  const pagination = result?.pagination;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>History</h1>
          <p className="muted">Every reading you have logged, newest first.</p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <section className="card">
        {result && result.data.length === 0 ? (
          <EmptyState title="No readings yet">Your readings will be listed here once you add some.</EmptyState>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time slot</th>
                <th className="num">Value (mg/dl)</th>
              </tr>
            </thead>
            <tbody>
              {result?.data.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.date)}</td>
                  <td>{r.slotLabel}</td>
                  <td className="num">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pagination && pagination.total > 0 && (
          <div className="pager">
            <button type="button" className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span className="muted">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} readings)
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
