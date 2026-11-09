import { useEffect, useState } from 'react';
import ReportCard from '../components/ReportCard';
import TrendChart from '../components/TrendChart';
import { api } from '../lib/api';
import { todayIso } from '../lib/dates';

export default function ReportsPage() {
  const [date, setDate] = useState(todayIso());
  const [reports, setReports] = useState(null);
  const [trend, setTrend] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!date) return;
    let active = true;
    Promise.all([api.reports(date), api.trend(date)])
      .then(([reportData, trendData]) => {
        if (!active) return;
        setReports(reportData);
        setTrend(trendData.points);
        setError('');
      })
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [date]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p className="muted">Pick a date to see that day, the month so far and the whole previous month.</p>
        </div>
        <div className="field field-inline">
          <label htmlFor="report-date">Selected date</label>
          <input id="report-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      {reports && (
        <>
          <div className="grid-3">
            <ReportCard title="Daily" report={reports.daily}>
              <ul className="slot-list">
                {reports.daily.readings.map((r) => (
                  <li key={r.id}>
                    <span>{r.slotLabel}</span>
                    <strong>{r.value} mg/dl</strong>
                  </li>
                ))}
              </ul>
            </ReportCard>
            <ReportCard title="Month to date" report={reports.monthToDate} />
            <ReportCard title="Previous month" report={reports.monthly} />
          </div>

          {trend.length > 0 && (
            <section className="card">
              <div className="card-header">
                <h2>This month at a glance</h2>
                <span className="muted small">Daily average, highest and lowest (mg/dl)</span>
              </div>
              <TrendChart points={trend} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
