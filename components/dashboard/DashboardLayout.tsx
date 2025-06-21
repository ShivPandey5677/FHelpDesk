'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConversationList from './ConversationList';
import ConversationView from './ConversationView';
import CustomerProfile from './CustomerProfile';
import Sidebar from './Sidebar';
import { toast } from 'sonner';
import axios from 'axios';

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

export default function DashboardLayout() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setConversations(response.data);
      
      // Select first conversation if available
      if (response.data.length > 0 && !selectedConversation) {
        setSelectedConversation(response.data[0]);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/');
      } else {
        toast.error('Failed to load conversations');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    setIsLoadingMessages(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages(response.data);
    } catch (error: any) {
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedConversation) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/conversations/${selectedConversation.id}/messages`,
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Add the new message to the list
      setMessages(prev => [...prev, response.data.messageData]);
      
      // Refresh conversations to update last message
      fetchConversations();
      
      toast.success('Message sent successfully!');
    } catch (error: any) {
      toast.error('Failed to send message');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar onLogout={handleLogout} />
      
      <div className="flex-1 flex">
        <div className="w-80 bg-white border-r border-gray-200">
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
          />
        </div>

        <div className="flex-1 flex">
          <div className="flex-1">
            <ConversationView
              conversation={selectedConversation}
              messages={messages}
              isLoadingMessages={isLoadingMessages}
              onSendMessage={handleSendMessage}
            />
          </div>

          <div className="w-80 bg-white border-l border-gray-200">
            <CustomerProfile conversation={selectedConversation} />
          </div>
        </div>
      </div>
    </div>
  );
}