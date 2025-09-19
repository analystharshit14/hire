import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Video, 
  TrendingUp, 
  CalendarClock,
  FileText,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Candidates", href: "/candidates", icon: Users },
    { name: "Interviews", href: "/interviews", icon: Calendar },
    { name: "Recordings", href: "/recordings", icon: Video },
    { name: "Analytics", href: "/analytics", icon: TrendingUp },
    { name: "Scheduling", href: "/scheduling", icon: CalendarClock },
    { name: "Reports", href: "/reports", icon: FileText },
  ];

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold text-foreground">InterviewGuru</h1>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "sidebar-item flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              data-testid={`nav-${item.name.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm font-medium text-foreground">SC</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Sarah Chen</p>
            <p className="text-xs text-muted-foreground truncate">HR Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}
