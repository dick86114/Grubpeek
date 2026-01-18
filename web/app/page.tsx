'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, addDays, subDays, isSameMonth } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar } from '@/components/Calendar';
import { DailyMenu } from '@/components/DailyMenu';
import { Menu } from '@/types';
import { Utensils } from 'lucide-react';
import HeaderControls from '@/components/HeaderControls';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync currentMonth when selectedDate changes (if it's in a different month)
  // But be careful not to create loops. If user manually changed month, don't force it back unless they click a date.
  // Actually, we usually want to jump to the month if we select a date.
  // But here we might select a date from current view.
  // Let's just update currentMonth if selectedDate is set from outside (unlikely here) or if we want to ensure sync.
  
  useEffect(() => {
    // Fetch data based on currentMonth (the view) with 7 days buffer for week view cross-month support
    const start = format(subDays(startOfMonth(currentMonth), 7), 'yyyy-MM-dd');
    const end = format(addDays(endOfMonth(currentMonth), 7), 'yyyy-MM-dd');
    
    setLoading(true);
    fetch(`/api/menus?start=${start}&end=${end}`)
      .then(res => res.json())
      .then(data => {
        if (data.menus) {
          setMenus(data.menus);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [currentMonth]); // Fetch when VIEW month changes

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // If selected date is not in current view month, switch view context to that month
    if (!isSameMonth(date, currentMonth)) {
      setCurrentMonth(startOfMonth(date));
    }
  };

  // Filter for current day
  const currentDayStr = format(selectedDate, 'yyyy-MM-dd');
  const dailyMenus = menus.filter(m => m.date === currentDayStr);


  // Get featured dates
  // const featuredDates = Array.from(new Set(
  //   menus.filter(m => m.is_featured).map(m => m.date)
  // ));

  // Get available dates
  const availableDates = Array.from(new Set(
    menus.map(m => m.date)
  ));

  // Get stall special dates
  const stallSpecialDates = Array.from(new Set(
    menus.filter(m => m.category === '档口特色').map(m => m.date)
  ));

  // Get daily stall specials for banner
  const dailyStallSpecials = dailyMenus.filter(m => m.category === '档口特色');

  return (
    <div className="min-h-screen bg-orange-50/30 dark:bg-gray-950 flex flex-col font-sans transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-20 border-b border-orange-100 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2.5 rounded-2xl shadow-lg shadow-orange-200 dark:shadow-none rotate-3 transition-transform hover:rotate-0">
              <Utensils className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-serif tracking-tight">今天有什么好吃的</h1>
              <p className="text-xs text-orange-600 dark:text-orange-500 font-medium tracking-wide uppercase">Daily Menu</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 hidden sm:block bg-orange-50 dark:bg-gray-800 px-3 py-1 rounded-full border border-orange-100 dark:border-gray-700">
              {format(selectedDate, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
            </span>
            
            <HeaderControls />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stall Special Banner - Moved to sidebar */}
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Calendar */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24 space-y-6">
              <Calendar 
                selectedDate={selectedDate} 
                onSelectDate={handleDateSelect}
                stallSpecialDates={stallSpecialDates}
                availableDates={availableDates}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
              />
              
              {/* Stall Special Card - Only show if there are specials today */}
              {dailyStallSpecials.length > 0 && (
                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 dark:from-purple-900 dark:to-indigo-900 rounded-2xl p-5 text-white shadow-lg shadow-purple-200 dark:shadow-none relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
                   <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Today's Special</span>
                      </div>
                      <h2 className="text-lg font-bold font-serif mb-4 flex items-center gap-2">
                        <span className="text-xl">🔥</span> 今日档口特色
                      </h2>
                      <div className="space-y-2">
                         {dailyStallSpecials.map((dish, idx) => (
                            <div key={idx} className="bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                               {dish.name}
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Menu Display */}
          <div className="lg:col-span-8 xl:col-span-9">
             <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 font-serif">
                   {format(selectedDate, 'M月d日', { locale: zhCN })} 菜单
                </h2>
             </div>
            <DailyMenu menus={dailyMenus.map(m => ({ ...m, id: String(m.id) }))} loading={loading} />
          </div>
        </div>
      </main>
      
      <footer className="bg-white dark:bg-gray-900 border-t border-orange-100 dark:border-gray-800 py-8 mt-12 transition-colors duration-300">
         <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
            <p>© 2026 GrubPeek. All rights reserved.</p>
         </div>
      </footer>
    </div>
  );
}
