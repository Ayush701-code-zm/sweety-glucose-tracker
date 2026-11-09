import { useId, useState } from 'react';
import { SLOTS } from '../lib/slots';
import { todayIso } from '../lib/dates';
import { validateReading } from '../lib/validation';

const EMPTY = { date: '', slot: SLOTS[0].key, value: '' };

export default function ReadingForm({ initial, defaultDate, onSubmit, onCancel, submitLabel = 'Add reading' }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    date: defaultDate || todayIso(),
    ...initial,
    value: initial?.value ?? '',
  }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const id = useId();

  function update(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      setFormError('');
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validateReading(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await onSubmit({ date: form.date, slot: form.slot, value: Number(form.value) });
      if (!initial) setForm((prev) => ({ ...prev, value: '' }));
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="reading-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor={`${id}-date`}>Date</label>
        <input
          id={`${id}-date`}
          name="date"
          type="date"
          max={todayIso()}
          value={form.date}
          onChange={update('date')}
        />
        {errors.date && <p className="field-error" role="alert">{errors.date}</p>}
      </div>

      <div className="field">
        <label htmlFor={`${id}-slot`}>Time slot</label>
        <select id={`${id}-slot`} name="slot" value={form.slot} onChange={update('slot')}>
          {SLOTS.map((slot) => (
            <option key={slot.key} value={slot.key}>
              {slot.label}
            </option>
          ))}
        </select>
        {errors.slot && <p className="field-error" role="alert">{errors.slot}</p>}
      </div>

      <div className="field">
        <label htmlFor={`${id}-value`}>Value (mg/dl)</label>
        <input
          id={`${id}-value`}
          name="value"
          type="text"
          inputMode="numeric"
          placeholder="e.g. 110"
          value={form.value}
          onChange={update('value')}
        />
        {errors.value && <p className="field-error" role="alert">{errors.value}</p>}
      </div>

      {formError && !Object.values(errors).includes(formError) && (
        <p className="form-error" role="alert">
          {formError}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
