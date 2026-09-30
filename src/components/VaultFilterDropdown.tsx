import React, { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: string;
  count?: string;
  badge?: string;
  description?: string;
}

interface VaultFilterDropdownProps {
  label: string;
  labelIcon?: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  primaryColor?: string;
  searchable?: boolean;
  className?: string;
  badgeText?: string;
}

export const VaultFilterDropdown: React.FC<VaultFilterDropdownProps> = ({
  label,
  labelIcon = 'tune',
  value,
  options,
  onChange,
  placeholder = 'Select option...',
  primaryColor = '#004ac6',
  searchable = false,
  className = '',
  badgeText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen, searchable]);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable && search.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        (opt.description && opt.description.toLowerCase().includes(search.toLowerCase())) ||
        (opt.badge && opt.badge.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  return (
    <div className={`relative flex flex-col gap-1.5 ${className}`} ref={dropdownRef}>
      {/* Label Row */}
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-[13px] font-bold text-[#111c2d] uppercase tracking-wider flex items-center gap-1.5">
          {labelIcon && (
            <span
              className="material-symbols-outlined text-[16px] sm:text-[18px] shrink-0"
              style={{ color: primaryColor }}
            >
              {labelIcon}
            </span>
          )}
          <span>{label}</span>
        </label>
        {badgeText && (
          <span className="text-[10px] font-semibold text-slate-500 hidden sm:inline-block">
            {badgeText}
          </span>
        )}
      </div>

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 sm:py-3 rounded-xl bg-white border transition-all text-left cursor-pointer shadow-xs ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-100 shadow-md'
            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/60'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption?.icon ? (
            <span
              className="material-symbols-outlined text-[20px] shrink-0"
              style={{ color: primaryColor }}
            >
              {selectedOption.icon}
            </span>
          ) : (
            <span className="material-symbols-outlined text-[20px] text-slate-400 shrink-0">
              {labelIcon}
            </span>
          )}

          <div className="flex items-center gap-2 truncate">
            <span className="text-xs sm:text-[14px] font-bold text-[#111c2d] truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.badge && (
              <span className="hidden sm:inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 shrink-0">
                {selectedOption.badge}
              </span>
            )}
            {selectedOption?.count && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 shrink-0">
                {selectedOption.count}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1 text-slate-400">
          <span
            className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          >
            expand_more
          </span>
        </div>
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden divide-y divide-slate-100 animate-fadeIn min-w-[240px]">
          {/* Search bar inside dropdown if enabled or list is long */}
          {(searchable || options.length > 7) && (
            <div className="p-2.5 bg-slate-50/80 border-b border-slate-100">
              <div className="relative flex items-center bg-white rounded-lg px-2.5 py-1.5 border border-slate-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100">
                <span className="material-symbols-outlined text-slate-400 text-[18px] mr-1.5">search</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${label.replace(':', '')}...`}
                  className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
                {search && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearch('');
                    }}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto py-1.5 focus:outline-none">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-blue-50/70 text-blue-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {opt.icon && (
                        <span
                          className={`material-symbols-outlined text-[18px] shrink-0 transition-colors ${
                            isSelected
                              ? 'text-blue-600'
                              : 'text-slate-400 group-hover:text-blue-500'
                          }`}
                        >
                          {opt.icon}
                        </span>
                      )}

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 truncate">
                          <span className={`text-xs sm:text-[13px] truncate ${isSelected ? 'font-bold text-blue-900' : 'text-slate-800'}`}>
                            {opt.label}
                          </span>
                          {opt.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 shrink-0">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.description && (
                          <span className="text-[10px] text-slate-400 truncate">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {opt.count && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isSelected
                              ? 'bg-blue-200/60 text-blue-900'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {opt.count}
                        </span>
                      )}
                      {isSelected ? (
                        <span className="material-symbols-outlined text-[18px] text-blue-600 shrink-0">
                          check_circle
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-[18px] text-transparent group-hover:text-slate-300 shrink-0">
                          arrow_forward
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
