"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useBlogStore, BlogPost } from "@/lib/blog-store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, FileText } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

export default function ViewBlogPage() {
  const params = useParams()
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const { fetchPostById } = useBlogStore()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [taxonomyNames, setTaxonomyNames] = useState<{
    [key: string]: string
  }>({})

  useEffect(() => {
    const loadPost = async () => {
      if (!accessToken) {
        toast.error("Error", {
          description: "Authentication required",
        })
        router.push("/dashboard/blog")
        return
      }

      try {
        const postData = await fetchPostById(params.id as string, accessToken)
        if (postData) {
          setPost(postData)

          // Fetch taxonomy names
          const taxonomyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/taxonomies/for-blogs`, {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          })
          const taxonomyData = await taxonomyResponse.json()

          if (taxonomyData.success) {
            const names: { [key: string]: string } = {}

            // Map categories and subcategories
            taxonomyData.data.categories.forEach((item: any) => {
              names[item._id] = item.name
              if (item.subcategories) {
                item.subcategories.forEach((sub: any) => {
                  names[sub._id] = sub.name
                })
              }
            })

            setTaxonomyNames(names)
          }
        } else {
          throw new Error("Blog post not found")
        }
      } catch (error) {
        toast.error("Error", {
          description: error instanceof Error ? error.message : "Failed to load blog post",
        })
        router.push("/dashboard/blog")
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [params.id, accessToken, fetchPostById, router])

  // --- Loading and Error States ---
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Loading blog post...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Post not found or an error occurred.</p>
        <Button onClick={() => router.push("/dashboard/blog")} className="ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  // Function to format the date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).replace(/,/, '') // Remove comma from date
  }

  // --- Component JSX for Blog View ---
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header - Back/Edit Buttons */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/blog")}
            className="gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog List
          </Button>
          <Button
            onClick={() => router.push(`/dashboard/blog/${post._id}/edit-page`)}
            className="gap-2 cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            Edit Post
          </Button>
        </div>

        {/* Main Content Area - Replicating Screenshot Design */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Section - Image and Category */}
          <div className="relative w-full aspect-[16/6] bg-muted rounded-xl overflow-hidden shadow-xl">
            {post.coverImage?.url ? (
              <Image
                src={post.coverImage.url}
                alt={post.title}
                fill
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileText className="w-20 h-20 text-muted-foreground" />
              </div>
            )}

            {/* Overlay with Author/Category */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-6 flex flex-col justify-end">
              <div className="flex justify-start items-end w-full flex-wrap gap-2">
                {/* Categories */}
                {post.categories && post.categories.length > 0 && post.categories.map((cat: any, idx: number) => {
                  const catName = typeof cat === 'object' ? cat.name : taxonomyNames[cat] || cat
                  return (
                    <Badge key={'cat-' + idx} className="text-sm font-medium bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm">
                      {catName}
                    </Badge>
                  )
                })}
                {/* Subcategories */}
                {post.subcategories && post.subcategories.length > 0 && post.subcategories.map((sub: any, idx: number) => {
                  const subName = typeof sub === 'object' ? sub.name : taxonomyNames[sub] || sub
                  return (
                    <Badge key={'sub-' + idx} className="text-sm font-medium bg-blue-500/40 text-white hover:bg-blue-500/60 backdrop-blur-sm">
                      {subName}
                    </Badge>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Title and Metadata (Date) */}
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">{post.title}</h1>
            <div className="flex items-center space-x-4 text-base text-muted-foreground">
              {/* Removed Views and Comments */}
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>

          {/* Excerpt/Subheading */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground italic border-l-4 border-primary/50 pl-4">
              {post.excerpt}
            </p>
          )}

          <hr className="my-8 border-t border-border" />

          {/* Main Content Body */}
          <Card className="p-8 shadow-none border-none">
            <article
              className="blog-content prose prose-lg max-w-none dark:prose-invert
                                prose-headings:font-bold prose-headings:tracking-tight
                                prose-h1:text-4xl prose-h1:mb-4 prose-h1:mt-8
                                prose-h2:text-3xl prose-h2:mb-3 prose-h2:mt-6
                                prose-h3:text-2xl prose-h3:mb-2 prose-h3:mt-5
                                prose-p:text-lg prose-p:leading-8 prose-p:mb-5
                                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                                prose-strong:font-semibold prose-strong:text-foreground
                                prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                                prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                                prose-li:my-1
                                prose-img:rounded-xl prose-img:shadow-md prose-img:my-6
                                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-6
                                prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                                prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:my-4"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />
          </Card>


        </div>

        {/* Sidebars (Admin View) */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Post Details (Admin View)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Categories & Subcategories */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                Categories & Subcategories
              </h3>
              <div className="space-y-4">
                {/* Categories */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Categories</p>
                  {(() => {
                    const categoryItems = post.categories || []
                    return categoryItems.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {categoryItems.map((cat: any, index: number) => {
                          const catId = typeof cat === 'object' ? cat._id : cat
                          const catName = typeof cat === 'object' ? cat.name : taxonomyNames[catId] || catId
                          return (
                            <Badge key={index} variant="default" className="text-xs">
                              {catName}
                            </Badge>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not specified</p>
                    )
                  })()}
                </div>
                
                {/* Subcategories */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Subcategories</p>
                  {(() => {
                    const subcategoryItems = post.subcategories || []
                    return subcategoryItems.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {subcategoryItems.map((sub: any, index: number) => {
                          const subId = typeof sub === 'object' ? sub._id : sub
                          const subName = typeof sub === 'object' ? sub.name : taxonomyNames[subId] || subId
                          return (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {subName}
                            </Badge>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not specified</p>
                    )
                  })()}
                </div>
              </div>
            </Card>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Metadata */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-primary rounded-full" />
                Information
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="font-medium">{new Date(post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
                {post.updatedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                    <p className="font-medium">{new Date(post.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Post ID</p>
                  <p className="font-mono text-xs break-all">{post._id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Slug</p>
                  <p className="font-mono text-xs break-all">{post.slug}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}