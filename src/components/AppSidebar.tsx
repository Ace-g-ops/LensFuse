import { useState, useEffect } from "react";
import {
  Images,
  Sparkles,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Wand2,
  User,
  LogOut,
  Loader2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { getErrorMessage, logout } from "@/lib/api-utils";

const navItems = [
  { title: "Generate", url: "/generate", icon: Sparkles },
  { title: "Gallery", url: "/gallery", icon: Images },
  { title: "Presets", url: "/presets", icon: Settings2 },
];

interface AppSidebarProps {
  isMobile?: boolean;
  open?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isMobile, open = false, onClose }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    if (!api.isAuthenticated()) {
      setIsLoadingUser(false);
      return;
    }

    try {
      const userData = await api.getUser();
      setUser(userData);
    } catch (err) {
      // Silently fail - user might not be authenticated
      console.error("Failed to load user:", err);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCollapseToggle = () => {
    // Disable collapse toggle on mobile to keep behavior simple
    if (isMobile) return;
    setCollapsed((prev) => !prev);
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        // Desktop: sticky sidebar that can collapse
        !isMobile && "h-screen sticky top-0",
        !isMobile && (collapsed ? "w-16" : "w-64"),
        // Mobile: slide-in drawer
        isMobile &&
          cn(
            "fixed inset-y-0 left-0 z-40 w-64 transform md:hidden",
            open ? "translate-x-0" : "-translate-x-full"
          )
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 glow">
          <Wand2 className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
            <div className="overflow-hidden">
              <h1 className="font-semibold text-foreground truncate">LensFuse</h1>
            </div>
            {/* Mobile close button */}
            {isMobile && (
              <button
                onClick={onClose}
                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground md:hidden"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close sidebar</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all duration-200",
              collapsed && "justify-center px-0"
            )}
            activeClassName="bg-sidebar-accent text-primary"
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="font-medium">{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Menu */}
      {api.isAuthenticated() && (
        <div className="p-3 border-t border-sidebar-border">
          {isLoadingUser ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            </div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-sidebar-accent transition-colors",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NavLink to="/profile" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/auth")}
              className="w-full justify-start"
            >
              <User className="w-4 h-4 mr-2" />
              {!collapsed && "Login"}
            </Button>
          )}
        </div>
      )}

      {/* Collapse Toggle */}
      {!isMobile && (
        <button
          onClick={handleCollapseToggle}
          className="flex items-center justify-center gap-2 p-4 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      )}
    </aside>
  );
}