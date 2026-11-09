import { useState } from 'react';
import ReadingForm from './ReadingForm';
import { glucoseLevel } from '../lib/levels';

export default function ReadingList({ readings, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);

  return (
    <ul className="reading-list">
      {readings.map((reading) => (
        <li key={reading.id} className="reading-item">
          {editingId === reading.id ? (
            <ReadingForm
              initial={{ date: reading.date, slot: reading.slot, value: String(reading.value) }}
              submitLabel="Save changes"
              onCancel={() => setEditingId(null)}
              onSubmit={async (payload) => {
                await onUpdate(reading.id, payload);
                setEditingId(null);
              }}
            />
          ) : (
            <>
              <div>
                <p className="reading-slot">{reading.slotLabel}</p>
                <p className="reading-value">
                  {reading.value} <span>mg/dl</span>
                </p>
              </div>
              <span className={`level level-${glucoseLevel(reading).tone}`}>{glucoseLevel(reading).label}</span>
              <div className="reading-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditingId(reading.id)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    if (window.confirm(`Delete the ${reading.slotLabel} reading of ${reading.value} mg/dl?`)) {
                      onDelete(reading.id);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
