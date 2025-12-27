'use client';

import { useState } from 'react';
import { Trash2, CheckCircle, XCircle, Clock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Subscriber {
  _id: string;
  email: string;
  status: 'pending' | 'subscribed' | 'unsubscribed' | 'bounced';
  source: string;
  subscribedAt: string;
  unsubscribedAt?: string;
  createdAt: string;
}

interface NewsletterTableProps {
  subscribers: Subscriber[];
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onStatusChange: (id: string, status: 'pending' | 'subscribed' | 'unsubscribed' | 'bounced') => void;
  onDelete: (id: string) => void;
}

export function NewsletterTable({
  subscribers,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onStatusChange,
  onDelete,
}: NewsletterTableProps) {
  // Check if all current page items are selected
  const currentPageIds = subscribers.map(s => s._id);
  const allCurrentPageSelected = subscribers.length > 0 && currentPageIds.every(id => selectedIds.includes(id));
  const someCurrentPageSelected = currentPageIds.some(id => selectedIds.includes(id)) && !allCurrentPageSelected;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'subscribed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'unsubscribed':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'bounced':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3 mr-1" />;
      case 'subscribed':
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case 'unsubscribed':
        return <XCircle className="w-3 h-3 mr-1" />;
      case 'bounced':
        return <Mail className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allCurrentPageSelected}
                onCheckedChange={onSelectAll}
                className="cursor-pointer"
                aria-label={allCurrentPageSelected ? "Deselect all on this page" : "Select all on this page"}
              />
            </TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Subscribed At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscribers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No subscribers found
              </TableCell>
            </TableRow>
          ) : (
            subscribers.map((subscriber) => (
              <TableRow key={subscriber._id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(subscriber._id)}
                    onCheckedChange={(checked) => onSelectOne(subscriber._id, checked as boolean)}
                    className="cursor-pointer"
                  />
                </TableCell>
                <TableCell className="font-medium">{subscriber.email}</TableCell>
                <TableCell>
                  <Select
                    value={subscriber.status}
                    onValueChange={(value) => onStatusChange(subscriber._id, value as any)}
                  >
                    <SelectTrigger className={`w-[140px] cursor-pointer ${getStatusColor(subscriber.status)}`}>
                      <SelectValue>
                        <div className="flex items-center">
                          {getStatusIcon(subscriber.status)}
                          <span className="capitalize">{subscriber.status}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending" className="cursor-pointer">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-2" />
                          Pending
                        </div>
                      </SelectItem>
                      <SelectItem value="subscribed" className="cursor-pointer">
                        <div className="flex items-center">
                          <CheckCircle className="w-3 h-3 mr-2" />
                          Subscribed
                        </div>
                      </SelectItem>
                      <SelectItem value="unsubscribed" className="cursor-pointer">
                        <div className="flex items-center">
                          <XCircle className="w-3 h-3 mr-2" />
                          Unsubscribed
                        </div>
                      </SelectItem>
                      <SelectItem value="bounced" className="cursor-pointer">
                        <div className="flex items-center">
                          <Mail className="w-3 h-3 mr-2" />
                          Bounced
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="capitalize">{subscriber.source}</TableCell>
                <TableCell>{formatDate(subscriber.subscribedAt)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(subscriber._id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
