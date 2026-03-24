import {
  Bell,
  Clock,
  Film,
  Heart,
  Home,
  List,
  LogOut,
  Plus,
  Shield,
  Tv,
  User,
  Video,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUnreadCount } from "@/lib/api";
import { useSession } from "@/auth/useSession";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalUploadIndicator } from "@/components/upload/GlobalUploadIndicator";

export function AppLayout() {
  const { user, isAuthenticated, logout } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetch = () => { getUnreadCount().then((r) => setUnreadCount(r.count)).catch(() => {}); };
    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen w-full">
      <div className="flex min-h-screen w-full">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-card sm:flex">
          <div className="flex h-16 items-center border-b px-6">
            <NavLink to="/" className="flex items-center gap-2 font-semibold">
              <Film className="h-6 w-6" />
              <span>StreamAdy</span>
            </NavLink>
          </div>
          <nav className="flex flex-col gap-1 p-4">
            <NavItem to="/" icon={<Home className="h-4 w-4" />}>
              Accueil
            </NavItem>
            <NavItem to="/films" icon={<Video className="h-4 w-4" />}>
              Films
            </NavItem>
            <NavItem to="/series" icon={<Tv className="h-4 w-4" />}>
              Séries
            </NavItem>
            <NavItem to="/favorites" icon={<Heart className="h-4 w-4" />}>
              Favoris
            </NavItem>
            <NavItem to="/watchlist" icon={<List className="h-4 w-4" />}>
              Ma liste
            </NavItem>
            <NavItem to="/history" icon={<Clock className="h-4 w-4" />}>
              Historique
            </NavItem>
            <NavItem to="/suggestions" icon={<Plus className="h-4 w-4" />}>
              Suggestions
            </NavItem>
          </nav>
        </aside>

        <div className="flex flex-1 flex-col sm:pl-60">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-end gap-4 border-b bg-card px-6">
            {isAuthenticated && (
              <NavLink to="/notifications" className="relative">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="notif-bell-badge">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Button>
              </NavLink>
            )}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="overflow-hidden rounded-full"
                  >
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold">
                        {user?.username?.charAt(0).toUpperCase() ?? <User className="h-5 w-5" />}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user?.username}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <NavLink to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profil
                    </NavLink>
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <NavLink to="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin
                      </NavLink>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <NavLink to="/login">Login</NavLink>
              </Button>
            )}
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <GlobalUploadIndicator />
    </div>
  );
}

function NavItem({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavLink to={to} end>
      {({ isActive }) => (
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className="w-full justify-start"
        >
          {icon}
          <span className="ml-2">{children}</span>
        </Button>
      )}
    </NavLink>
  );
}
