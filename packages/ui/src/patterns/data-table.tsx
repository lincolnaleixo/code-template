import type { ReactNode } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/table'
import { cn } from '../utils'

export interface DataTableColumn<T> {
  cell: (row: T) => ReactNode
  className?: string
  header: ReactNode
  id: string
}

export interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>
  empty?: ReactNode
  getRowKey: (row: T) => string
  rows: T[]
}

export function DataTable<T>({ columns, empty = 'No results.', getRowKey, rows }: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead className={column.className} key={column.id}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell className="h-28 text-center text-muted-foreground" colSpan={columns.length}>
              {empty}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={getRowKey(row)}>
              {columns.map((column) => (
                <TableCell className={cn(column.className)} key={column.id}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
