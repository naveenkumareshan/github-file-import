
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChatbotDialog } from './ChatbotDialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Baby } from 'lucide-react';

const ChatbotButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full shadow-lg bg-primary h-14 w-14 p-0"
        aria-label="Open Jiya chatbot"
      >
        <Avatar className="h-12 w-12">
          <AvatarImage src="/jiya.jpg" alt="Jiya Chatbot" />
          <AvatarFallback className="bg-pink-100 flex items-center justify-center">
            <Baby className="h-6 w-6 text-pink-500" />
            <span className="sr-only">JI</span>
          </AvatarFallback>
        </Avatar>
      </Button>
      
      <ChatbotDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default ChatbotButton;