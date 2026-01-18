'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Settings, Sun, Moon, Monitor, LayoutDashboard, ChevronDown, LogOut, Lock } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from './ThemeProvider';
import { clsx } from 'clsx';

interface HeaderControlsProps {
  adminMode?: boolean;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
}

export default function HeaderControls({ adminMode = false, onSettingsClick, onLogoutClick }: HeaderControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes = [
    { id: 'light', icon: Sun, label: '日间模式' },
    { id: 'dark', icon: Moon, label: '夜间模式' },
    { id: 'system', icon: Monitor, label: '跟随系统' },
  ] as const;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-colors"
        title="设置"
      >
        <Settings className="w-5 h-5" />
        <ChevronDown className={clsx("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-400 dark:text-gray-500 px-2 py-1 mb-1 uppercase tracking-wider">
              外观设置
            </div>
            <div className="grid grid-cols-3 gap-1">
              {themes.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  className={clsx(
                    "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all",
                    theme === id
                      ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                      : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50"
                  )}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-medium">{id === 'light' ? '日间' : id === 'dark' ? '夜间' : '自动'}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-2">
            <div className="text-xs font-medium text-gray-400 dark:text-gray-500 px-2 py-1 mb-1 uppercase tracking-wider">
              系统
            </div>
            {adminMode ? (
              <>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onSettingsClick?.();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-900/20 dark:hover:text-orange-400 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  修改密码
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onLogoutClick?.();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </>
            ) : (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-900/20 dark:hover:text-orange-400 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                进入后台管理
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
