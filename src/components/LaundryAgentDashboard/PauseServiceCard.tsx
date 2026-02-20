
import React from "react";
import { Button } from "@/components/ui/button";
import { Pause } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PauseServiceCardProps {
  isPaused: boolean;
  pauseUntil: string;
  setPauseUntil: (v: string) => void;
  handlePauseUpdate: () => void;
  resumeService: () => void;
}

export function PauseServiceCard({
  isPaused,
  pauseUntil,
  setPauseUntil,
  handlePauseUpdate,
  resumeService,
}: PauseServiceCardProps) {
  return (
    <Card className="bg-soft-yellow">
      <CardContent className="flex items-center gap-4 py-5">
        <Pause className="text-amber-500" />
        {isPaused ? (
          <div className="flex-1">
            <span className="font-bold">Service paused</span> until{" "}
            <span className="text-amber-900">{pauseUntil}</span>
            <Button onClick={resumeService} variant="outline" size="sm" className="ml-4">
              Resume Service
            </Button>
          </div>
        ) : (
          <form
            className="flex items-center gap-2 flex-wrap"
            onSubmit={e => {
              e.preventDefault();
              handlePauseUpdate();
            }}
          >
            <label className="font-medium text-sm pr-2">
              Pause laundry services until:
            </label>
            <input
              type="datetime-local"
              value={pauseUntil}
              onChange={e => setPauseUntil(e.target.value)}
              className="border p-1 rounded text-sm"
            />
            <Button type="submit" size="sm" variant="outline">
              Pause
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
