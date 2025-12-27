'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';
import { NewsletterTable } from '@/components/newsletter/newsletter-table';
import { NewsletterFilters } from '@/components/newsletter/newsletter-filters';
import { NewsletterStats } from '@/components/newsletter/newsletter-stats';
import { NewsletterPagination } from '@/components/newsletter/newsletter-pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Subscriber {
  _id: string;
  email: string;
  status: 'pending' | 'subscribed' | 'unsubscribed' | 'bounced';
  source: string;
  subscribedAt: string;
  unsubscribedAt?: string;
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  subscribed: number;
  unsubscribed: number;
  bounced: number;
}

export default function NewsletterPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, subscribed: 0, unsubscribed: 0, bounced: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, [page, search, status]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(status !== 'all' && { status }),
      });

      const res = await fetch(
        `${API_URL}/newsletter/admin/subscribers?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.data);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
      } else {
        toast.error('Failed to fetch subscribers');
      }
    } catch (error) {
      console.error('Fetch subscribers error:', error);
      toast.error('Failed to fetch subscribers');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'subscribed' | 'unsubscribed' | 'bounced') => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(
        `${API_URL}/newsletter/admin/subscribers/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (res.ok) {
        toast.success('Status updated successfully');
        fetchSubscribers();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(
        `${API_URL}/newsletter/admin/subscribers/${deleteId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (res.ok) {
        toast.success('Subscriber deleted successfully');
        fetchSubscribers();
      } else {
        toast.error('Failed to delete subscriber');
      }
    } catch (error) {
      console.error('Delete subscriber error:', error);
      toast.error('Failed to delete subscriber');
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(
        `${API_URL}/newsletter/admin/subscribers/bulk-delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ ids: selectedIds }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        toast.success(`Deleted ${data.deletedCount} subscriber(s)`);
        setSelectedIds([]);
        fetchSubscribers();
      } else {
        toast.error('Failed to delete subscribers');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete subscribers');
    } finally {
      setBulkDeleteDialogOpen(false);
    }
  };

  const handleExport = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const params = new URLSearchParams({
        ...(status !== 'all' && { status }),
      });

      const res = await fetch(
        `${API_URL}/newsletter/admin/subscribers/export?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        
        // Convert to CSV
        const csv = [
          ['Email', 'Status', 'Source', 'Subscribed At', 'Unsubscribed At'],
          ...data.data.map((sub: Subscriber) => [
            sub.email,
            sub.status,
            sub.source,
            new Date(sub.subscribedAt).toLocaleString(),
            sub.unsubscribedAt ? new Date(sub.unsubscribedAt).toLocaleString() : '',
          ]),
        ]
          .map((row) => row.join(','))
          .join('\n');

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast.success('Subscribers exported successfully');
      } else {
        toast.error('Failed to export subscribers');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export subscribers');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Add all current page IDs to selection (keeping existing selections from other pages)
      const currentPageIds = subscribers.map((s) => s._id);
      const newSelectedIds = [...new Set([...selectedIds, ...currentPageIds])];
      setSelectedIds(newSelectedIds);
    } else {
      // Remove only current page IDs from selection (keep selections from other pages)
      const currentPageIds = subscribers.map((s) => s._id);
      setSelectedIds(selectedIds.filter((id) => !currentPageIds.includes(id)));
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('all');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Newsletter Subscribers</h1>
          <p className="text-muted-foreground">Manage your newsletter subscribers</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setBulkDeleteDialogOpen(true)}
              className="cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleExport} className="cursor-pointer">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <NewsletterStats stats={stats} />

      <div className="space-y-4">
        <NewsletterFilters
          search={search}
          status={status}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onClearFilters={handleClearFilters}
        />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <NewsletterTable
              subscribers={subscribers}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              onStatusChange={handleStatusChange}
              onDelete={(id) => {
                setDeleteId(id);
                setDeleteDialogOpen(true);
              }}
            />

            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between py-2 px-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  {selectedIds.length} subscriber{selectedIds.length !== 1 ? 's' : ''} selected across all pages
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds([])}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 cursor-pointer"
                >
                  Clear Selection
                </Button>
              </div>
            )}

            <NewsletterPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={20}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the subscriber.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 cursor-pointer">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} subscriber(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected subscribers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 cursor-pointer">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}