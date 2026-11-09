import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function dayOfMonth(iso) {
  return Number(iso.slice(8, 10));
}

export default function TrendChart({ points }) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={points} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tickFormatter={dayOfMonth} tick={{ fontSize: 12 }} />
          <YAxis domain={[40, 300]} ticks={[40, 70, 130, 180, 240, 300]} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value, name) => [`${value} mg/dl`, name]} labelFormatter={(d) => `Date ${d}`} />
          <Line type="monotone" dataKey="average" name="Daily average" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
          <Line type="monotone" dataKey="highest" name="Highest" stroke="#f59e0b" strokeWidth={1} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="lowest" name="Lowest" stroke="#0ea5e9" strokeWidth={1} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
