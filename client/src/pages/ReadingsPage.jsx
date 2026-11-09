import { useCallback, useEffect, useState } from 'react';
import ReadingForm from '../components/ReadingForm';
import ReadingList from '../components/ReadingList';
import EmptyState from '../components/EmptyState';
import { api } from '../lib/api';
import { formatDate, todayIso } from '../lib/dates';

export default function ReadingsPage() {
  const [date, setDate] = useState(todayIso());
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.listReadings({ from: date, to: date, limit: 10 });
      setReadings(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  function flash(message) {
    setNotice(message);
    setTimeout(() => setNotice(''), 2500);
  }

  async function handleCreate(payload) {
    await api.createReading(payload);
    if (payload.date !== date) setDate(payload.date);
    else await load();
    flash('Reading saved.');
  }

  async function handleUpdate(id, payload) {
    await api.updateReading(id, payload);
    await load();
    flash('Reading updated.');
  }

  async function handleDelete(id) {
    try {
      await api.deleteReading(id);
      await load();
      flash('Reading deleted.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Readings</h1>
          <p className="muted">Record up to 4 readings a day, one for each time slot.</p>
        </div>
        <div className="field field-inline">
          <label htmlFor="day-picker">Showing</label>
          <input id="day-picker" type="date" max={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {notice && <p className="notice">{notice}</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="grid-2">
        <section className="card">
          <h2>Add a reading</h2>
          <ReadingForm key={date} defaultDate={date} onSubmit={handleCreate} />
        </section>

        <section className="card">
          <div className="card-header">
            <h2>{formatDate(date)}</h2>
            <span className="pill">{readings.length} of 4 logged</span>
          </div>
          {loading ? (
            <p className="muted">Loading...</p>
          ) : readings.length === 0 ? (
            <EmptyState title="No readings for this day yet">Add your first reading using the form.</EmptyState>
          ) : (
            <ReadingList readings={readings} onUpdate={handleUpdate} onDelete={handleDelete} />
          )}
        </section>
      </div>
    </div>
  );
}
