
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ComplaintsCardProps {
  pendingComplaints: {
    orderId: number;
    orderNumber: string;
    complaint: { id: string; text: string; status: string; date: string };
  }[];
  complaintResponse: string;
  setComplaintResponse: (v: string) => void;
  resolveComplaint: (orderId: number, complaintId: string) => void;
}

export function ComplaintsCard({
  pendingComplaints,
  complaintResponse,
  setComplaintResponse,
  resolveComplaint,
}: ComplaintsCardProps) {
  if (pendingComplaints.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Open Complaints</CardTitle>
        <CardDescription>Address and resolve customer complaints</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingComplaints.map(({ orderId, orderNumber, complaint }) => (
            <div key={complaint.id} className="bg-red-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">Complaint for Order #{orderNumber}</p>
                  <p className="text-sm text-muted-foreground">Reported on {complaint.date}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resolveComplaint(orderId, complaint.id)}
                >
                  Mark Resolved
                </Button>
              </div>
              <p className="mt-2">{complaint.text}</p>
              <div className="mt-4">
                <Input
                  placeholder="Type your response..."
                  value={complaintResponse}
                  onChange={e => setComplaintResponse(e.target.value)}
                />
                <Button
                  className="mt-2"
                  size="sm"
                  onClick={() => setComplaintResponse('')}
                >
                  Send Response
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
