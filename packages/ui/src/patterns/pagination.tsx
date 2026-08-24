import { Button } from '../components/button'

export interface PaginationProps {
  onPageChange: (page: number) => void
  page: number
  pageCount: number
}

export function Pagination({ onPageChange, page, pageCount }: PaginationProps) {
  const safePageCount = Math.max(1, pageCount)
  const currentPage = Math.min(Math.max(1, page), safePageCount)

  return (
    <nav aria-label="Pagination" className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {safePageCount}
      </p>
      <div className="flex gap-2">
        <Button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          Previous
        </Button>
        <Button
          disabled={currentPage >= safePageCount}
          onClick={() => onPageChange(currentPage + 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          Next
        </Button>
      </div>
    </nav>
  )
}
