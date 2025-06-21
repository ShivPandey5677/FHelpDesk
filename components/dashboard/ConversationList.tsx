'use client';

import { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Conversation {
  id: number;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  last_message: string;
  last_message_at: string;
  message_count: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export default function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.last_message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return `${days}d`;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto scroll-area">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No conversations found</p>
            <p className="text-sm mt-1">New messages will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`p-4 cursor-pointer transition-colors conversation-item ${
                  selectedConversation?.id === conversation.id ? 'active' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {conversation.customer_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.customer_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(conversation.last_message_at)}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message || 'No messages yet'}
                      </p>
                      {conversation.message_count > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {conversation.message_count}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-1">
                      Facebook DM
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}