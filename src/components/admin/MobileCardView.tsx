import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileCardViewProps<T> {
  data: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  renderTable: () => React.ReactNode;
  breakpoint?: number; // defaults to 768 (useIsMobile)
}

/**
 * Renders a mobile card view on small screens and the provided table on desktop.
 * Usage:
 *   <MobileCardView
 *     data={bookings}
 *     renderCard={(b, i) => <BookingCard key={b.id} booking={b} />}
 *     renderTable={() => <Table>...</Table>}
 *   />
 */
export function MobileCardView<T>({ data, renderCard, renderTable }: MobileCardViewProps<T>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-3 p-3">
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">No records found.</div>
        ) : (
          data.map((item, index) => renderCard(item, index))
        )}
      </div>
    );
  }

  return <>{renderTable()}</>;
}
