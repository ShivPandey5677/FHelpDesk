'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Facebook, Trash2, MessageCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface FacebookPage {
  id: number;
  page_id: string;
  page_name: string;
  created_at: string;
}

export default function IntegrationPage() {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/facebook/pages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPages(response.data);
    } catch (error: any) {
      console.error('Error fetching pages:', error);
    }
  };

  const handleConnectPage = async () => {
    setIsConnecting(true);
    
    // Simulate Facebook connection (in a real app, this would integrate with Facebook SDK)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const token = localStorage.getItem('token');
      const mockPageData = {
        pageId: `page_${Date.now()}`,
        pageName: 'Amazon Business',
        accessToken: `token_${Date.now()}`
      };

      await axios.post('http://localhost:5000/api/facebook/connect', mockPageData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Facebook page connected successfully!');
      fetchPages();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to connect Facebook page');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectPage = async (pageId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/facebook/pages/${pageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Facebook page disconnected successfully!');
      fetchPages();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to disconnect page');
    }
  };

  const hasConnectedPages = pages.length > 0;

  return (
    <div className="min-h-screen facebook-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="absolute left-4 top-4"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Facebook className="h-8 w-8 text-blue-600 mr-2" />
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-800">
              Facebook Page Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!hasConnectedPages ? (
              <div className="text-center space-y-4">
                <p className="text-gray-600 text-sm">
                  Connect your Facebook page to start managing messenger conversations
                </p>
                <Button
                  onClick={handleConnectPage}
                  disabled={isConnecting}
                  className="w-full facebook-blue hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Page'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {pages.map((page) => (
                  <div key={page.id} className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Integrated Page:</p>
                      <p className="font-semibold text-gray-800">{page.page_name}</p>
                    </div>
                    
                    <div className="space-y-3">
                      <Button
                        onClick={() => handleDisconnectPage(page.page_id)}
                        variant="destructive"
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Integration
                      </Button>
                      
                      <Button
                        onClick={() => router.push('/dashboard')}
                        className="w-full facebook-blue hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Reply To Messages
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}