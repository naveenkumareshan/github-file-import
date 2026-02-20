
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, FileBarChart } from "lucide-react";
import SeatTransferManagement from "@/components/admin/SeatTransferManagement";
import { SeatTransferManagementHistory } from "@/components/admin/SeatTransferManagementHistory";

const SeatTransferManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"seattransfer" | "seattransferhistory">("seattransfer");

  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          <span>Admin Panel</span><span>/</span>
          <span className="text-foreground font-medium">Transfer Seat</span>
        </div>
        <h1 className="text-lg font-semibold tracking-tight">Transfer Seat</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage and review seat transfers across reading rooms.</p>
      </div>

      <Tabs
        defaultValue="seattransfer"
        className="space-y-4 w-full"
        onValueChange={(value) => setActiveTab(value as "seattransfer" | "seattransferhistory")}
      >
        <TabsList className="bg-background border border-border/50 p-1 h-9">
          <TabsTrigger
            value="seattransfer"
            className="flex items-center gap-2 h-7 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <FileBarChart className="h-3.5 w-3.5" />
            <span>Seat Transfer</span>
          </TabsTrigger>
          <TabsTrigger
            value="seattransferhistory"
            className="flex items-center gap-2 h-7 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Transfer History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="seattransfer" className="space-y-4 mt-4">
          <SeatTransferManagement />
        </TabsContent>
        <TabsContent value="seattransferhistory" className="space-y-4 mt-4">
          <SeatTransferManagementHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SeatTransferManagementPage;
