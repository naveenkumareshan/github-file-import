
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from "react-day-picker";
import { FileSpreadsheet, FileBarChart } from "lucide-react";
import SeatTransferManagement from "@/components/admin/SeatTransferManagement";
import { SeatTransferManagementHistory } from "@/components/admin/SeatTransferManagementHistory";

const SeatTransferManagementPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  // Track which tab is currently active for export context
  const [activeTab, setActiveTab] = useState<
    "seattransfer" | "seattransferhistory"
  >("seattransfer");


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <div className=" ">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Seat Transfer Management</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 mb-6">
          <Tabs
            defaultValue="seattransfer"
            className="space-y-4 w-full"
            onValueChange={(value) =>
              setActiveTab(value as "seattransfer" | "seattransferhistory")
            }
          >
            <TabsList className="bg-background border border-border/50 p-1">
              <TabsTrigger
                value="seattransfer"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <FileBarChart className="h-4 w-4" />
                <span>Seat Transfer</span>
              </TabsTrigger>
              <TabsTrigger
                value="seattransferhistory"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Seat Transfer History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="seattransfer" className="space-y-4 mt-6">
              <SeatTransferManagement />
            </TabsContent>
            <TabsContent value="seattransferhistory" className="space-y-4 mt-6">
              <SeatTransferManagementHistory />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SeatTransferManagementPage;
