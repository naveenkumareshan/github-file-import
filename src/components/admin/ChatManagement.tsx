
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface ChatThread {
  id: number;
  studentName: string;
  hostName: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

interface ChatManagementProps {
  chatThreads: ChatThread[];
}

export function ChatManagement({ chatThreads }: ChatManagementProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Communication Management</CardTitle>
        <CardDescription>Monitor student-host conversations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {chatThreads.map((thread) => (
            <div key={thread.id} className="border rounded-lg p-4 hover:bg-accent/10">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">
                    {thread.studentName} ↔ {thread.hostName}
                  </h3>
                  <p className="text-sm text-muted-foreground">{thread.timestamp}</p>
                </div>
                {thread.unread && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">New</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{thread.lastMessage}</p>
              <div className="flex justify-end">
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  View Conversation
                </Button>
              </div>
            </div>
          ))}
          
          {chatThreads.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No active conversations
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
