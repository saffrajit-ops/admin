"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { useRouter, usePathname } from "next/navigation"
import { Menu, X, LogOut, Home, Package, BookOpen, Tag, Settings, ShoppingCart, Users, Video, ChevronDown, ChevronRight, User, Building2, Mail, ChevronLeft, Image as ImageIcon, FolderTree, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { toast } from "sonner"
import { useNotifications } from "@/hooks/useNotifications"
import { NotificationBadge } from "@/components/notifications/notification-badge"

const navItems: any[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },

  // {
  //   label: "Users",
  //   href: "/dashboard/users",
  //   icon: Users,
  //   subItems: [
  //     { label: "User Activities", href: "/dashboard/settings/user-activities" },
  //     { label: "All Users", href: "/dashboard/users" },


  //   ]
  // },
  // {
  //   label: "Orders",
  //   href: "/dashboard/orders",
  //   icon: ShoppingCart,
  //   subItems: [
  //     { label: "Orders", href: "/dashboard/orders" },
  //     { label: "Returns", href: "/dashboard/orders/returns" },
  //     { label: "Cancelled Orders", href: "/dashboard/orders/cancelled" },
  //   ]
  // },

  {
    label: "Products",
    href: "/dashboard/taxonomy",
    icon: Package,
    subItems: [
      { label: "All Products", href: "/dashboard/products" },
      { label: "Product Categories", href: "/dashboard/taxonomy/product-categories" },
      // { label: "Collections", href: "/dashboard/taxonomy/collections" },
      // { label: "Concerns", href: "/dashboard/taxonomy/concerns" },
      // { label: "Gift Sets", href: "/dashboard/gift-sets" },
      // { label: "Coupons", href: "/dashboard/coupons" },
    ]
  },

  {
    label: "Blog Posts",
    href: "/dashboard/blog",
    icon: BookOpen,
    subItems: [
      { label: "All Blog Posts", href: "/dashboard/blog" },
      { label: "Blog Categories", href: "/dashboard/taxonomy/blog-categories" },
    ]
  },



  // { label: "Banners", href: "/dashboard/banners", icon: ImageIcon },
  // { label: "Newsletter", href: "/dashboard/newsletter", icon: Mail },
  {
    label: "Sections",
    href: "/dashboard/sections",
    icon: Video,
    subItems: [
      // { label: "Overview", href: "/dashboard/sections" },
      { label: "Hero Section", href: "/dashboard/sections/hero/edit" },
      { label: "Luxury Showcase", href: "/dashboard/sections/luxury/edit" },
    ]
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    subItems: [
      { label: "Admin Profile", href: "/dashboard/settings/profile", icon: User },
      { label: "Company Details", href: "/dashboard/settings/company", icon: Building2 },
      { label: "Admin Logs", href: "/dashboard/settings/admin-logs", icon: Layers },

    ]
  },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(['Settings'])
  const [isNavigating, setIsNavigating] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const { newUsers, newOrders, newReturns, newCancellations } = useNotifications()

  // Auto-expand Settings if on settings page, Orders if on orders page, and Taxonomy if on taxonomy page
  useEffect(() => {
    if (pathname.startsWith('/dashboard/settings')) {
      setExpandedItems(prev => prev.includes('Settings') ? prev : [...prev, 'Settings'])
    }
    if (pathname.startsWith('/dashboard/orders')) {
      setExpandedItems(prev => prev.includes('Orders') ? prev : [...prev, 'Orders'])
    }
    if (pathname.startsWith('/dashboard/taxonomy')) {
      setExpandedItems(prev => prev.includes('Taxonomy') ? prev : [...prev, 'Taxonomy'])
    }
  }, [pathname])

  // Reset navigating state when pathname changes
  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      toast.success("Logged out successfully", {
        description: "You have been logged out of your account"
      })
      setTimeout(() => {
        router.push("/login")
      }, 500)
    } catch (error) {
      toast.error("Logout failed", {
        description: "An error occurred while logging out"
      })
      setIsLoggingOut(false)
    }
  }

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    setIsOpen(false)
    if (href !== pathname) {
      setIsNavigating(true)
      router.push(href)
    }
  }

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  return (
    <>
      {/* Navigation Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-60 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-medium">Loading...</p>
          </div>
        </div>
      )}

      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsOpen(false)} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40 lg:translate-x-0 lg:static flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isMinimized ? "w-20" : "w-64"
        )}
      >
        {/* Logo Section */}
        <div
          className={cn(
            "border-b border-sidebar-border mt-16 lg:mt-0 flex items-center justify-between h-[73px] md:h-[89px]",
            isMinimized ? "px-4 justify-center" : "px-6"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "relative rounded-lg flex items-center justify-center overflow-hidden",
                isMinimized ? "w-10 h-10" : "w-12 h-12"
              )}
            >
              <img
                src="/logo.png"
                alt="Saffrajit"
                className="w-full h-full object-cover"
              />
            </div>

            {!isMinimized && (
              <div>
                <h1 className="text-xl font-bold text-sidebar-foreground">Saffrajit</h1>
                <p className="text-xs text-sidebar-foreground/60">Admin Panel</p>
              </div>
            )}
          </div>

          {!isMinimized && (
            <button
              onClick={() => setIsMinimized(true)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer"
              aria-label="Minimize sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>
        {/* Expand button when minimized */}
        {isMinimized && (
          <button
            onClick={() => setIsMinimized(false)}
            className="hidden lg:flex mx-auto my-2 p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer"
            aria-label="Expand sidebar"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Navigation - Scrollable */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-sidebar-accent scrollbar-track-transparent">
          {navItems.map((item) => {
            const isActive = item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/")
            const isExpanded = expandedItems.includes(item.label)
            const hasSubItems = item.subItems && item.subItems.length > 0

            return (
              <div key={item.href}>
                {hasSubItems ? (
                  <>
                    <button
                      onClick={() => toggleExpanded(item.label)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-lg transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isMinimized ? "justify-center px-4 py-4" : "justify-between px-4 py-3"
                      )}
                      title={isMinimized ? item.label : undefined}
                    >
                      <div className={cn("flex items-center gap-3", isMinimized && "justify-center")}>
                        <item.icon className={cn("shrink-0", isMinimized ? "w-6 h-6" : "w-5 h-5")} />
                        {!isMinimized && (
                          <>
                            <span className="font-medium">{item.label}</span>
                            {item.label === 'Orders' && (newOrders + newReturns + newCancellations) > 0 && (
                              <NotificationBadge count={newOrders + newReturns + newCancellations} className="ml-auto" />
                            )}
                          </>
                        )}
                      </div>
                      {!isMinimized && (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                    </button>

                    {isExpanded && !isMinimized && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.subItems.map((subItem: any) => {
                          const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + "/")
                          const SubIcon = subItem.icon
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={(e) => handleNavClick(e, subItem.href)}
                              className={cn(
                                "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm",
                                isSubActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              )}
                            >
                              {SubIcon && <SubIcon size={16} />}
                              <span className="flex-1">{subItem.label}</span>
                              {subItem.label === 'Returns' && newReturns > 0 && (
                                <NotificationBadge count={newReturns} />
                              )}
                              {subItem.label === 'Cancelled Orders' && newCancellations > 0 && (
                                <NotificationBadge count={newCancellations} />
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isMinimized ? "justify-center px-4 py-4" : "px-4 py-3"
                    )}
                    title={isMinimized ? item.label : undefined}
                  >
                    <item.icon className={cn("shrink-0", isMinimized ? "w-6 h-6" : "w-5 h-5")} />
                    {!isMinimized && (
                      <>
                        <span className="font-medium flex-1">{item.label}</span>
                        {item.label === 'Users' && newUsers > 0 && (
                          <NotificationBadge count={newUsers} />
                        )}
                      </>
                    )}
                  </Link>
                )}
              </div>
            )
          })}
        </nav>

        {/* Admin Profile Section */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar">
          {!isMinimized ? (
            <>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/10 mb-2">
                <div className="relative w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold overflow-hidden shrink-0">
                  {user?.profileImage?.url ? (
                    <Image
                      src={user.profileImage.url}
                      alt={user.name || 'Admin'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span>{user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sidebar-foreground truncate text-sm">
                    {user?.name || user?.email}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 capitalize truncate">
                    {user?.role || 'Admin'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut size={18} />
                    Logout
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-2">
                <div className="relative w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold overflow-hidden">
                  {user?.profileImage?.url ? (
                    <Image
                      src={user.profileImage.url}
                      alt={user.name || 'Admin'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span>{user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center p-2 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title={isLoggingOut ? "Logging out..." : "Logout"}
              >
                {isLoggingOut ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogOut size={18} />
                )}
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
