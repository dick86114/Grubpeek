'use client';

import React, { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, addDays, subDays, isSameMonth } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar } from '@/components/Calendar';
import { DailyMenu } from '@/components/DailyMenu';
import { Menu } from '@/types';
import { Calendar as CalendarIcon, Utensils, Share2, X, Coffee, Sun, Moon, ShoppingBag, Check, AlertTriangle } from 'lucide-react';
import HeaderControls from '@/components/HeaderControls';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [manualCopyPayload, setManualCopyPayload] = useState<{ title: string; text: string } | null>(null);
  const manualCopyRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (!shareStatus) return;
    const id = window.setTimeout(() => setShareStatus(null), 2500);
    return () => window.clearTimeout(id);
  }, [shareStatus]);

  useEffect(() => {
    if (!shareOpen && !manualCopyPayload) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setShareOpen(false);
      setManualCopyPayload(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shareOpen, manualCopyPayload]);

  const groupByCategory = (items: Menu[]) =>
    items.reduce((acc, item) => {
      const category = item.category?.trim() || '其他';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, Menu[]>);

  const filterShareItems = (type: Menu['type']) => {
    if (type === 'takeaway') return dailyMenus.filter(m => m.type === 'takeaway' || m.category === '外卖包点');
    return dailyMenus.filter(m => m.type === type && m.category !== '外卖包点');
  };

  const mealMeta: Array<{
    type: Menu['type'];
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    chipBg: string;
    chipBorder: string;
    iconBg: string;
    iconFg: string;
  }> = [
    {
      type: 'breakfast',
      label: '早餐',
      icon: Coffee,
      gradient: 'from-amber-500 to-orange-500',
      chipBg: '#FFF7ED',
      chipBorder: '#FED7AA',
      iconBg: 'bg-amber-50 dark:bg-amber-900/25',
      iconFg: 'text-amber-600 dark:text-amber-300',
    },
    {
      type: 'lunch',
      label: '午餐',
      icon: Sun,
      gradient: 'from-green-500 to-emerald-500',
      chipBg: '#ECFDF5',
      chipBorder: '#A7F3D0',
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/25',
      iconFg: 'text-emerald-600 dark:text-emerald-300',
    },
    {
      type: 'dinner',
      label: '晚餐',
      icon: Moon,
      gradient: 'from-blue-600 to-sky-500',
      chipBg: '#EFF6FF',
      chipBorder: '#BFDBFE',
      iconBg: 'bg-sky-50 dark:bg-sky-900/25',
      iconFg: 'text-sky-600 dark:text-sky-300',
    },
    {
      type: 'takeaway',
      label: '外卖包点',
      icon: ShoppingBag,
      gradient: 'from-rose-600 to-pink-500',
      chipBg: '#FFF1F2',
      chipBorder: '#FECDD3',
      iconBg: 'bg-rose-50 dark:bg-rose-900/25',
      iconFg: 'text-rose-600 dark:text-rose-300',
    },
  ];

  const buildSharePayload = (type: Menu['type']) => {
    const meta = mealMeta.find(m => m.type === type)!;
    const items = filterShareItems(type);
    const dateTitle = format(selectedDate, 'yyyy年M月d日 EEEE', { locale: zhCN });
    const groups = groupByCategory(items);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const textGroups = Object.entries(groups)
      .map(([category, dishes]) => {
        const names = dishes.map(d => (d.is_featured ? `【特】${d.name}` : d.name)).join('、');
        return `- ${category}：${names}`;
      })
      .join('\n');

    const text = [
      `【${meta.label}】${dateTitle}`,
      textGroups || '- 暂无数据',
      origin ? `— ${origin}` : '— GrubPeek',
    ].join('\n');

    return { text, count: items.length };
  };

  const legacyCopyText = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.left = '-1000px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    } finally {
      document.body.removeChild(textarea);
    }
    return ok;
  };

  const copyShare = async (type: Menu['type']) => {
    if (isCopying) return;
    setIsCopying(true);
    const meta = mealMeta.find(m => m.type === type)!;
    const payload = buildSharePayload(type);
    try {
      if (payload.count === 0) {
        setShareStatus({ type: 'error', message: `${meta.label}没有菜品数据` });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload.text);
      } else {
        const ok = legacyCopyText(payload.text);
        if (!ok) {
          setShareOpen(false);
          setManualCopyPayload({
            title: `${meta.label} · ${format(selectedDate, 'yyyy年M月d日', { locale: zhCN })}`,
            text: payload.text,
          });
          setShareStatus({ type: 'error', message: '当前环境禁止自动写入剪贴板，请手动复制' });
          return;
        }
      }

      setShareOpen(false);
      setManualCopyPayload(null);
      setShareStatus({ type: 'success', message: `${meta.label}分享已复制` });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '';
      
      // Fallback to legacy copy or manual copy if clipboard API fails
      const ok = legacyCopyText(payload.text);
      if (ok) {
        setShareOpen(false);
        setManualCopyPayload(null);
        setShareStatus({ type: 'success', message: `${meta.label}已复制（纯文本）` });
        return;
      }

      setShareOpen(false);
      setManualCopyPayload({ 
        title: `${meta.label} · ${format(selectedDate, 'yyyy年M月d日', { locale: zhCN })}`, 
        text: payload.text 
      });
      setShareStatus({ type: 'error', message: '当前环境禁止自动写入剪贴板，请手动复制' });
    } finally {
      setIsCopying(false);
    }
  };

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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-serif tracking-tight">今天吃什么</h1>
              <p className="text-xs text-orange-600 dark:text-orange-500 font-medium tracking-wide uppercase">Daily Menu</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative group">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hidden sm:flex bg-orange-50 dark:bg-gray-800 px-4 py-1.5 rounded-full border border-orange-100 dark:border-gray-700 group-hover:border-orange-300 dark:group-hover:border-gray-500 transition-colors cursor-pointer shadow-sm">
                    <CalendarIcon className="w-4 h-4 text-orange-500" />
                    <span>{format(selectedDate, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}</span>
                </div>
                <input 
                    type="date" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 hidden sm:block"
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                         if(e.target.value) handleDateSelect(new Date(e.target.value));
                    }}
                    onClick={(e) => {
                        try {
                            e.currentTarget.showPicker();
                        } catch {}
                    }}
                />
            </div>
            
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-xl bg-white/70 dark:bg-gray-900/40 border border-orange-100 dark:border-gray-800 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
              title="分享"
              aria-label="分享"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-bold">分享</span>
            </button>

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
                        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Today’s Special</span>
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

      {shareStatus && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border text-sm font-bold backdrop-blur-md ${
              shareStatus.type === 'success'
                ? 'bg-white/90 dark:bg-gray-900/80 border-green-100 dark:border-green-900/40 text-green-700 dark:text-green-300'
                : 'bg-white/90 dark:bg-gray-900/80 border-red-100 dark:border-red-900/40 text-red-700 dark:text-red-300'
            }`}
          >
            {shareStatus.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{shareStatus.message}</span>
          </div>
        </div>
      )}

      {shareOpen && (
        <div className="fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-black/20 dark:bg-black/55 backdrop-blur-[2px]"
            onClick={() => setShareOpen(false)}
            aria-label="关闭"
          />
          <div className="absolute inset-x-0 bottom-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[92vw] sm:max-w-lg">
            <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200/70 dark:border-gray-800 overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2">
                    <span className="text-[11px] font-extrabold tracking-[0.18em] text-gray-400 dark:text-gray-500">
                      SHARE
                    </span>
                    <span className="h-[1px] w-10 bg-gray-200 dark:bg-gray-800" />
                  </div>
                  <div className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100 font-serif">
                    选择要分享的分类
                  </div>
                </div>
                <button
                  onClick={() => setShareOpen(false)}
                  className="ml-4 p-2 rounded-xl text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors shrink-0"
                  title="关闭"
                  aria-label="关闭"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300">
                    {format(selectedDate, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
                  </div>
                  <div className="text-xs font-bold text-gray-400 dark:text-gray-500">
                    点一下即复制
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mealMeta.map(m => {
                    const Icon = m.icon;
                    const count = filterShareItems(m.type).length;
                    return (
                      <button
                        key={m.type}
                        onClick={() => copyShare(m.type)}
                        disabled={isCopying}
                        className="group w-full rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60 active:scale-[0.99] transition-all text-left disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <div className="p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-11 h-11 rounded-2xl border border-gray-200/70 dark:border-gray-800 flex items-center justify-center ${m.iconBg}`}>
                              <Icon className={`w-5 h-5 ${m.iconFg}`} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                                {m.label}
                              </div>
                              <div className="mt-0.5 text-xs font-bold text-gray-400 dark:text-gray-500">
                                {count} 道
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0 px-3 py-1.5 rounded-full border border-gray-200/70 dark:border-gray-800 bg-white/60 dark:bg-gray-900/40 text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:border-gray-300 dark:group-hover:border-gray-700 transition-colors">
                            复制
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                  若环境限制剪贴板写入，会自动尝试纯文本复制或提供手动复制。
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {manualCopyPayload && (
        <div className="fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-black/20 dark:bg-black/55 backdrop-blur-[2px]"
            onClick={() => setManualCopyPayload(null)}
            aria-label="关闭"
          />
          <div className="absolute inset-x-0 bottom-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[92vw] sm:max-w-lg">
            <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200/70 dark:border-gray-800 overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2">
                    <span className="text-[11px] font-extrabold tracking-[0.18em] text-gray-400 dark:text-gray-500">COPY</span>
                    <span className="h-[1px] w-10 bg-gray-200 dark:bg-gray-800" />
                  </div>
                  <div className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100 font-serif">手动复制</div>
                  <div className="mt-1 text-xs font-bold text-gray-400 dark:text-gray-500 truncate">{manualCopyPayload.title}</div>
                </div>
                <button
                  onClick={() => setManualCopyPayload(null)}
                  className="ml-4 p-2 rounded-xl text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors shrink-0"
                  title="关闭"
                  aria-label="关闭"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 pb-[calc(20px+env(safe-area-inset-bottom))] space-y-3">
                <textarea
                  ref={manualCopyRef}
                  readOnly
                  value={manualCopyPayload.text}
                  className="w-full h-44 resize-none rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/40"
                />
                <div>
                  <button
                    onClick={() => {
                      const el = manualCopyRef.current;
                      if (!el) return;
                      el.focus();
                      el.select();
                      try {
                        el.setSelectionRange(0, el.value.length);
                      } catch {}
                    }}
                    className="w-full rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60 active:scale-[0.99] transition-all px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200"
                  >
                    全选
                  </button>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                  你的浏览器/容器环境对剪贴板写入做了限制。点“全选”后复制即可。
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
