
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Baby } from 'lucide-react';

interface ChatLog {
  id: string;
  studentName: string;
  studentEmail: string;
  userMessage: string;
  botResponse: string;
  timestamp: string;
}

export const JiyaChats = () => {
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedChat, setExpandedChat] = useState<string | null>(null);
  
  useEffect(() => {
    // Load chat logs from localStorage
    try {
      const savedLogs = localStorage.getItem('jiyaChatLogs');
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs);
        // Sort by timestamp, newest first
        parsedLogs.sort((a: ChatLog, b: ChatLog) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setChatLogs(parsedLogs);
      }
    } catch (e) {
      console.error('Failed to load chat logs', e);
    }
  }, []);
  
  const filteredLogs = chatLogs.filter(log => 
    log.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.userMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.botResponse.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const toggleExpandChat = (id: string) => {
    if (expandedChat === id) {
      setExpandedChat(null);
    } else {
      setExpandedChat(id);
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (e) {
      return dateString;
    }
  };
  
  const getUserGender = (email: string): string => {
    // Try to get gender specific to this user
    const userGender = localStorage.getItem(`${email}_gender`);
    if (userGender) return userGender;
    
    // Default to the last selected gender
    return localStorage.getItem('userGender') || '';
  };
  
  const getUserImage = (email: string): string => {
    // Try to get image specific to this user
    const userImage = localStorage.getItem(`${email}_profileImage`);
    if (userImage) return userImage;
    
    // Default to the last set image
    return localStorage.getItem('userProfileImage') || '';
  };
  
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Jiya Chat Logs</CardTitle>
        <CardDescription>View all student interactions with Jiya chatbot</CardDescription>
        <div className="flex gap-2 mt-4">
          <Input
            placeholder="Search by name, email, or message content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <Button variant="outline" onClick={() => setSearchTerm('')}>
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLogs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="w-1/3">User Message</TableHead>
                <TableHead className="w-1/3">Jiya's Response</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <React.Fragment key={log.id}>
                  <TableRow className="hover:bg-accent/50">
                    <TableCell>{formatDate(log.timestamp)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          {getUserImage(log.studentEmail) ? (
                            <AvatarImage src={getUserImage(log.studentEmail)} alt={log.studentName} />
                          ) : (
                            <AvatarFallback className={getUserGender(log.studentEmail) === 'female' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">{log.studentName}</p>
                          <p className="text-xs text-muted-foreground">{log.studentEmail}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="line-clamp-2">{log.userMessage}</p>
                    </TableCell>
                    <TableCell>
                      <p className="line-clamp-2">{log.botResponse}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleExpandChat(log.id)}
                      >
                        {expandedChat === log.id ? 'Collapse' : 'Expand'}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedChat === log.id && (
                    <TableRow className="bg-accent/30">
                      <TableCell colSpan={5} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-start gap-2">
                            <Avatar className="h-6 w-6 mt-1">
                              {getUserImage(log.studentEmail) ? (
                                <AvatarImage src={getUserImage(log.studentEmail)} alt={log.studentName} />
                              ) : (
                                <AvatarFallback className={getUserGender(log.studentEmail) === 'female' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}>
                                  <User className="h-3 w-3" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm mb-1">User Message:</h4>
                              <div className="p-2 bg-muted rounded-md rounded-tl-none">
                                <p>{log.userMessage}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Avatar className="h-6 w-6 mt-1">
                              <AvatarImage src="/jiya.jpg" alt="Jiya" />
                              <AvatarFallback className="bg-pink-100 flex items-center justify-center">
                                <Baby className="h-3 w-3 text-pink-500" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm mb-1">Jiya's Response:</h4>
                              <div className="p-2 bg-muted rounded-md rounded-tl-none">
                                <p className="whitespace-pre-wrap">{log.botResponse}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'No chat logs match your search' : 'No chat logs available'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
