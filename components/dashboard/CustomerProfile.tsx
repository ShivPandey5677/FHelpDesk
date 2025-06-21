'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Calendar, User, Edit3, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Conversation {
  id: number;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  last_message: string;
  last_message_at: string;
  message_count: number;
}

interface CustomerProfileProps {
  conversation: Conversation | null;
}

export default function CustomerProfile({ conversation }: CustomerProfileProps) {
  if (!conversation) {
    return (
      <div className="h-full p-6 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No customer selected</p>
        </div>
      </div>
    );
  }

  // Extract name parts
  const nameParts = conversation.customer_name.split(' ');
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts[1] || conversation.customer_id.substr(-4);

  return (
    <div className="h-full overflow-y-auto scroll-area bg-gray-50">
      <div className="p-6 space-y-6">
        {/* Customer Header */}
        <div className="text-center">
          <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 font-semibold text-2xl">
              {conversation.customer_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            {conversation.customer_name}
          </h2>
          <div className="flex items-center justify-center mt-2">
            <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
            <span className="text-sm text-gray-500">Online</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
          <Button variant="outline" className="flex-1" size="sm">
            <Edit3 className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </div>

        {/* Customer Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-gray-600">
                  {conversation.customer_email || `${firstName.toLowerCase()}@richpanel.com`}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center space-x-3">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">First Name</p>
                <p className="text-sm text-gray-600">{firstName}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center space-x-3">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Last Name</p>
                <p className="text-sm text-gray-600">{lastName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversation Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Conversation Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Messages</span>
              <Badge variant="secondary">{conversation.message_count}</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Response Time</span>
              <Badge variant="outline">{'< 1h'}</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Platform</span>
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                Facebook
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Customer Rating */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Customer Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= 4
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">4.0 / 5.0</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Based on previous interactions
            </p>
          </CardContent>
        </Card>

        {/* Additional Actions */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            View more details
          </Button>
        </div>
      </div>
    </div>
  );
}