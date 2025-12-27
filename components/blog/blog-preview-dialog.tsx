"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Clock, User } from "lucide-react"
import Image from "next/image"

interface BlogPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  excerpt: string
  body: string
  author: string
  categories: string[]
  subcategories: string[]
  tags: string[]
  coverImagePreview: string
}

export function BlogPreviewDialog({
  open,
  onOpenChange,
  title,
  excerpt,
  body,
  author,
  categories,
  subcategories,
  tags,
  coverImagePreview,
}: BlogPreviewDialogProps) {
  const formatDate = () => {
    const date = new Date()
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Blog Post Preview</DialogTitle>
        </DialogHeader>
        
        <div className="bg-white">
          {/* Hero Image */}
          {coverImagePreview && (
            <div className="relative h-[300px] overflow-hidden bg-gray-900 rounded-lg mb-6">
              <Image
                src={coverImagePreview}
                alt={title || "Preview"}
                fill
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              
              {/* Category Badges */}
              {(categories.length > 0 || subcategories.length > 0) && (
                <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                  {categories.map((cat, idx) => (
                    <span key={`cat-${idx}`} className="bg-white px-4 py-2 text-[10px] tracking-[0.2em] text-gray-900 uppercase">
                      {cat}
                    </span>
                  ))}
                  {subcategories.map((sub, idx) => (
                    <span key={`sub-${idx}`} className="bg-blue-100 px-4 py-2 text-[10px] tracking-[0.2em] text-blue-900 uppercase">
                      {sub}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Article Content */}
          <article className="px-2">
            {/* Header */}
            <div>
              <h1 className="font-serif text-3xl md:text-4xl text-gray-900 mb-4 leading-tight">
                {title || "Untitled Post"}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{author || "Author"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>5 min read</span>
                </div>
              </div>
            </div>

            {/* Excerpt */}
            {excerpt && (
              <div className="mb-8">
                <p className="text-lg text-gray-700 leading-relaxed font-light">
                  {excerpt}
                </p>
              </div>
            )}

            {/* Body Content */}
            <div className="prose prose-lg max-w-none mb-8">
              <div 
                className="text-base text-gray-600 leading-relaxed blog-content"
                dangerouslySetInnerHTML={{ __html: body || "<p>No content yet...</p>" }}
              />
            </div>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-600 text-xs tracking-wider uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>

        <style jsx global>{`
          .blog-content a {
            color: #2563eb;
            text-decoration: underline;
          }
          .blog-content a:hover {
            color: #1e40af;
          }
          .blog-content img {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            margin: 1rem 0;
          }
          .blog-content h1 {
            font-size: 2.25rem;
            font-weight: 700;
            margin-top: 1.5rem;
            margin-bottom: 1rem;
          }
          .blog-content h2 {
            font-size: 1.875rem;
            font-weight: 700;
            margin-top: 1.25rem;
            margin-bottom: 0.875rem;
          }
          .blog-content h3 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-top: 1rem;
            margin-bottom: 0.75rem;
          }
          .blog-content p {
            margin-top: 0.75rem;
            margin-bottom: 0.75rem;
          }
          .blog-content ul,
          .blog-content ol {
            margin-top: 0.75rem;
            margin-bottom: 0.75rem;
            padding-left: 1.5rem;
          }
          .blog-content blockquote {
            border-left: 4px solid #3b82f6;
            padding-left: 1rem;
            margin: 1rem 0;
            font-style: italic;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
