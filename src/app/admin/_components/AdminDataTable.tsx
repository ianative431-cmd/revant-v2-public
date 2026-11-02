type Cell = string | number | null;

export type AdminColumn = { key: string; label: string };

export default function AdminDataTable({
  columns,
  rows,
  emptyLabel = "Aucun enregistrement pour le moment.",
}: {
  columns: AdminColumn[];
  rows: Array<Record<string, Cell>>;
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return <div className="rounded-2xl border border-dashed border-black/15 bg-white px-6 py-10 text-center text-sm text-black/45">{emptyLabel}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-black/5 bg-black/[0.02] text-[11px] uppercase tracking-wide text-black/45">
          <tr>{columns.map((column) => <th key={column.key} className="px-4 py-3 font-semibold">{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id ?? index)} className="border-b border-black/5 last:border-0">
              {columns.map((column) => <td key={column.key} className="max-w-[280px] truncate px-4 py-3 text-black/75">{row[column.key] ?? "—"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
