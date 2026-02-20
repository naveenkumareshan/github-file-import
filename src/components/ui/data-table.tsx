
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

export  interface DataTableProps<T> {
  columns: {
    accessorKey: string;
    header: string;
    cell?: (info: { row: { original: T } }) => React.ReactNode;
  }[];
  data: T[];
  pagination?: boolean; // Add optional pagination prop
  filter?: any;
}

export function DataTable<T>({ columns, data, filter }: DataTableProps<T>) {
  const [filterValue, setFilterValue] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!filterValue) return data;
      filter(filterValue)
    return data;
  
  }, [data, filterValue]);

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter records..."
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.accessorKey}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((column) => (
                    <TableCell key={column.accessorKey}>
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
