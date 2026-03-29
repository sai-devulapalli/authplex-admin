interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (item: T) => void
  emptyMessage?: string
  total?: number
  offset?: number
  limit?: number
  onPageChange?: (newOffset: number) => void
}

export default function DataTable<T>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data',
  total,
  offset,
  limit,
  onPageChange,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>
  }

  const pageSize = limit || 25
  const currentOffset = offset || 0

  return (
    <>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(item)}
              className={onRowClick ? 'clickable' : ''}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render
                    ? col.render(item)
                    : String((item as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {total !== undefined && onPageChange && total > pageSize && (
        <div className="pagination">
          <button
            className="btn btn-sm"
            disabled={currentOffset === 0}
            onClick={() => onPageChange(Math.max(0, currentOffset - pageSize))}
          >
            Previous
          </button>
          <span>
            {currentOffset + 1}&ndash;{Math.min(currentOffset + pageSize, total)} of {total}
          </span>
          <button
            className="btn btn-sm"
            disabled={currentOffset + pageSize >= total}
            onClick={() => onPageChange(currentOffset + pageSize)}
          >
            Next
          </button>
        </div>
      )}
    </>
  )
}
