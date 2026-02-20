
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const columns = [
  {
    accessorKey: "seatNumber",
    header: "Seat #",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: { row: { original: any } }) => {
      const status = row.original.status;
      if (status === "available") {
        return <Badge variant="outline">Available</Badge>;
      } else {
        return <Badge variant="default">Occupied</Badge>;
      }
    },
  },
  {
    accessorKey: "customerName",
    header: "Customer",
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
  },
  {
    accessorKey: "endDate",
    header: "End Date",
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }: { row: { original: any } }) => {
      return <span>₹{row.original.price}</span>;
    },
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }: { row: { original: any } }) => {
      return (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">View</Button>
          <Button variant="outline" size="sm">Edit</Button>
        </div>
      );
    },
  },
];
