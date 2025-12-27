'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Download, Filter, Eye, Users, ShoppingCart, Heart } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface UserActivity {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
    profileImage?: { url: string }
  }
  userName: string
  userEmail: string
  action: string
  resource: string
  resourceId?: string
  description: string
  ipAddress: string
  userAgent?: string
  method: string
  endpoint: string
  statusCode: number
  success: boolean
  errorMessage?: string
  createdAt: string
}

interface ActivityStats {
  totalActivities: number
  actionStats: { _id: string; count: number }[]
  resourceStats: { _id: string; count: number }[]
  topUsers: { _id: string; userName: string; userEmail: string; count: number }[]
}

export default function UserActivitiesPage() {
  const { accessToken } = useAuthStore()
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [selectedResource, setSelectedResource] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedActivity, setSelectedActivity] = useState<UserActivity | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Get today's date in YYYY-MM-DD format for max date validation
  const today = new Date().toISOString().split('T')[0]

  // Validate dates
  const handleStartDateChange = (value: string) => {
    if (value > today) {
      toast.error('Start date cannot be in the future')
      return
    }
    if (endDate && value > endDate) {
      toast.error('Start date cannot be after end date')
      return
    }
    setStartDate(value)
  }

  const handleEndDateChange = (value: string) => {
    if (value > today) {
      toast.error('End date cannot be in the future')
      return
    }
    if (startDate && value < startDate) {
      toast.error('End date cannot be before start date')
      return
    }
    setEndDate(value)
  }

  useEffect(() => {
    if (accessToken) {
      fetchActivities()
      fetchStats()
    }
  }, [accessToken, page, selectedAction, selectedResource, startDate, endDate])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        sort: '-createdAt'
      })

      if (searchQuery) params.append('search', searchQuery)
      if (selectedAction) params.append('action', selectedAction)
      if (selectedResource) params.append('resource', selectedResource)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/user-activities?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      )

      const data = await response.json()

      if (data.success) {
        setActivities(data.data.activities)
        setTotalPages(data.data.pagination.pages)
      } else {
        toast.error(data.message || 'Failed to fetch activities')
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
      toast.error('Failed to fetch user activities')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/user-activities/stats?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      )

      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchActivities()
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedAction) params.append('action', selectedAction)
      if (selectedResource) params.append('resource', selectedResource)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/user-activities/export?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `user-activities-${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Activities exported successfully')
      } else {
        toast.error('Failed to export activities')
      }
    } catch (error) {
      console.error('Failed to export activities:', error)
      toast.error('Failed to export activities')
    }
  }

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      LOGIN: 'bg-green-100 text-green-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
      REGISTER: 'bg-blue-100 text-blue-800',
      ADD_TO_CART: 'bg-purple-100 text-purple-800',
      REMOVE_FROM_CART: 'bg-orange-100 text-orange-800',
      PLACE_ORDER: 'bg-green-100 text-green-800',
      CANCEL_ORDER: 'bg-red-100 text-red-800',
      ADD_TO_WISHLIST: 'bg-pink-100 text-pink-800',
      REVIEW_SUBMIT: 'bg-indigo-100 text-indigo-800'
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8" />
            User Activity Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            Track customer activities, orders, and interactions
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActivities}</div>
            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Most Common Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.actionStats[0]?._id || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.actionStats[0]?.count || 0} times
              </p>
            </CardContent>
          </Card> */}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Most Active Resource
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.resourceStats[0]?._id || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.resourceStats[0]?.count || 0} actions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Most Active User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {stats.topUsers[0]?.userName || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {stats.topUsers[0]?.userEmail || ''}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.topUsers[0]?.count || 0} actions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>

            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="REGISTER">Register</option>
              <option value="ADD_TO_CART">Add to Cart</option>
              <option value="REMOVE_FROM_CART">Remove from Cart</option>
              <option value="PLACE_ORDER">Place Order</option>
              <option value="CANCEL_ORDER">Cancel Order</option>
              <option value="ADD_TO_WISHLIST">Add to Wishlist</option>
              <option value="REVIEW_SUBMIT">Submit Review</option>
            </select>

            <select
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">All Resources</option>
              <option value="Auth">Auth</option>
              <option value="Cart">Cart</option>
              <option value="Wishlist">Wishlist</option>
              <option value="Order">Order</option>
              <option value="Review">Review</option>
              <option value="Product">Product</option>
              <option value="Profile">Profile</option>
            </select>

            <Input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              max={today}
              placeholder="Start Date"
            />

            <Input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              max={today}
              min={startDate || undefined}
              placeholder="End Date"
            />
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch}>Apply Filters</Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setSelectedAction('')
                setSelectedResource('')
                setStartDate('')
                setEndDate('')
                setPage(1)
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Activities</CardTitle>
          <CardDescription>
            All user activities are logged and cannot be modified or deleted
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No activities found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity._id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{activity.userName}</div>
                            <div className="text-xs text-muted-foreground">{activity.userEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                            {activity.action.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell>{activity.resource}</TableCell>
                        <TableCell className="max-w-md truncate">{activity.description}</TableCell>
                        <TableCell className="font-mono text-xs">{activity.ipAddress}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            activity.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {activity.success ? 'Success' : 'Failed'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedActivity(activity)
                              setShowDetails(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {showDetails && selectedActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Activity Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                  <p className="font-medium">{format(new Date(selectedActivity.createdAt), 'PPpp')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User</label>
                  <p className="font-medium">{selectedActivity.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedActivity.userEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Action</label>
                  <p className="font-medium">{selectedActivity.action.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Resource</label>
                  <p className="font-medium">{selectedActivity.resource}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                  <p className="font-mono text-sm">{selectedActivity.ipAddress}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="font-medium">{selectedActivity.success ? 'Success' : 'Failed'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="font-medium">{selectedActivity.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Endpoint</label>
                <p className="font-mono text-sm">{selectedActivity.method} {selectedActivity.endpoint}</p>
              </div>

              {selectedActivity.userAgent && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User Agent</label>
                  <p className="text-sm break-all">{selectedActivity.userAgent}</p>
                </div>
              )}

              {selectedActivity.errorMessage && (
                <div>
                  <label className="text-sm font-medium text-red-600">Error Message</label>
                  <p className="text-sm text-red-600">{selectedActivity.errorMessage}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end">
              <Button onClick={() => setShowDetails(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
