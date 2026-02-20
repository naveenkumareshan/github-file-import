
import React, { useState } from "react";
import { PauseServiceCard } from "./PauseServiceCard";
import { DashboardSummaryCards } from "./DashboardSummaryCards";
import { OrderTable } from "./OrderTable";
import { ComplaintsCard } from "./ComplaintsCard";

// New: LaundryMenuItem interface
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
interface LaundryAgentDashboardProps {
  currentOrders: LaundryOrder[];
  pastOrders: LaundryOrder[];
  onOrderUpdate: (updatedOrders: LaundryOrder[]) => void;
  onOrderComplete: (completedOrder: LaundryOrder) => void;
}

export function LaundryAgentDashboard({
  currentOrders,
  pastOrders,
  onOrderUpdate,
  onOrderComplete,
}: LaundryAgentDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<"pending" | "completed">("pending");
  const [complaintResponse, setComplaintResponse] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [pauseUntil, setPauseUntil] = useState("");
  const [otpInputs, setOtpInputs] = useState<{ [orderId: number]: string }>({});
  const [addingItem, setAddingItem] = useState<{ [orderId: number]: boolean }>({});
  const [newItem, setNewItem] = useState<{
    [orderId: number]: { icon: string; name: string; price: number; quantity: number };
  }>({});

  // -- Laundry Menu Management START
  const [menuItems, setMenuItems] = useState<LaundryMenuItem[]>([
    { id: 1, icon: "👕", name: "T-Shirt", price: 15 },
    { id: 2, icon: "👖", name: "Jeans", price: 30 },
    { id: 3, icon: "👔", name: "Shirt", price: 20 },
    { id: 4, icon: "🛏️", name: "Bedsheet", price: 40 },
    { id: 5, icon: "🧣", name: "Towel", price: 20 },
  ]);
  const [menuInput, setMenuInput] = useState<{icon: string; name: string; price: number}>({icon:"", name:"", price:0});

  const handleMenuAdd = () => {
    if (!menuInput.icon || !menuInput.name || !menuInput.price) return;
    setMenuItems(m => [
      ...m, { ...menuInput, id: Date.now() }
    ]);
    setMenuInput({icon:"",name:"",price:0});
  };

  const handleMenuRemove = (id: number) => {
    setMenuItems(items => items.filter(item => item.id !== id));
  };
  // -- Laundry Menu Management END

  const [orderOtps] = useState(() => {
    const getRand = () => Math.floor(1000 + Math.random() * 9000).toString();
    const otps: { [id: number]: string } = {};
    currentOrders.forEach((order) => {
      otps[order.id] = getRand();
    });
    return otps;
  });

  const handlePauseUpdate = () => {
    if (!pauseUntil) {
      alert("Please choose a valid pause until date & time.");
      return;
    }
    setIsPaused(true);
  };
  const resumeService = () => {
    setPauseUntil("");
    setIsPaused(false);
  };

  const handleAddItem = (orderId: number) => {
    const order = currentOrders.find((o) => o.id === orderId);
    const details = newItem[orderId];
    if (!details?.icon || !details?.name || !details?.price || !details?.quantity) return;
    const updatedOrders = currentOrders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            items: [
              ...order.items,
              {
                id: Date.now(),
                icon: details.icon,
                name: details.name,
                price: details.price,
                quantity: details.quantity,
              },
            ],
            totalAmount: order.totalAmount + details.price * details.quantity,
          }
        : order
    );
    onOrderUpdate(updatedOrders);
    setAddingItem({ ...addingItem, [orderId]: false });
    setNewItem({ ...newItem, [orderId]: { icon: "", name: "", price: 0, quantity: 1 } });
  };

  const updateOrderStatus = (orderId: number, newStatus: string) => {
    const updatedOrders = currentOrders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    onOrderUpdate(updatedOrders);
  };

  const completeOrder = (orderId: number) => {
    const orderToComplete = currentOrders.find((order) => order.id === orderId);
    if (orderToComplete) {
      onOrderComplete(orderToComplete);
    }
  };

  const resolveComplaint = (orderId: number, complaintId: string) => {
    const updatedOrders = pastOrders.map((order) => {
      if (order.id === orderId && order.complaints) {
        const updatedComplaints = order.complaints.map((complaint) =>
          complaint.id === complaintId ? { ...complaint, status: "Resolved" } : complaint
        );
        return { ...order, complaints: updatedComplaints };
      }
      return order;
    });
    onOrderUpdate(updatedOrders);
  };

  const pendingComplaints = pastOrders
    .filter((order) => order.complaints && order.complaints.some((c) => c.status !== "Resolved"))
    .flatMap((order) => {
      return (order.complaints || [])
        .filter((complaint) => complaint.status !== "Resolved")
        .map((complaint) => ({
          orderId: order.id,
          orderNumber: order.orderNumber,
          complaint,
        }));
    });

  const activeOrders = currentOrders.filter((order) => order.status !== "Delivered");
  const pendingOrders = activeOrders.filter((order) => order.status === "Processing");
  const pickedUpOrders = activeOrders.filter((order) => order.status === "Picked Up");
  const readyOrders = activeOrders.filter((order) => order.status === "Ready for Delivery");

  const handleOtpInputChange = (orderId: number, value: string) => {
    setOtpInputs({ ...otpInputs, [orderId]: value });
  };

  return (
    <div className="space-y-8">
      {/* --- Laundry Menu Management Card --- */}
      <div className="bg-white shadow rounded p-4">
        <h3 className="font-serif font-bold text-lg mb-2">Laundry Menu</h3>
        <p className="text-sm text-muted-foreground mb-4">Add or remove laundry items available for orders.</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {menuItems.map(item => (
            <span key={item.id} className="inline-flex items-center bg-accent/40 px-3 py-1 rounded-full text-sm mr-2">
              <span className="mr-1">{item.icon}</span>
              {item.name} <span className="mx-1 text-xs text-muted-foreground">₹{item.price}</span>
              <button onClick={() => handleMenuRemove(item.id)} className="ml-1 px-1 text-red-500 hover:bg-red-100 rounded transition-colors" title="Remove">&times;</button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="🧥" maxLength={2} value={menuInput.icon} onChange={e=>setMenuInput({...menuInput,icon:e.target.value})} className="w-10 text-center border rounded" />
          <input type="text" placeholder="Item name" value={menuInput.name} onChange={e=>setMenuInput({...menuInput,name:e.target.value})} className="border rounded px-2" />
          <input type="number" placeholder="Price" min={1} value={menuInput.price || ""} onChange={e=>setMenuInput({...menuInput,price:parseInt(e.target.value||"0",10)})} className="border w-20 rounded px-2" />
          <button onClick={handleMenuAdd} className="ml-2 px-3 py-1 rounded-md bg-primary text-white hover:bg-cabin-dark/80 transition-colors text-sm">Add Item</button>
        </div>
      </div>
      <PauseServiceCard
        isPaused={isPaused}
        pauseUntil={pauseUntil}
        setPauseUntil={setPauseUntil}
        handlePauseUpdate={handlePauseUpdate}
        resumeService={resumeService}
      />
      <DashboardSummaryCards
        pending={pendingOrders.length}
        processing={pickedUpOrders.length}
        ready={readyOrders.length}
        complaints={pendingComplaints.length}
      />
      <div className="bg-white rounded shadow">
        <div className="p-4 flex mt-4 space-x-2">
          <button
            className={`px-4 py-2 rounded ${selectedTab === "pending" ? "bg-primary text-white" : "bg-gray-200 text-gray-700"}`}
            onClick={() => setSelectedTab("pending")}
          >
            Pending Orders
          </button>
          <button
            className={`px-4 py-2 rounded ${selectedTab === "completed" ? "bg-primary text-white" : "bg-gray-200 text-gray-700"}`}
            onClick={() => setSelectedTab("completed")}
          >
            Completed Orders
          </button>
        </div>
        <div className="p-4">
          {selectedTab === "pending" ? (
            activeOrders.length > 0 ?
              <OrderTable
                orders={activeOrders}
                tab="pending"
                addingItem={addingItem}
                setAddingItem={setAddingItem}
                newItem={newItem}
                setNewItem={setNewItem}
                otpInputs={otpInputs}
                handleOtpInputChange={handleOtpInputChange}
                orderOtps={orderOtps}
                handleAddItem={handleAddItem}
                updateOrderStatus={updateOrderStatus}
                completeOrder={completeOrder}
                // pass menuItems
                menuItems={menuItems}
              /> :
              <div className="text-center py-8 text-muted-foreground">
                No pending orders at this time
              </div>
          ) : (
            pastOrders.length > 0 ?
              <OrderTable
                orders={pastOrders}
                tab="completed"
                addingItem={{}}
                setAddingItem={() => {}}
                newItem={{}}
                setNewItem={() => {}}
                otpInputs={{}}
                handleOtpInputChange={()=>{}}
                orderOtps={{}}
                handleAddItem={()=>{}}
                updateOrderStatus={()=>{}}
                completeOrder={()=>{}}
                menuItems={menuItems}
              /> :
              <div className="text-center py-8 text-muted-foreground">
                No completed orders found
              </div>
          )}
        </div>
      </div>
      <ComplaintsCard
        pendingComplaints={pendingComplaints}
        complaintResponse={complaintResponse}
        setComplaintResponse={setComplaintResponse}
        resolveComplaint={resolveComplaint}
      />
    </div>
  );
}
