
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Truck, Clock, AlertCircle } from "lucide-react";

interface DashboardSummaryCardsProps {
  pending: number;
  processing: number;
  ready: number;
  complaints: number;
}

export function DashboardSummaryCards({
  pending = 0,
  processing = 0,
  ready = 0,
  complaints = 0,
}: DashboardSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
            <p className="text-3xl font-bold">{pending}</p>
            <p className="text-sm text-muted-foreground">Pending Pickups</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Package className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-3xl font-bold">{processing}</p>
            <p className="text-sm text-muted-foreground">Being Processed</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Truck className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-3xl font-bold">{ready}</p>
            <p className="text-sm text-muted-foreground">Ready for Delivery</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-3xl font-bold">{complaints}</p>
            <p className="text-sm text-muted-foreground">Open Complaints</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
