'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MoreVertical, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Conversation {
  id: number;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  last_message: string;
  last_message_at: string;
  message_count: number;
}

interface Message {
  id: number;
  conversation_id: number;
  message_id: string;
  sender_id: string;
  sender_name: string;
  message_text: string;
  is_from_customer: boolean;
  timestamp: string;
}

interface ConversationViewProps {
  conversation: Conversation | null;
  messages: Message[];
  isLoadingMessages: boolean;
  onSendMessage: (message: string) => void;
}

export default function ConversationView({
  conversation,
  messages,
  isLoadingMessages,
  onSendMessage,
}: ConversationViewProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Send className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No conversation selected
          </h3>
          <p className="text-gray-500">
            Choose a conversation from the list to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium text-sm">
                {conversation.customer_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {conversation.customer_name}
              </h3>
              <p className="text-sm text-gray-500">
                Active now
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-area">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1">Start the conversation</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.is_from_customer ? 'justify-start' : 'justify-end'}`}
            >
              <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                {message.is_from_customer && (
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-medium text-xs">
                      {message.sender_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div
                  className={`message-bubble px-4 py-2 rounded-2xl ${
                    message.is_from_customer
                      ? 'customer-message bg-gray-100 text-gray-900'
                      : 'agent-message bg-blue-600 text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.is_from_customer ? 'text-gray-500' : 'text-blue-100'
                    }`}
                  >
                    {formatMessageTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${conversation.customer_name}...`}
              className="min-h-[44px] max-h-32 resize-none border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}