"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Search, Loader2, UserCheck, UserX, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface User {
  _id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  phone?: string
}

interface UsersResponse {
  success: boolean
  data: {
    users: User[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

export default function UsersPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [navigating, setNavigating] = useState(false)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  })
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)

  const fetchUsers = async () => {
    if (!accessToken) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      })

      if (search) {
        params.append("search", search)
      }

      if (roleFilter !== "all") {
        params.append("role", roleFilter)
      }

      const response = await apiClient.request<UsersResponse>(
        `/admin/users?${params.toString()}`,
        {
          token: accessToken,
        },
      )

      setUsers(response.data.users)
      setPagination(response.data.pagination)
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to fetch users",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handleClearSearch = async () => {
    setSearch("")
    setPage(1)

    // Fetch users immediately with empty search
    if (!accessToken) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "10",
      })

      if (roleFilter !== "all") {
        params.append("role", roleFilter)
      }

      const response = await apiClient.request<UsersResponse>(
        `/admin/users?${params.toString()}`,
        {
          token: accessToken,
        },
      )

      setUsers(response.data.users)
      setPagination(response.data.pagination)
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to fetch users",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUserClick = (userId: string) => {
    setNavigating(true)
    router.push(`/dashboard/users/${userId}`)
  }

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (!accessToken) return

    setTogglingUserId(userId)
    try {
      await apiClient.request(`/admin/users/${userId}/toggle-status`, {
        method: "PUT",
        token: accessToken,
      })

      toast.success("Success", {
        description: `User ${currentStatus ? "blocked" : "unblocked"} successfully`,
      })

      // Update local state
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, isActive: !currentStatus } : user,
        ),
      )
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to update user status",
      })
    } finally {
      setTogglingUserId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Loading Overlay */}
      {navigating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-medium">Loading user details...</p>
          </div>
        </div>
      )}

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Users Management</h1>
          <p className="text-muted-foreground mt-2">Manage and monitor all users</p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Total {pagination.total} users found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-10 rounded-lg"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button type="submit" className="rounded-lg cursor-pointer">
                  Search
                </Button>
              </form>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[180px] rounded-lg cursor-pointer">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Roles</SelectItem>
                  <SelectItem value="user" className="cursor-pointer">User</SelectItem>
                  <SelectItem value="admin" className="cursor-pointer">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {loading ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-8 w-20 ml-auto rounded-lg" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow
                          key={user._id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleUserClick(user._id)}
                        >
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={user.role === "admin" ? "default" : "secondary"}
                              className="capitalize"
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={user.isActive ? "default" : "destructive"}
                              className="gap-1"
                            >
                              {user.isActive ? (
                                <>
                                  <UserCheck className="h-3 w-3" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <UserX className="h-3 w-3" />
                                  Blocked
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant={user.isActive ? "destructive" : "default"}
                              size="sm"
                              onClick={() => handleToggleStatus(user._id, user.isActive)}
                              disabled={togglingUserId === user._id}
                              className="rounded-lg cursor-pointer"
                            >
                              {togglingUserId === user._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : user.isActive ? (
                                "Block"
                              ) : (
                                "Unblock"
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} users
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="rounded-lg cursor-pointer"
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="rounded-lg cursor-pointer"
                    >
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        let pageNum
                        if (pagination.pages <= 5) {
                          pageNum = i + 1
                        } else if (page <= 3) {
                          pageNum = i + 1
                        } else if (page >= pagination.pages - 2) {
                          pageNum = pagination.pages - 4 + i
                        } else {
                          pageNum = page - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="rounded-lg w-9 h-9 p-0 cursor-pointer"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.pages}
                      className="rounded-lg cursor-pointer"
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(pagination.pages)}
                      disabled={page === pagination.pages}
                      className="rounded-lg cursor-pointer"
                    >
                      Last
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
