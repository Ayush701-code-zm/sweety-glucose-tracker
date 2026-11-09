export default function EmptyState({ title, children }) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        ○
      </div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
