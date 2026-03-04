import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Grid3X3 } from 'lucide-react';

const SEAT_W = 36;
const SEAT_H = 26;

export interface GeneratedSeat {
  number: number;
  row: number;
  col: number;
  position: { x: number; y: number };
  price: number;
  category: string;
}

interface SeatCategoryOption {
  id: string;
  name: string;
  price: number;
}

interface AutoSeatGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (seats: GeneratedSeat[]) => void;
  roomWidth: number;
  roomHeight: number;
  gridSize: number;
  existingSeatCount: number;
  categories?: SeatCategoryOption[];
}

export const AutoSeatGenerator: React.FC<AutoSeatGeneratorProps> = ({
  open,
  onOpenChange,
  onGenerate,
  roomWidth,
  roomHeight,
  gridSize,
  existingSeatCount,
  categories = [],
}) => {
  const [rows, setRows] = useState(5);
  const [seatsPerRow, setSeatsPerRow] = useState(8);
  const [price, setPrice] = useState(2000);
  const [selectedCategory, setSelectedCategory] = useState('');

  const categoryList = categories.length > 0 ? categories : [
    { id: '1', name: 'Non-AC', price: 2000 },
  ];

  // Reset category/price when dialog opens
  useEffect(() => {
    if (open) {
      const defaultCat = categoryList[0];
      setSelectedCategory(defaultCat.name);
      setPrice(defaultCat.price);
    }
  }, [open, categories]);

  const handleCategoryChange = (catName: string) => {
    setSelectedCategory(catName);
    const cat = categoryList.find(c => c.name === catName);
    if (cat) setPrice(cat.price);
  };

  const handleGenerate = () => {
    const seats: GeneratedSeat[] = [];
    let seatNumber = existingSeatCount + 1;

    const startX = 60;
    const startY = 60;
    const spacingX = SEAT_W + 6;
    const spacingY = SEAT_H + 6;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < seatsPerRow; c++) {
        const x = startX + c * spacingX;
        const y = startY + r * spacingY;

        seats.push({
          number: seatNumber++,
          row: r,
          col: c,
          position: { x, y },
          price,
          category: selectedCategory || 'Non-AC',
        });
      }
    }

    onGenerate(seats);
    onOpenChange(false);
  };

  const totalSeats = rows * seatsPerRow;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Auto Generate Seats
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Number of Rows</Label>
              <Input type="number" min={1} max={20} value={rows} onChange={(e) => setRows(+e.target.value || 1)} />
            </div>
            <div>
              <Label>Seats per Row</Label>
              <Input type="number" min={1} max={30} value={seatsPerRow} onChange={(e) => setSeatsPerRow(+e.target.value || 1)} />
            </div>
          </div>

          <div>
            <Label>Category</Label>
            <RadioGroup value={selectedCategory} onValueChange={handleCategoryChange} className="flex flex-wrap gap-3 mt-2">
              {categoryList.map(cat => (
                <div key={cat.id || cat.name} className="flex items-center space-x-1.5">
                  <RadioGroupItem value={cat.name} id={`gen-cat-${cat.name}`} />
                  <Label htmlFor={`gen-cat-${cat.name}`} className="text-sm cursor-pointer">
                    {cat.name} (₹{cat.price})
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label>Price per Seat (₹/month)</Label>
            <Input type="number" min={0} value={price} onChange={(e) => setPrice(+e.target.value || 0)} />
          </div>

          <div className="bg-muted rounded-lg p-3 text-sm">
            <p><strong>Preview:</strong> {totalSeats} seats in {rows} rows × {seatsPerRow} columns</p>
            <p className="text-muted-foreground">Category: {selectedCategory || 'Non-AC'} — ₹{price}/seat</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleGenerate}>Generate {totalSeats} Seats</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
