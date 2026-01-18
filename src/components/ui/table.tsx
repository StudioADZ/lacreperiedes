import * as React from "react";

import { cn } from "@/lib/utils";

type TableProps = React.HTMLAttributes<HTMLTableElement> & {
  /**
   * Classe appliquée au conteneur scroll (wrapper <div>).
   * N'affecte pas la table elle-même.
   */
  containerClassName?: string;
  /**
   * Props appliquées au conteneur scroll (wrapper <div>).
   * Utile pour aria-label, tabIndex, etc.
   */
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
  /**
   * Si true, n'ajoute pas le wrapper scroll et rend uniquement <table>.
   * Par défaut: false (comportement actuel conservé).
   */
  noContainer?: boolean;
};

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, containerClassName, containerProps, noContainer = false, ...props }, ref) => {
    const tableEl = (
      <table
        ref={ref}
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    );

    if (noContainer) return tableEl;

    return (
      <div
        data-slot="table-container"
        className={cn("relative w-full overflow-auto", containerClassName)}
        {...containerProps}
      >
        {tableEl}
      </div>
    );
  },
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />
  ),
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      data-slot="table-footer"
      className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  ),
);
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      data-slot="table-row"
      className={cn("border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50", className)}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      data-slot="table-head"
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      data-slot="table-cell"
      className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  ),
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} data-slot="table-caption" className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  ),
);
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
