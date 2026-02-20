
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Key, Check, Package, Truck, Clock } from "lucide-react";

// --- NEW: laundry menu item interface
interface LaundryMenuItem {
  id: number;
  icon: string;
  name: string;
  price: number;
}
interface LaundryItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  icon: string;
}
interface PickupLocation {
  roomNumber: string;
  block: string;
  floor: string;
  pickupTime?: string;
}
interface LaundryOrder {
  id: number;
  orderNumber: string;
  requestDate: string;
  status: string;
  clothesCount: string;
  items: LaundryItem[];
  totalAmount: number;
  pickupLocation: PickupLocation;
  deliveryDate?: string;
  complaints?: { id: string; text: string; status: string; date: string }[];
}

interface OrderTableProps {
  orders: LaundryOrder[];
  tab: "pending" | "completed";
  addingItem: {[orderId: number]: boolean};
  setAddingItem: (v: {[orderId: number]: boolean}) => void;
  newItem: {[orderId: number]: {icon: string; name: string; price: number; quantity: number}};
  setNewItem: (v: {[orderId: number]: {icon: string; name: string; price: number; quantity: number}}) => void;
  otpInputs: {[orderId: number]: string};
  handleOtpInputChange: (oid: number, value: string) => void;
  orderOtps: {[id: number]: string};
  handleAddItem: (orderId: number) => void;
  updateOrderStatus: (orderId: number, newStatus: string) => void;
  completeOrder: (orderId: number) => void;
  // --- NEW: menuItems for item picking
  menuItems: LaundryMenuItem[];
}

export function OrderTable({
  orders,
  tab,
  addingItem,
  setAddingItem,
  newItem,
  setNewItem,
  otpInputs,
  handleOtpInputChange,
  orderOtps,
  handleAddItem,
  updateOrderStatus,
  completeOrder,
  menuItems,
}: OrderTableProps) {
  if (tab === "pending") {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(order => (
            <TableRow key={order.id}>
              <TableCell>
                <div>
                  <p className="font-medium">#{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">₹{order.totalAmount}</p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-xs">{order.requestDate}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {order.pickupLocation.pickupTime}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs flex flex-col gap-1">
                  {order.items.map((item) => (
                    <span key={item.id} className="flex items-center gap-1">
                      <span className="inline-block w-5 h-5">{item.icon}</span>
                      <span>{item.name} x {item.quantity}</span>
                      <span className="text-gray-400 ml-1">₹{item.price * item.quantity}</span>
                    </span>
                  ))}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mt-1 h-6 w-6"
                    onClick={() => setAddingItem({ ...addingItem, [order.id]: !addingItem[order.id] })}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  {addingItem[order.id] && (
                    <div className="flex flex-col gap-1 bg-purple-50 rounded p-2 mt-1">
                      <div className="flex gap-1 mb-1">
                        {/* NEW: Pick from menuItems dropdown */}
                        {menuItems.length > 0 && (
                          <select
                            className="border rounded px-1 text-sm"
                            value=""
                            onChange={e => {
                              const found = menuItems.find(i => i.id === Number(e.target.value));
                              if (found) {
                                setNewItem({
                                  ...newItem,
                                  [order.id]: {
                                    ...(newItem[order.id] || {icon:'',name:'',price:0,quantity:1}),
                                    icon: found.icon,
                                    name: found.name,
                                    price: found.price
                                  }
                                });
                              }
                            }}
                          >
                            <option value="">Select from menu</option>
                            {menuItems.map(item => (
                              <option key={item.id} value={item.id}>
                                {item.icon} {item.name} (₹{item.price})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <input type="text" placeholder="🧥" value={newItem[order.id]?.icon || ""} maxLength={2}
                          className="w-10 text-center border rounded"
                          onChange={e => setNewItem({
                            ...newItem, [order.id]: { ...(newItem[order.id] || {icon:'',name:'',price:0,quantity:1}), icon: e.target.value }
                          })} />
                        <input type="text" placeholder="Name" className="border rounded px-1 flex-1"
                          value={newItem[order.id]?.name || ""}
                          onChange={e => setNewItem({
                            ...newItem, [order.id]: { ...(newItem[order.id] || {icon:'',name:'',price:0,quantity:1}), name: e.target.value }
                          })} />
                        <input type="number" placeholder="Price" min={1} className="border w-14 rounded px-1"
                          value={newItem[order.id]?.price || ""}
                          onChange={e => setNewItem({
                            ...newItem, [order.id]: { ...(newItem[order.id] || {icon:'',name:'',price:0,quantity:1}), price: parseInt(e.target.value || "0", 10)}
                          })} />
                        <input type="number" placeholder="Qty" min={1} className="border w-12 rounded px-1"
                          value={newItem[order.id]?.quantity || 1}
                          onChange={e => setNewItem({
                            ...newItem, [order.id]: { ...(newItem[order.id] || {icon:'',name:'',price:0,quantity:1}), quantity: parseInt(e.target.value || "1", 10)}
                          })} />
                        <Button variant="outline" size="sm" onClick={() => handleAddItem(order.id)}>Add</Button>
                      </div>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  <p>Room {order.pickupLocation.roomNumber}</p>
                  <p className="text-muted-foreground">
                    Block {order.pickupLocation.block}, Floor {order.pickupLocation.floor}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  order.status === 'Processing'
                    ? 'bg-amber-100 text-amber-800'
                    : order.status === 'Picked Up'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {order.status}
                </span>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs">
                    <Key className="h-4 w-4" />
                    <span>
                      OTP: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                        {orderOtps[order.id]}
                      </span>
                    </span>
                  </div>
                  {(order.status !== 'Ready for Delivery' && order.status !== 'Delivered') && (
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      value={otpInputs[order.id] || ""}
                      className="border px-1 py-0.5 rounded w-20 text-xs mt-1"
                      onChange={e => handleOtpInputChange(order.id, e.target.value)}
                    />
                  )}
                  {order.status === 'Processing' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      disabled={otpInputs[order.id] !== orderOtps[order.id]}
                      onClick={() => updateOrderStatus(order.id, 'Picked Up')}
                    >
                      <Check className="h-3 w-3" /> Mark Picked Up
                    </Button>
                  )}
                  {order.status === 'Picked Up' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        disabled={otpInputs[order.id] !== orderOtps[order.id]}
                        onClick={() => updateOrderStatus(order.id, 'Ready for Delivery')}
                      >
                        <Package className="h-3 w-3" /> Mark Ready
                      </Button>
                      <input
                        type="text"
                        placeholder="OTP for delivery"
                        value={otpInputs[order.id] || ""}
                        className="border px-1 py-0.5 rounded w-20 text-xs mt-1"
                        onChange={e => handleOtpInputChange(order.id, e.target.value)}
                      />
                    </>
                  )}
                  {order.status === 'Ready for Delivery' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      disabled={otpInputs[order.id] !== orderOtps[order.id]}
                      onClick={() => completeOrder(order.id)}
                    >
                      <Truck className="h-3 w-3" /> Mark Delivered
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  } else {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(order => (
            <TableRow key={order.id}>
              <TableCell>
                <div>
                  <p className="font-medium">#{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">₹{order.totalAmount}</p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-xs">{order.requestDate}</p>
                  <p className="text-xs text-muted-foreground">
                    Delivered: {order.deliveryDate}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  {order.items.map(item => (
                    <p key={item.id} className="flex items-center gap-1">
                      <span className="inline-block w-5 h-5">{item.icon}</span>
                      <span>{item.name} x {item.quantity}</span>
                      <span className="text-gray-400 ml-1">₹{item.price * item.quantity}</span>
                    </p>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  <p>Room {order.pickupLocation.roomNumber}</p>
                  <p className="text-muted-foreground">
                    Block {order.pickupLocation.block}, Floor {order.pickupLocation.floor}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                  {order.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
}
