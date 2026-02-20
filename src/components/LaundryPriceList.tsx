
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shirt } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LaundryItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  icon: string;
}

interface LaundryPriceListProps {
  onItemsSelected?: (items: LaundryItem[]) => void;
}

export function LaundryPriceList({ onItemsSelected }: LaundryPriceListProps) {
  const [items, setItems] = useState<LaundryItem[]>([
    { id: 1, name: 'T-Shirt', price: 15, quantity: 0, icon: '👕' },
    { id: 2, name: 'Shirt', price: 20, quantity: 0, icon: '👔' },
    { id: 3, name: 'Pants', price: 25, quantity: 0, icon: '👖' },
    { id: 4, name: 'Jeans', price: 30, quantity: 0, icon: '👖' },
    { id: 5, name: 'Bedsheet', price: 40, quantity: 0, icon: '🛏️' },
    { id: 6, name: 'Pillow Cover', price: 15, quantity: 0, icon: '🛏️' },
  ]);

  useEffect(() => {
    if (onItemsSelected) {
      onItemsSelected(items);
    }
  }, [items, onItemsSelected]);

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity >= 0) {
      const updatedItems = items.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
      setItems(updatedItems);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shirt className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Laundry Price List</h2>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Price (₹)</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </div>
              </TableCell>
              <TableCell>₹{item.price}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                    className="w-20 text-center"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </TableCell>
              <TableCell>₹{item.price * item.quantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end">
        <div className="bg-accent/30 p-4 rounded-lg">
          <p className="text-lg font-semibold">Total Amount: ₹{totalAmount}</p>
        </div>
      </div>
    </div>
  );
}
