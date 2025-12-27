'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NewsletterFiltersProps {
  search: string;
  status: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClearFilters: () => void;
}

export function NewsletterFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onClearFilters,
}: NewsletterFiltersProps) {
  const hasFilters = search || status !== 'all';

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px] cursor-pointer">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="cursor-pointer">All Status</SelectItem>
          <SelectItem value="pending" className="cursor-pointer">Pending</SelectItem>
          <SelectItem value="subscribed" className="cursor-pointer">Subscribed</SelectItem>
          <SelectItem value="unsubscribed" className="cursor-pointer">Unsubscribed</SelectItem>
          <SelectItem value="bounced" className="cursor-pointer">Bounced</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="w-full sm:w-auto cursor-pointer"
        >
          <X className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
