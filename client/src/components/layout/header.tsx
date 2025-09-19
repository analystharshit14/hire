import { Search, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  title: string;
  description: string;
  onSearch?: (query: string) => void;
  onNewAction?: () => void;
  newActionLabel?: string;
}

export default function Header({ 
  title, 
  description, 
  onSearch, 
  onNewAction, 
  newActionLabel = "New" 
}: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4" data-testid="header">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="header-title">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground" data-testid="header-description">
            {description}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Search */}
          {onSearch && (
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 w-64"
                onChange={(e) => onSearch(e.target.value)}
                data-testid="search-input"
              />
            </div>
          )}
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            data-testid="notifications-button"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
          </Button>
          
          {/* New Action Button */}
          {onNewAction && (
            <Button
              onClick={onNewAction}
              className="flex items-center space-x-2"
              data-testid="new-action-button"
            >
              <Plus className="w-4 h-4" />
              <span>{newActionLabel}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
