
import React, { useState, useEffect, useRef } from 'react';
import { X, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './ChatMessage';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';

interface ChatbotDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

interface Booking {
  bookingDate: string;
  startTime?: string;
  endTime?: string;
  totalPrice: number;
  months?: number;
  date?: string;
  cabin?: {
    name: string;
    category: string;
  };
  seat?: {
    number: number;
  };
  paymentStatus: string;
}

export const ChatbotDialog: React.FC<ChatbotDialogProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi there! I'm Jiya, your virtual assistant for Inhale Stays. I can help with questions about bookings, reading rooms, or general information about our services. How can I assist you today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const userImage = localStorage.getItem('userProfileImage') || '';
  const userGender = localStorage.getItem('userGender') || undefined;
  
  const saveMessageToLocalStorage = (newMessages: Message[]) => {
    try {
      localStorage.setItem('jiyaChatMessages', JSON.stringify(newMessages));
      
      // Also save as chat log for admin dashboard
      const chatLogs = JSON.parse(localStorage.getItem('jiyaChatLogs') || '[]');
      const userMessages = newMessages.filter(msg => !msg.isBot);
      
      if (userMessages.length > 0 && newMessages.length > userMessages.length) {
        // Get the current user information
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name": "Guest", "email": "guest@example.com"}');
        
        const latestChat = {
          id: `chat-${Date.now()}`,
          studentName: currentUser.name || "Guest User",
          studentEmail: currentUser.email || "guest@example.com",
          userMessage: userMessages[userMessages.length - 1].content,
          botResponse: newMessages[newMessages.length - 1].content,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('jiyaChatLogs', JSON.stringify([...chatLogs, latestChat]));
      }
    } catch (e) {
      console.error('Failed to save chat messages', e);
    }
  };
  
  // Save user activity log
  const saveUserActivityLog = (activity: string, status: string = "Completed") => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name": "Guest", "email": "guest@example.com"}');
      const userLogs = JSON.parse(localStorage.getItem('userActivityLogs') || '[]');
      
      const newLog = {
        id: `log-${Date.now()}`,
        userId: currentUser.id || "guest",
        userName: currentUser.name || "Guest User",
        userEmail: currentUser.email || "guest@example.com",
        activity,
        status,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('userActivityLogs', JSON.stringify([...userLogs, newLog]));
    } catch (e) {
      console.error('Failed to save user activity log', e);
    }
  };
  
  useEffect(() => {
    // Load previous messages from localStorage
    try {
      const savedMessages = localStorage.getItem('jiyaChatMessages');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      }
    } catch (e) {
      console.error('Failed to load chat messages', e);
    }
    
  }, []);
  
  useEffect(() => {
    // Scroll to the bottom when messages change
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate app-focused responses without chatgpt integration
  const generateResponse = async (userInput: string): Promise<string> => {
    try {
      setIsLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Convert input to lowercase for easier matching
      const lowerInput = userInput.toLowerCase();
      
      // App-specific responses
      if (lowerInput.includes('booking') || lowerInput.includes('reserve') || lowerInput.includes('reservation')) {
        const bookings = getUserBookings();
        if (bookings.length > 0) {
          return formatBookingInfo(bookings);
        } else {
          return "You don't have any bookings yet. To make a booking, please go to the Cabins page and select a reading room that interests you.";
        }
      } 
      
      if (lowerInput.includes('reading room') || lowerInput.includes('cabin') || lowerInput.includes('seat')) {
        return "Our reading rooms offer quiet spaces for focused study and reading. We have various cabin types ranging from standard to premium. Each cabin has comfortable seating and proper lighting. You can view all available cabins from the Cabins page.";
      }
      
      if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('fee') || lowerInput.includes('payment')) {
        return "Our pricing depends on the type of cabin and duration of your booking. Standard cabins start at ₹500 per month, while premium cabins are priced at ₹1000 per month. You can view detailed pricing on each cabin's page.";
      }
      
      if (lowerInput.includes('hour') || lowerInput.includes('time') || lowerInput.includes('open') || lowerInput.includes('close')) {
        return "Our reading rooms are open from 8:00 AM to 10:00 PM every day. You can access the facility using your student ID or digital pass available in your profile.";
      }
      
      if (lowerInput.includes('profile') || lowerInput.includes('account') || lowerInput.includes('setting')) {
        return "You can manage your profile from the Student Dashboard. There you can update your personal information, view your bookings, and manage your subscription.";
      }
      
      if (lowerInput.includes('password') || lowerInput.includes('change password') || lowerInput.includes('reset')) {
        return "To change your password, go to the Student Dashboard and click on the 'Change Password' button. You'll need to enter your current password and then set a new one.";
      }
      
      // Limited life advice responses
      if (lowerInput.includes('study tip') || lowerInput.includes('study better') || lowerInput.includes('focus')) {
        return "For better focus during study sessions, try the Pomodoro technique: 25 minutes of focused work followed by a 5-minute break. Our quiet reading cabins provide the perfect environment for this approach.";
      }
      
      if (lowerInput.includes('stress') || lowerInput.includes('anxious') || lowerInput.includes('overwhelmed')) {
        return "I understand that academic life can be stressful. Taking short breaks in a calm environment like our reading rooms can help. Remember that your wellbeing matters as much as your studies.";
      }
      
      // Default response
      return "I'm Jiya, your Inhale Stays assistant. I can help with questions about our reading rooms, bookings, and services. If you need something specific about the app or your account, please let me know.";
      
    } catch (error) {
      console.error('Error generating response:', error);
      setIsLoading(false);
      return "I'm sorry, I encountered an error. Please try again.";
    }
  };
  
  const getUserBookings = (): Booking[] => {
    try {
      // Get user ID from local storage or other source
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser?.id;
      
      if (!userId) return [];
      
      // Get bookings for this user
      const bookings = JSON.parse(localStorage.getItem(`bookings_${userId}`) || '[]');
      return bookings;
    } catch (e) {
      console.error('Failed to load bookings', e);
      return [];
    }
  };
  
  const formatBookingInfo = (bookings: Booking[]): string => {
    if (!bookings.length) return "You don't have any bookings yet. Would you like me to help you book a reading room?";
    
    const activeBookings = bookings.filter(b => b.paymentStatus === 'completed');
    
    if (!activeBookings.length) return "You have some pending bookings, but no active ones yet. Would you like me to help you complete your booking?";
    
    // Format bookings into readable text
    let response = "Here are your recent bookings:\n\n";
    
    activeBookings.forEach((booking, index) => {
      response += `📚 Booking #${index + 1}: \n`;
      if (booking.cabin) {
        response += `Room: ${booking.cabin.name} (${booking.cabin.category}) \n`;
      }
      if (booking.seat) {
        response += `Seat: #${booking.seat.number} \n`;
      }
      response += `Date: ${new Date(booking.bookingDate || booking.date || '').toLocaleDateString()} \n`;
      if (booking.startTime) {
        response += `Time: ${booking.startTime} - ${booking.endTime} \n`;
      } else if (booking.months) {
        response += `Duration: ${booking.months} month(s) \n`;
      }
      response += `Amount: $${booking.totalPrice} \n\n`;
    });
    
    response += "Is there anything specific about your bookings you'd like to know?";
    return response;
  };
  
  const handleSend = async () => {
    if (input.trim() === '') return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isBot: false,
      timestamp: new Date(),
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveMessageToLocalStorage(updatedMessages);
    setInput('');
    setIsLoading(true);
    
    // Log the user's question
    
    try {
      // Get response from simplified response generation
      const botResponse = await generateResponse(input);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        isBot: true,
        timestamp: new Date(),
      };
      
      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      saveMessageToLocalStorage(finalMessages);
      setIsLoading(false);
    } catch (error) {
      console.error('Error in chat response:', error);
      setIsLoading(false);
      
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive"
      });
    
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] h-[600px] max-h-[80vh] p-0 flex flex-col">
        <DialogHeader className="px-4 py-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/jiya.jpg" alt="Jiya" />
                <AvatarFallback className="bg-pink-100 flex items-center justify-center">
                  <Baby className="h-4 w-4 text-pink-500" />
                </AvatarFallback>
              </Avatar>
              <DialogTitle className="text-lg">Chat with Jiya</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              {/* <X className="h-4 w-4" /> */}
            </Button>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Ask questions about the app, bookings, or reading rooms
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message.content}
                isBot={message.isBot}
                timestamp={message.timestamp}
                userImage={!message.isBot ? userImage : undefined}
                gender={!message.isBot ? (userGender as 'male' | 'female' | undefined) : undefined}
              />
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="relative flex h-8 w-8 items-center justify-center">
                  <div className="absolute h-4 w-4 animate-ping rounded-full bg-pink-200"></div>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-pink-100 flex items-center justify-center">
                      <Baby className="h-3 w-3 text-pink-500" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <p className="text-sm text-muted-foreground">Jiya is typing...</p>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t mt-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || input.trim() === ''}>
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
