
import React from 'react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export interface DataTableProps<T> {
  columns: {
    accessorKey: string;
    header: string;
    cell?: (info: { row: { original: T } }) => React.ReactNode;
  }[];
  data: T[];
  pagination?: boolean;
  filter?: any;
}

export function DataTable<T>({ columns, data, filter }: DataTableProps<T>) {
  const [filterValue, setFilterValue] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!filterValue) return data;
    filter(filterValue);
    return data;
  }, [data, filterValue]);

  return (
    <div>
      <div className="flex items-center py-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter records..."
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              {columns.map((column) => (
                <TableHead
                  key={column.accessorKey}
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3"
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                    <Search className="h-8 w-8 opacity-20" />
                    <p className="text-sm font-medium">No results found</p>
                    <p className="text-xs">Try adjusting your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, i) => (
                <TableRow key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  {columns.map((column) => (
                    <TableCell key={column.accessorKey} className="py-2 text-sm">
                      {column.cell
                        ? column.cell({ row: { original: row } })
                        : (row as any)[column.accessorKey]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
