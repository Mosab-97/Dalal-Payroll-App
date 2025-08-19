'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Upload, Download, Plus, Filter } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  onSearch?: (query: string) => void;
  onImport?: () => void;
  onExport?: () => void;
  onAdd?: () => void;
  onFilter?: () => void;
  searchPlaceholder?: string;
}

export function Header({ 
  title, 
  onSearch, 
  onImport, 
  onExport, 
  onAdd, 
  onFilter,
  searchPlaceholder = "Search..." 
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="sticky top-0 z-30 bg-tesla-white/80 backdrop-blur-sm border-b border-tesla-gray/30 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Title */}
        <h1 className="text-2xl font-semibold text-tesla-charcoal tracking-tight">
          {title}
        </h1>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* Search */}
          {onSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-64 rounded-xl border-tesla-gray/50 bg-white/50"
              />
            </div>
          )}

          {/* Filter */}
          {onFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFilter}
              className="rounded-xl border-tesla-gray/50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          )}

          {/* Import */}
          {onImport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onImport}
              className="rounded-xl border-tesla-gray/50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          )}

          {/* Export */}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="rounded-xl border-tesla-gray/50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}

          {/* Add */}
          {onAdd && (
            <Button
              size="sm"
              onClick={onAdd}
              className="btn-accent rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}