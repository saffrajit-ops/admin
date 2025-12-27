'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, MessageCircle, Heart, Send, MoreVertical, Check, X, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Comment {
    _id: string;
    content: string;
    author: {
        name: string;
        email: string;
    };
    likes: string[];
    replies: Reply[];
    createdAt: string;
    status: 'approved' | 'rejected';
}

interface Reply {
    _id: string;
    content: string;
    author: {
        name: string;
        email: string;
    };
    likes: string[];
    createdAt: string;
}

interface BlogPost {
    _id: string;
    title: string;
    slug: string;
    coverImage?: {
        url: string;
        alt?: string;
    };
}

export default function BlogCommentsPage() {
    const params = useParams();
    const router = useRouter();
    const { accessToken, user } = useAuthStore();
    const { toast } = useToast();

    const blogId = params.id as string;

    const [blog, setBlog] = useState<BlogPost | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
    const [selectedReply, setSelectedReply] = useState<{ commentId: string; replyId: string } | null>(null);

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected'>('all');

    useEffect(() => {
        if (blogId) {
            fetchBlog();
            fetchComments();
        }
    }, [blogId]);

    useEffect(() => {
        filterComments();
    }, [comments, searchQuery, statusFilter]);

    const filterComments = () => {
        let filtered = [...comments];

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(c => c.status === statusFilter);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.content.toLowerCase().includes(query) ||
                c.author.name.toLowerCase().includes(query) ||
                c.author.email.toLowerCase().includes(query)
            );
        }

        setFilteredComments(filtered);
    };

    const fetchBlog = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/admin/blog/${blogId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setBlog(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch blog:', error);
        }
    };

    const fetchComments = async () => {
        try {
            setLoading(true);
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/blogs/${blogId}/admin/comments?limit=1000`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setComments(data.comments || []);
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch comments',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/blogs/${blogId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    content: newComment.trim()
                })
            });

            if (response.ok) {
                setNewComment('');
                fetchComments();
                toast({
                    title: 'Success',
                    description: 'Comment added successfully'
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to add comment',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLikeComment = async (commentId: string) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/blogs/${blogId}/comments/${commentId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (response.ok) {
                fetchComments();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to toggle like',
                variant: 'destructive'
            });
        }
    };

    const handleLikeReply = async (commentId: string, replyId: string) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const response = await fetch(
                `${API_URL}/blogs/${blogId}/comments/${commentId}/replies/${replyId}/like`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (response.ok) {
                fetchComments();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to toggle like',
                variant: 'destructive'
            });
        }
    };

    const handleApprove = async (comment: Comment) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const response = await fetch(
                `${API_URL}/blogs/${blogId}/comments/${comment._id}/approve`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'Comment approved'
                });
                fetchComments();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to approve comment',
                variant: 'destructive'
            });
        }
    };

    const handleReject = async (comment: Comment) => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const response = await fetch(
                `${API_URL}/blogs/${blogId}/comments/${comment._id}/reject`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'Comment rejected'
                });
                fetchComments();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to reject comment',
                variant: 'destructive'
            });
        }
    };

    const handleDeleteComment = async () => {
        if (!selectedComment) return;

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const response = await fetch(
                `${API_URL}/blogs/${blogId}/comments/${selectedComment._id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'Comment deleted'
                });
                fetchComments();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete comment',
                variant: 'destructive'
            });
        } finally {
            setDeleteDialogOpen(false);
            setSelectedComment(null);
        }
    };

    const handleDeleteReply = async () => {
        if (!selectedReply) return;

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const response = await fetch(
                `${API_URL}/blogs/${blogId}/comments/${selectedReply.commentId}/replies/${selectedReply.replyId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'Reply deleted'
                });
                fetchComments();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete reply',
                variant: 'destructive'
            });
        } finally {
            setDeleteDialogOpen(false);
            setSelectedReply(null);
        }
    };

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return `${Math.floor(diffInSeconds / 604800)}w ago`;
    };

    const getStatusBadge = (status: string) => {
        return status === 'approved' ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
        ) : (
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
        );
    };

    const CommentItem = ({ comment }: { comment: Comment }) => {
        const [showReplies, setShowReplies] = useState(false);
        const [isReplying, setIsReplying] = useState(false);
        const [replyContent, setReplyContent] = useState('');
        const isLiked = user && comment.likes.includes(user._id);

        const handleReply = async () => {
            if (!replyContent.trim()) return;

            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                const response = await fetch(`${API_URL}/blogs/${blogId}/comments/${comment._id}/replies`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({
                        content: replyContent.trim()
                    })
                });

                if (response.ok) {
                    setReplyContent('');
                    setIsReplying(false);
                    setShowReplies(true);
                    fetchComments();
                    toast({
                        title: 'Success',
                        description: 'Reply added'
                    });
                }
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to add reply',
                    variant: 'destructive'
                });
            }
        };

        return (
            <Card className="mb-4">
                <CardContent className="p-6">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                                {comment.author.name.charAt(0).toUpperCase()}
                            </span>
                        </div>

                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-semibold">{comment.author.name}</h4>
                                        {getStatusBadge(comment.status)}
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {comment.author.email} • {getTimeAgo(comment.createdAt)}
                                    </p>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="cursor-pointer">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {comment.status !== 'approved' && (
                                            <DropdownMenuItem onClick={() => handleApprove(comment)} className="cursor-pointer">
                                                <Check className="w-4 h-4 mr-2" />
                                                Approve
                                            </DropdownMenuItem>
                                        )}
                                        {comment.status !== 'rejected' && (
                                            <DropdownMenuItem onClick={() => handleReject(comment)} className="cursor-pointer">
                                                <X className="w-4 h-4 mr-2" />
                                                Reject
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setSelectedComment(comment);
                                                setSelectedReply(null);
                                                setDeleteDialogOpen(true);
                                            }}
                                            className="text-red-600 cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <p className="text-gray-800 mb-3">{comment.content}</p>

                            <div className="flex items-center gap-4 text-sm">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleLikeComment(comment._id)}
                                    className={`h-8 px-2 cursor-pointer ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
                                >
                                    <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                                    {comment.likes.length} {comment.likes.length === 1 ? 'like' : 'likes'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsReplying(!isReplying)}
                                    className="h-8 px-2 cursor-pointer"
                                >
                                    <MessageCircle className="w-4 h-4 mr-1" />
                                    Reply
                                </Button>
                                {comment.replies && comment.replies.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowReplies(!showReplies)}
                                        className="h-8 px-2 cursor-pointer"
                                    >
                                        {showReplies ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                                        {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                                    </Button>
                                )}
                            </div>

                            {isReplying && (
                                <div className="mt-4 flex gap-2">
                                    <Textarea
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="Write a reply..."
                                        className="min-h-[80px]"
                                        rows={2}
                                    />
                                    <div className="flex flex-col gap-2">
                                        <Button size="sm" onClick={handleReply} disabled={!replyContent.trim()} className="cursor-pointer">
                                            <Send className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => setIsReplying(false)} className="cursor-pointer">
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {showReplies && comment.replies && comment.replies.length > 0 && (
                                <div className="mt-4 ml-8 space-y-3 border-l-2 border-amber-100 pl-4">
                                    {comment.replies.map((reply) => {
                                        const isReplyLiked = user && reply.likes.includes(user._id);
                                        return (
                                            <div key={reply._id} className="flex gap-3">
                                                <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-semibold text-sm">
                                                        {reply.author.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-amber-50 rounded-lg px-4 py-3 border border-amber-100">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-semibold text-sm">{reply.author.name}</span>
                                                                    <span className="text-xs text-gray-500">{getTimeAgo(reply.createdAt)}</span>
                                                                </div>
                                                                <p className="text-sm text-gray-800">{reply.content}</p>
                                                            </div>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 cursor-pointer">
                                                                        <MoreVertical className="w-3 h-3" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setSelectedComment(null);
                                                                            setSelectedReply({ commentId: comment._id, replyId: reply._id });
                                                                            setDeleteDialogOpen(true);
                                                                        }}
                                                                        className="text-red-600 cursor-pointer"
                                                                    >
                                                                        <Trash2 className="w-3 h-3 mr-2" />
                                                                        Delete Reply
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 px-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleLikeReply(comment._id, reply._id)}
                                                            className={`h-6 px-1 text-xs cursor-pointer ${isReplyLiked ? 'text-red-500' : 'text-gray-500'}`}
                                                        >
                                                            <Heart className={`w-3 h-3 mr-1 ${isReplyLiked ? 'fill-current' : ''}`} />
                                                            {reply.likes.length}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="space-y-4">
                <Link href="/dashboard/blog">
                    <Button variant="ghost" size="sm" className="cursor-pointer">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Blog Posts
                    </Button>
                </Link>
                
                {blog && (
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex gap-6 items-start">
                                {blog.coverImage?.url ? (
                                    <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                        <img
                                            src={blog.coverImage.url}
                                            alt={blog.coverImage.alt || blog.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                        <MessageCircle className="w-12 h-12 text-gray-400" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold tracking-tight mb-2">{blog.title}</h1>
                                    <p className="text-gray-500">
                                        Managing comments for this blog post
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Comments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{comments.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-500">Approved</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {comments.filter(c => c.status === 'approved').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-500">Rejected</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {comments.filter(c => c.status === 'rejected').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filter */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search comments by content, author name, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Add Comment Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Add Comment as Admin</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddComment} className="space-y-4">
                        <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="min-h-[100px]"
                            rows={4}
                        />
                        <Button type="submit" disabled={isSubmitting || !newComment.trim()} className="cursor-pointer">
                            {isSubmitting ? 'Posting...' : 'Post Comment'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Comments List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading comments...</p>
                </div>
            ) : filteredComments.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">
                            {searchQuery || statusFilter !== 'all' ? 'No comments match your filters' : 'No comments yet'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div>
                    <p className="text-sm text-gray-500 mb-4">
                        Showing {filteredComments.length} of {comments.length} comments
                    </p>
                    {filteredComments.map((comment) => (
                        <CommentItem key={comment._id} comment={comment} />
                    ))}
                </div>
            )}

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {selectedReply ? 'Delete Reply' : 'Delete Comment'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedReply
                                ? 'Are you sure you want to delete this reply? This action cannot be undone.'
                                : 'Are you sure you want to delete this comment? This will also delete all replies. This action cannot be undone.'
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={selectedReply ? handleDeleteReply : handleDeleteComment}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
