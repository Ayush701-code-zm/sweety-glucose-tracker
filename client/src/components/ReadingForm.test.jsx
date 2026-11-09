import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ReadingForm from './ReadingForm';

function setup(props = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(<ReadingForm defaultDate="2026-10-15" onSubmit={onSubmit} {...props} />);
  return { onSubmit, user: userEvent.setup() };
}

describe('ReadingForm', () => {
  test('asks for a value when it is empty', async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Add reading' }));

    expect(screen.getByText('Please enter a glucose value.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test.each(['39', '601', '120.5', 'abc'])('rejects %s as out of range', async (value) => {
    const { onSubmit, user } = setup();
    await user.type(screen.getByLabelText('Value (mg/dl)'), value);
    await user.click(screen.getByRole('button', { name: 'Add reading' }));

    expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('rejects a future date', async () => {
    const { onSubmit, user } = setup({ defaultDate: '2999-01-01' });
    await user.type(screen.getByLabelText('Value (mg/dl)'), '120');
    await user.click(screen.getByRole('button', { name: 'Add reading' }));

    expect(screen.getByText('Date cannot be in the future.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('submits a valid reading as a number', async () => {
    const { onSubmit, user } = setup();
    await user.selectOptions(screen.getByLabelText('Time slot'), 'after_lunch');
    await user.type(screen.getByLabelText('Value (mg/dl)'), '145');
    await user.click(screen.getByRole('button', { name: 'Add reading' }));

    expect(onSubmit).toHaveBeenCalledWith({ date: '2026-10-15', slot: 'after_lunch', value: 145 });
  });

  test('shows the error returned by the server', async () => {
    const error = Object.assign(new Error('You already have an After lunch reading for this date.'), {
      errors: { slot: 'You already have an After lunch reading for this date.' },
    });
    const { user } = setup({ onSubmit: vi.fn().mockRejectedValue(error) });
    await user.selectOptions(screen.getByLabelText('Time slot'), 'after_lunch');
    await user.type(screen.getByLabelText('Value (mg/dl)'), '150');
    await user.click(screen.getByRole('button', { name: 'Add reading' }));

    expect(await screen.findByText('You already have an After lunch reading for this date.')).toBeInTheDocument();
  });
});
