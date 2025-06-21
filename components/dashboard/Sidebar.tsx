'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Facebook, MessageCircle, Users, BarChart3, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const [activeItem, setActiveItem] = useState('conversations');
  const router = useRouter();

  const menuItems = [
    { id: 'conversations', icon: MessageCircle, label: 'Conversations', active: true },
    { id: 'customers', icon: Users, label: 'Customers' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleIntegration = () => {
    router.push('/integration');
  };

  return (
    <div className="w-16 bg-blue-600 flex flex-col items-center py-4 space-y-4">
      <div className="p-2 bg-blue-700 rounded-lg">
        <Facebook className="h-6 w-6 text-white" />
      </div>

      <div className="flex-1 flex flex-col space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={`w-12 h-12 p-0 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-700 text-white' 
                  : 'text-blue-100 hover:bg-blue-700 hover:text-white'
              }`}
              onClick={() => setActiveItem(item.id)}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
            </Button>
          );
        })}
      </div>

      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-12 h-12 p-0 rounded-lg text-blue-100 hover:bg-blue-700 hover:text-white transition-colors"
          onClick={handleIntegration}
          title="Facebook Integration"
        >
          <Settings className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-12 h-12 p-0 rounded-lg text-blue-100 hover:bg-red-600 hover:text-white transition-colors"
          onClick={onLogout}
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}