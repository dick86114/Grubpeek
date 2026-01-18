'use client';

import React from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, isToday, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Star, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  stallSpecialDates?: string[]; // 'YYYY-MM-DD' - Dates with Stall Special items
  availableDates: string[]; // 'YYYY-MM-DD'
  className?: string;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function Calendar({ selectedDate, onSelectDate, stallSpecialDates = [], availableDates, className, currentMonth, onMonthChange }: CalendarProps) {
  const [viewMode, setViewMode] = React.useState<'week' | 'month'>('week');

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setViewMode('month');
    }
  }, []);

  const days = React.useMemo(() => {
    if (viewMode === 'month') {
      const start = startOfWeek(startOfMonth(currentMonth), { locale: zhCN });
      const end = endOfWeek(endOfMonth(currentMonth), { locale: zhCN });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfWeek(selectedDate, { locale: zhCN });
      const end = endOfWeek(selectedDate, { locale: zhCN });
      return eachDayOfInterval({ start, end });
    }
  }, [currentMonth, viewMode, selectedDate]);

  const prev = () => {
    if (viewMode === 'month') {
      onMonthChange(subMonths(currentMonth, 1));
    } else {
      onSelectDate(subWeeks(selectedDate, 1));
    }
  };

  const next = () => {
    if (viewMode === 'month') {
      onMonthChange(addMonths(currentMonth, 1));
    } else {
      onSelectDate(addWeeks(selectedDate, 1));
    }
  };

  const toggleView = () => {
    setViewMode(v => v === 'week' ? 'month' : 'week');
    if (viewMode === 'week') {
      onMonthChange(startOfMonth(selectedDate));
    }
  };

  return (
    <div className={twMerge("p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-orange-100/50 dark:border-gray-700 transition-colors duration-300", className)}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-1.5 hover:bg-orange-50 dark:hover:bg-gray-700 text-orange-800 dark:text-orange-400 rounded-full transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-orange-50 dark:hover:bg-gray-700 px-3 py-1.5 rounded-full transition-colors group" onClick={toggleView}>
          <h2 className="font-bold text-base text-gray-800 dark:text-gray-200 group-hover:text-orange-900 dark:group-hover:text-orange-400 font-serif tracking-wide transition-colors">
            {viewMode === 'month' 
              ? format(currentMonth, 'yyyy年 M月', { locale: zhCN })
              : format(selectedDate, 'M月', { locale: zhCN }) + ' 第' + format(selectedDate, 'w', { locale: zhCN }) + '周'
            }
          </h2>
          {viewMode === 'week' ? <ChevronDown className="w-3.5 h-3.5 text-orange-400 group-hover:text-orange-600 dark:group-hover:text-orange-300" /> : <ChevronUp className="w-3.5 h-3.5 text-orange-400 group-hover:text-orange-600 dark:group-hover:text-orange-300" />}
        </div>
        <button onClick={next} className="p-1.5 hover:bg-orange-50 dark:hover:bg-gray-700 text-orange-800 dark:text-orange-400 rounded-full transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="font-bold text-orange-900/40 dark:text-orange-200/40 text-[10px] uppercase tracking-widest">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const isStallSpecial = stallSpecialDates.includes(dateKey);
          const hasData = availableDates.includes(dateKey);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={idx}
              onClick={() => {
                onSelectDate(day);
                if (!isSameMonth(day, currentMonth)) {
                    onMonthChange(startOfMonth(day));
                }
              }}
              className={clsx(
                "relative h-9 w-full flex flex-col items-center justify-center rounded-lg transition-all duration-200",
                (viewMode === 'month' && !isCurrentMonth) && "text-gray-300 dark:text-gray-600 opacity-50",
                isSelected 
                  ? "bg-orange-600 text-white shadow-md shadow-orange-200 dark:shadow-none z-10" 
                  : "hover:bg-orange-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300",
                isToday(day) && !isSelected && "border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 font-bold"
              )}
            >
              <span className={clsx("text-xs", isSelected && "font-bold")}>{format(day, 'd')}</span>
              
              <div className="flex gap-0.5 mt-0.5 h-1">
                {isStallSpecial && (
                    <div className={clsx("w-1 h-1 rounded-full", isSelected ? "bg-white" : "bg-purple-500 dark:bg-purple-400")} title="档口特色" />
                )}
                
                {hasData && !isSelected && !isStallSpecial && (
                  <div className="w-1 h-1 bg-orange-200 dark:bg-orange-800/60 rounded-full" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Integrated Tips - REMOVED */}
    </div>
  );
}
