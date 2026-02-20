
import React from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Baby, User } from 'lucide-react';

interface ChatMessageProps {
  message: string;
  isBot: boolean;
  timestamp: Date;
  userImage?: string;
  gender?: 'male' | 'female';
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isBot, 
  timestamp, 
  userImage,
  gender
}) => {
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} gap-2`}>
      {isBot && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src="/jiya.jpg" alt="Jiya" />
          <AvatarFallback className="bg-pink-100 flex items-center justify-center">
            <Baby className="h-4 w-4 text-pink-500" />
          </AvatarFallback>
        </Avatar>
      )}
      <div 
        className={`max-w-[75%] p-3 rounded-lg ${
          isBot 
            ? 'bg-accent text-accent-foreground rounded-bl-none' 
            : 'bg-primary text-primary-foreground rounded-br-none'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message}</p>
        <p className="text-xs opacity-70 mt-1">
          {format(new Date(timestamp), 'HH:mm')}
        </p>
      </div>
      {!isBot && (
        <Avatar className="h-8 w-8 mt-1">
          {userImage ? (
            <AvatarImage src={userImage} alt="You" />
          ) : (
            <>
              <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80" alt="You" />
              <AvatarFallback className={gender === 'female' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </>
          )}
        </Avatar>
      )}
    </div>
  );
};
