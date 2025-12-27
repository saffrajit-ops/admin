"use client"

import { useState, useRef } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { useBlogStore, BulkUploadResult } from "@/lib/blog-store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, FileSpreadsheet, Download, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface BulkUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BulkUploadDialog({ open, onOpenChange, onSuccess }: BulkUploadDialogProps) {
  const { accessToken } = useAuthStore()
  const { bulkUploadPosts } = useBlogStore()
  
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<BulkUploadResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel"
      ]
      
      if (!validTypes.includes(selectedFile.type)) {
        toast.error("Invalid File Type", {
          description: "Please upload an Excel file (.xlsx or .xls)"
        })
        return
      }

      // Validate file size (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File Too Large", {
          description: "File size must be less than 5MB"
        })
        return
      }

      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file || !accessToken) return

    setUploading(true)
    setProgress(0)
    setResult(null)

    try {
      const uploadResult = await bulkUploadPosts(file, accessToken, (prog) => {
        setProgress(prog)
      })

      setResult(uploadResult)
      
      if (uploadResult.success.length > 0) {
        toast.success("Upload Complete", {
          description: `Successfully uploaded ${uploadResult.success.length} of ${uploadResult.total} blog posts`
        })
        onSuccess()
      }

      if (uploadResult.failed.length === uploadResult.total) {
        toast.error("Upload Failed", {
          description: "All blog posts failed to upload. Please check the errors below."
        })
      }
    } catch (error) {
      toast.error("Upload Failed", {
        description: error instanceof Error ? error.message : "Failed to upload blog posts"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    setUploading(false)
    setProgress(0)
    toast.info("Upload Cancelled", {
      description: "Blog post upload has been cancelled"
    })
  }

  const handleClose = () => {
    if (uploading) {
      handleCancel()
    }
    setFile(null)
    setProgress(0)
    setResult(null)
    onOpenChange(false)
  }

  const handleDownloadTemplate = () => {
    const templateUrl = "/templates/blog-bulk-upload-template.xlsx"
    const link = document.createElement("a")
    link.href = templateUrl
    link.download = "blog-bulk-upload-template.xlsx"
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success("Template Downloaded", {
      description: "Excel template has been downloaded successfully"
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Blog Posts</DialogTitle>
          <DialogDescription>
            Upload multiple blog posts at once using an Excel file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Download the Excel template to get started</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="ml-2"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          {!result && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                {file ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ""
                        }
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Excel files (.xlsx, .xls) up to 5MB
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                {uploading ? (
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Upload
                  </Button>
                ) : (
                  <Button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Blog Posts
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Upload Results */}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Total</span>
                  </div>
                  <p className="text-2xl font-bold">{result.total}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Success</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{result.success.length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium">Failed</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{result.failed.length}</p>
                </div>
              </div>

              {/* Success List */}
              {result.success.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Successfully Uploaded ({result.success.length})
                  </h3>
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2">Row</th>
                          <th className="text-left p-2">Title</th>
                          <th className="text-left p-2">Category</th>
                          <th className="text-center p-2">Published</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.success.map((item) => (
                          <tr key={item.postId} className="border-t">
                            <td className="p-2">{item.row}</td>
                            <td className="p-2">{item.title}</td>
                            <td className="p-2">{item.category || 'N/A'}</td>
                            <td className="p-2 text-center">{item.isPublished ? '✓' : '✗'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Failed List */}
              {result.failed.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Failed Uploads ({result.failed.length})
                  </h3>
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2">Row</th>
                          <th className="text-left p-2">Title</th>
                          <th className="text-left p-2">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.failed.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{item.row}</td>
                            <td className="p-2">{item.title}</td>
                            <td className="p-2 text-red-600 text-xs">{item.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end">
                <Button onClick={handleClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
