'use client';

import React from 'react';
interface Menu {
  id: string;
  name: string;
  category?: string;
  type?: 'breakfast' | 'lunch' | 'dinner' | 'takeaway';
  is_featured?: boolean;
}
import { Star, Zap, Coffee, Sun, Moon, ShoppingBag } from 'lucide-react';
import { clsx } from 'clsx';

interface DailyMenuProps {
  menus: Menu[];
  loading?: boolean;
}

const MealSection = ({ title, time, price, items, colorTheme, icon: Icon, showPrice = true }: { title: string, time: string, price: number, items: Menu[], colorTheme: 'amber' | 'orange' | 'blue' | 'rose' | 'green', icon: React.ComponentType<{ className?: string }>, showPrice?: boolean }) => {
  // Group by category
  const grouped = items.reduce((acc, item) => {
    const cat = item.category || '其他';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, Menu[]>);

  const themeStyles = {
    amber: {
      bg: 'bg-amber-50/50 dark:bg-amber-900/10',
      border: 'border-amber-100 dark:border-amber-900/30',
      text: 'text-amber-900 dark:text-amber-100',
      icon: 'text-amber-500 dark:text-amber-400',
      price: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
    },
    orange: {
      bg: 'bg-orange-50/50 dark:bg-orange-900/10',
      border: 'border-orange-100 dark:border-orange-900/30',
      text: 'text-orange-900 dark:text-orange-100',
      icon: 'text-orange-500 dark:text-orange-400',
      price: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200'
    },
    green: {
      bg: 'bg-green-50/50 dark:bg-green-900/10',
      border: 'border-green-100 dark:border-green-900/30',
      text: 'text-green-900 dark:text-green-100',
      icon: 'text-green-500 dark:text-green-400',
      price: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
    },
    blue: {
      bg: 'bg-blue-50/50 dark:bg-blue-900/10',
      border: 'border-blue-100 dark:border-blue-900/30',
      text: 'text-blue-900 dark:text-blue-100',
      icon: 'text-blue-500 dark:text-blue-400',
      price: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
    },
    rose: {
      bg: 'bg-rose-50/50 dark:bg-rose-900/10',
      border: 'border-rose-100 dark:border-rose-900/30',
      text: 'text-rose-900 dark:text-rose-100',
      icon: 'text-rose-500 dark:text-rose-400',
      price: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200'
    }
  };

  const theme = themeStyles[colorTheme];

  return (
    <div className={`flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border ${theme.border} p-5 relative overflow-hidden transition-colors duration-300 group hover:shadow-md`}>
       {/* Decorative Background Icon */}
       <Icon className={`absolute -right-4 -top-4 w-24 h-24 ${theme.icon} opacity-5 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-6`} />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.icon}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h3 className={`text-lg font-bold font-serif ${theme.text}`}>{title}</h3>
                <span className={`text-xs font-medium ${theme.icon} opacity-80 whitespace-nowrap`}>{time}</span>
            </div>
        </div>
        {showPrice && (
            <span className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wide shrink-0 ${theme.price}`}>
            ¥{price}
            </span>
        )}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-center py-8 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">暂无供应</p>
      ) : (
        <div className="space-y-6 relative z-10">
          {Object.entries(grouped).map(([category, dishes]) => {
            const isStallSpecial = category === '档口特色';
            return (
              <div key={category} className={isStallSpecial ? 'bg-purple-50/80 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800 shadow-sm' : ''}>
                <h4 className={`font-medium text-sm mb-3 flex items-center gap-2 uppercase tracking-wider ${isStallSpecial ? 'text-purple-700 dark:text-purple-300 font-bold' : 'text-gray-400 dark:text-gray-500'}`}>
                  {isStallSpecial && <Zap className="w-4 h-4 fill-current animate-pulse" />}
                  {category}
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {dishes.map(dish => (
                    <div 
                      key={dish.id} 
                      className={clsx(
                        "px-3.5 py-2.5 rounded-lg text-sm border flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-default",
                        dish.is_featured 
                            ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-300 font-bold shadow-sm" 
                            : isStallSpecial 
                                ? "bg-white dark:bg-gray-800 border-purple-100 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold shadow-sm"
                                : "bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-gray-200 dark:hover:border-gray-500"
                      )}
                    >
                      {!!dish.is_featured && <Star className="w-3.5 h-3.5 fill-current text-red-500" />}
                      {dish.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export function DailyMenu({ menus, loading }: DailyMenuProps) {
  if (loading) {
    return (
        <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full mx-auto mb-4"></div>
            <div className="text-gray-400 dark:text-gray-500 font-medium">正在准备菜单...</div>
        </div>
    );
  }

  if (menus.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-dashed border-gray-200 dark:border-gray-700 text-center transition-colors duration-300">
        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <Coffee className="w-8 h-8 text-gray-300 dark:text-gray-500" />
        </div>
        <div className="text-gray-900 dark:text-gray-100 text-lg font-bold mb-2 font-serif">暂无今日菜单数据</div>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md">请在左侧日历中选择标有颜色的日期查看，或者联系管理员更新菜单。</p>
      </div>
    );
  }

  // Extract '外卖包点' via type or category
  const takeaway = menus.filter(m => m.type === 'takeaway' || m.category === '外卖包点');
  
  // Filter other meals excluding '外卖包点'
  const breakfast = menus.filter(m => m.type === 'breakfast' && m.category !== '外卖包点');
  const lunch = menus.filter(m => m.type === 'lunch' && m.category !== '外卖包点');
  const dinner = menus.filter(m => m.type === 'dinner' && m.category !== '外卖包点');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
      <MealSection title="早餐" time="07:30 - 09:00" price={5} items={breakfast} colorTheme="amber" icon={Coffee} />
      <MealSection title="午餐" time="11:30 - 13:00" price={25} items={lunch} colorTheme="green" icon={Sun} />
      <MealSection title="晚餐" time="17:30 - 19:00" price={15} items={dinner} colorTheme="blue" icon={Moon} />
      <MealSection title="外卖包点" time="14:00 - 19:00" price={0} showPrice={false} items={takeaway} colorTheme="rose" icon={ShoppingBag} />
    </div>
  );
}
