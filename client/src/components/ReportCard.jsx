import EmptyState from './EmptyState';
import { formatRange } from '../lib/dates';

export default function ReportCard({ title, report, children }) {
  const hasData = report && report.count > 0;

  return (
    <section className="card report-card">
      <div className="card-header">
        <h2>{title}</h2>
        {report && <span className="muted small">{formatRange(report.from, report.to)}</span>}
      </div>

      {hasData ? (
        <>
          <dl className="stats">
            <div>
              <dt>Highest</dt>
              <dd>{report.highest}</dd>
            </div>
            <div>
              <dt>Lowest</dt>
              <dd>{report.lowest}</dd>
            </div>
            <div>
              <dt>Average</dt>
              <dd>{report.average.toFixed(1)}</dd>
            </div>
            <div>
              <dt>Readings</dt>
              <dd>{report.count}</dd>
            </div>
          </dl>
          <p className="muted small">Values in mg/dl</p>
          {children}
        </>
      ) : (
        <EmptyState title="No readings in this period">Once you log readings, your summary will show up here.</EmptyState>
      )}
    </section>
  );
}
