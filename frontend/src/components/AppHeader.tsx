import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationDropdown from "@/components/NotificationDropdown";
import PropertySearchDropdown from "@/components/PropertySearchDropdown";

export default function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="flex h-14 md:h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      {/* Spacer for mobile hamburger */}
      <div className="w-10 md:hidden" />
      <div className="hidden md:block w-full max-w-md">
        <PropertySearchDropdown />
      </div>
      <div className="flex items-center gap-3 md:gap-4 ml-auto">
        <NotificationDropdown />
        <Link to="/settings" className="text-muted-foreground hover:text-foreground">
          <Settings className="h-5 w-5" />
        </Link>
        <Link to="/profile">
          {user && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground overflow-hidden">
              {user.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt={`${user.firstName} ${user.lastName}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{user.firstName?.[0]}{user.lastName?.[0]}</span>
              )}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}