"use client"

import { BlogPost } from "@/lib/blog-store"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Edit, Trash2, FileText, MessageCircle } from "lucide-react"
import Image from "next/image"

interface BlogTableProps {
    posts: BlogPost[]
    onView?: (post: BlogPost) => void
    onEdit: (post: BlogPost) => void
    onComments?: (post: BlogPost) => void
    onDelete: (id: string) => void
    onPreview: (post: BlogPost) => void
    onToggleStatus?: (id: string, isPublished: boolean) => void
    isLoading?: boolean
    selectedIds?: Set<string>
    onSelectAll?: (checked: boolean) => void
    onSelectOne?: (id: string, checked: boolean) => void
    allFilteredIds?: string[]
    taxonomyNames?: { [key: string]: string }
}

export function BlogTable({
    posts,
    onView,
    onEdit,
    onComments,
    onDelete,
    onPreview,
    onToggleStatus,
    isLoading,
    selectedIds = new Set(),
    onSelectAll,
    onSelectOne,
    allFilteredIds = [],
    taxonomyNames = {}
}: BlogTableProps) {
    const allCurrentPageSelected = posts.length > 0 && posts.every(post => selectedIds.has(post._id))
    const someCurrentPageSelected = posts.some(post => selectedIds.has(post._id)) && !allCurrentPageSelected
    if (isLoading) {
        return (
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox disabled />
                            </TableHead>
                            <TableHead>Post</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Views</TableHead>
                            <TableHead>Comments</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell colSpan={8}>
                                    <div className="h-12 bg-muted animate-pulse rounded" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    if (posts.length === 0) {
        return (
            <div className="border rounded-lg p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No blog posts found</p>
            </div>
        )
    }

    return (
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12">
                            {onSelectAll && (
                                <Checkbox
                                    checked={allCurrentPageSelected}
                                    onCheckedChange={onSelectAll}
                                    aria-label="Select all posts"
                                    className="cursor-pointer"
                                />
                            )}
                        </TableHead>
                        <TableHead className="w-[400px]">Post</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Comments</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {posts.map((post) => (
                        <TableRow
                            key={post._id}
                            className={onView ? "cursor-pointer hover:bg-muted/50" : ""}
                            onClick={() => onView && onView(post)}
                        >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                {onSelectOne && (
                                    <Checkbox
                                        checked={selectedIds.has(post._id)}
                                        onCheckedChange={(checked) => onSelectOne(post._id, checked as boolean)}
                                        aria-label={`Select ${post.title}`}
                                        className="cursor-pointer"
                                    />
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    {post.coverImage?.url ? (
                                        <div
                                            className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0"
                                        >
                                            <Image
                                                src={post.coverImage.url}
                                                alt={post.coverImage.alt || post.title}
                                                width={64}
                                                height={64}
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0"
                                        >
                                            <FileText className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p
                                            className="font-medium text-sm max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
                                            title={post.title} // shows full title on hover
                                        >
                                            {post.title}
                                        </p>

                                        {/* {post.excerpt && (
                                            <p className="text-sm text-muted-foreground truncate">{post.excerpt}</p>
                                        )}
                                        {post.tags && post.tags.length > 0 && (
                                            <div className="flex gap-1 mt-1">
                                                {post.tags.slice(0, 2).map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        className="text-xs bg-muted px-2 py-0.5 rounded"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                                {post.tags.length > 2 && (
                                                    <span className="text-xs text-muted-foreground">
                                                        +{post.tags.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        )} */}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{post.author}</TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={post.isPublished}
                                        onCheckedChange={(checked) => {
                                            onToggleStatus && onToggleStatus(post._id, checked)
                                        }}
                                        className="cursor-pointer"
                                        disabled={!onToggleStatus}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        {post.isPublished ? "Published" : "Draft"}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm">{post.viewCount || 0}</span>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onComments && onComments(post)
                                    }}
                                    className="h-8 gap-2 cursor-pointer hover:bg-amber-50 hover:text-amber-600"
                                    title="Manage Comments"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span className="text-sm font-medium">{(post as any).commentCount || 0}</span>
                                </Button>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm text-muted-foreground">
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onEdit(post)
                                        }}
                                        className="h-8 w-8 cursor-pointer"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDelete(post._id)
                                        }}
                                        className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
