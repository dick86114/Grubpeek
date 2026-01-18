'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { format, startOfWeek, addDays, getDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Menu } from '@/types';
import { Trash2, Edit, Plus, Upload, Save, X, ArrowLeft, Utensils, Check, FileSpreadsheet, LogOut, Loader2, KeyRound, Download, List, Calendar, AlertTriangle, Lock, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import HeaderControls from '@/components/HeaderControls';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'files' | 'menus'>('files');

  // File Management State
  const [files, setFiles] = useState<{name: string, mtime: string}[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{name: string, type: 'success' | 'error', message: string}[]>([]);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [conflictData, setConflictData] = useState<{file: File, dates: string[]} | null>(null);
  
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  
  // Menu Management State
  const [menuDates, setMenuDates] = useState<{date: string, counts: {type: string, count: number}[]}[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');
  const [editDate, setEditDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dailyMenus, setDailyMenus] = useState<Menu[]>([]);
  const [editingItem, setEditingItem] = useState<Menu | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Partial<Menu>>({
    type: 'breakfast',
    category: '',
    name: '',
    price: 5,
    is_featured: false
  });

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth Check
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // Fetch Data when auth is true and tab changes
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'files') {
        fetchFiles();
      } else {
        fetchMenuDates();
      }
    }
  }, [isAuthenticated, activeTab]);

  // Fetch daily menus when entering edit mode or changing date
  useEffect(() => {
    if (isAuthenticated && activeTab === 'menus' && viewMode === 'edit') {
        fetchDailyMenus(editDate);
    }
  }, [isAuthenticated, activeTab, viewMode, editDate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('admin_token', data.token);
        setIsAuthenticated(true);
      } else {
        alert(data.error || '登录失败');
      }
    } catch (e) {
      alert('登录出错');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setPassword('');
  };

  const fetchFiles = () => {
    fetch('/api/files')
      .then(res => res.json())
      .then(data => setFiles(data.files || []));
  };

  const fetchMenuDates = () => {
    fetch('/api/menus/summary')
      .then(res => res.json())
      .then(data => {
        setMenuDates(data.dates || []);
        setSelectedDates([]); // Reset selection on refresh
      });
  };

  const toggleDateSelection = (date: string) => {
    setSelectedDates(prev => 
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedDates.length === 0) return;
    setShowBatchDeleteConfirm(true);
  };

  const confirmBatchDelete = async () => {
    try {
        const res = await fetch(`/api/menus?dates=${selectedDates.join(',')}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            fetchMenuDates();
            setSelectedDates([]);
            setShowBatchDeleteConfirm(false);
        } else {
            alert('批量删除失败: ' + data.error);
        }
    } catch (e) {
        alert('请求出错');
    }
  };

  const fetchDailyMenus = (date: string) => {
    fetch(`/api/menus?start=${date}&end=${date}`)
      .then(res => res.json())
      .then(data => setDailyMenus(data.menus || []));
  };

  // Process queue
  useEffect(() => {
    if (uploadQueue.length > 0 && !uploading && !conflictData) {
        const file = uploadQueue[0];
        processUpload(file);
    }
  }, [uploadQueue, uploading, conflictData]);

  const processUpload = async (file: File, action?: 'overwrite' | 'keep') => {
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    if (action) formData.append('action', action);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (res.status === 409) {
          setConflictData({ file, dates: data.dates });
          setUploading(false);
          return;
      }
      
      const result = data.success 
        ? { name: file.name, type: 'success' as const, message: data.imported ? `导入 ${data.count} 条` : '已保存(未导入)' }
        : { name: file.name, type: 'error' as const, message: data.error || '失败' };

      setUploadResults(prev => [...prev, result]);
      
      if (data.success) {
        fetchFiles();
        if (data.imported) fetchMenuDates();
      }
      
      // Remove from queue
      setUploadQueue(prev => prev.slice(1));
      setConflictData(null);

    } catch (e: any) {
      setUploadResults(prev => [...prev, { name: file.name, type: 'error', message: `系统错误: ${e.message}` }]);
      setUploadQueue(prev => prev.slice(1));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        setUploadResults([]);
        setUploadQueue(Array.from(e.target.files));
    }
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    setDeleteError(null);
    
    try {
      const res = await fetch(`/api/files?filename=${fileToDelete}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchFiles();
        setFileToDelete(null);
      } else {
        setDeleteError(data.error || '删除失败');
      }
    } catch (e) {
      setDeleteError('请求出错，请检查网络或稍后重试');
    }
  };

  // Menu Data Operations
  const handleDeleteItem = async (id: number) => {
    if (!confirm('确定删除?')) return;
    await fetch(`/api/menus?id=${id}`, { method: 'DELETE' });
    fetchDailyMenus(editDate);
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    await fetch('/api/menus', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingItem)
    });
    setEditingItem(null);
    fetchDailyMenus(editDate);
  };

  const handleAddItem = async () => {
    await fetch('/api/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newItem, date: editDate })
    });
    setIsAdding(false);
    setNewItem({ type: 'breakfast', category: '其他', name: '', price: 5, is_featured: false });
    fetchDailyMenus(editDate);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
        setPasswordStatus({ type: 'error', message: '两次输入的密码不一致' });
        return;
    }
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setPasswordStatus({ type: 'success', message: '密码修改成功' });
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => setShowSettings(false), 1500);
      } else {
        setPasswordStatus({ type: 'error', message: data.error });
      }
    } catch (e) {
      setPasswordStatus({ type: 'error', message: '修改失败' });
    }
  };

  const handleDownload = (filename: string) => {
      const link = document.createElement('a');
      link.href = `/api/download?filename=${encodeURIComponent(filename)}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Helper to get day name
  const getDayName = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        return format(date, 'EEEE', { locale: zhCN });
    } catch {
        return '';
    }
  };

  // Group menu dates by month
  const groupedDates = useMemo(() => {
    const groups: {[key: string]: typeof menuDates} = {};
    menuDates.forEach(item => {
        const month = format(new Date(item.date), 'yyyy年MM月', { locale: zhCN });
        if (!groups[month]) groups[month] = [];
        groups[month].push(item);
    });
    return groups;
  }, [menuDates]);

  // Helper for row colors
  const getRowClass = (menu: Menu) => {
    if (menu.type === 'takeaway' || menu.category === '外卖包点') return 'bg-rose-50/50 hover:bg-rose-100 border-rose-100 text-rose-900 dark:bg-rose-900/10 dark:hover:bg-rose-900/20 dark:border-rose-900/30 dark:text-rose-100';
    if (menu.type === 'breakfast') return 'bg-amber-50/50 hover:bg-amber-100 border-amber-100 text-amber-900 dark:bg-amber-900/10 dark:hover:bg-amber-900/20 dark:border-amber-900/30 dark:text-amber-100';
    if (menu.type === 'lunch') return 'bg-green-50/50 hover:bg-green-100 border-green-100 text-green-900 dark:bg-green-900/10 dark:hover:bg-green-900/20 dark:border-green-900/30 dark:text-green-100';
    if (menu.type === 'dinner') return 'bg-blue-50/50 hover:bg-blue-100 border-blue-100 text-blue-900 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 dark:border-blue-900/30 dark:text-blue-100';
    return 'hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-100';
  };

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50/30 dark:bg-gray-950 font-sans transition-colors duration-300">
        <form onSubmit={handleLogin} className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-orange-100 dark:border-gray-800 w-96 relative overflow-hidden transition-colors duration-300">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-red-600"></div>
          
          <div className="flex justify-center mb-6">
             <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-2xl shadow-lg shadow-orange-200 rotate-3">
               <Utensils className="text-white w-8 h-8" />
             </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-2 text-center font-serif text-gray-900 dark:text-white">管理员登录</h1>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">省投食堂 GrubPeek Admin</p>
          
          <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">密码</label>
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="请输入管理员密码"
                    className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
            </div>
            
            <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold p-3 rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all active:scale-95">
                登 录
            </button>
          </div>
          
          <div className="mt-8 text-center">
            <Link href="/" className="text-orange-600 dark:text-orange-500 text-sm hover:text-orange-700 dark:hover:text-orange-400 font-medium flex items-center justify-center gap-1">
                <ArrowLeft className="w-4 h-4" /> 返回首页
            </Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50/30 dark:bg-gray-900 font-sans pb-20 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-20 border-b border-orange-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="group">
                <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2.5 rounded-2xl shadow-lg shadow-orange-200 transition-transform group-hover:rotate-3">
                    <Utensils className="text-white w-6 h-6" />
                </div>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-serif tracking-tight">后台管理</h1>
              <p className="text-xs text-orange-600 font-medium tracking-wide uppercase">SYSTEM</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <HeaderControls 
              adminMode 
              onSettingsClick={() => setShowSettings(true)} 
              onLogoutClick={handleLogout} 
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        


        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-orange-100 dark:border-gray-700 w-fit mx-auto transition-colors duration-300">
            <button
                onClick={() => setActiveTab('files')}
                className={clsx(
                    "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                    activeTab === 'files' 
                        ? "bg-orange-500 text-white shadow-md shadow-orange-200 dark:shadow-none" 
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
                )}
            >
                <FileSpreadsheet className="w-4 h-4" />
                文件管理
            </button>
            <button
                onClick={() => setActiveTab('menus')}
                className={clsx(
                    "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                    activeTab === 'menus' 
                        ? "bg-orange-500 text-white shadow-md shadow-orange-200 dark:shadow-none" 
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
                )}
            >
                <Utensils className="w-4 h-4" />
                菜单管理
            </button>
        </div>

        {/* File Management Tab */}
        {activeTab === 'files' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-orange-100/50 dark:border-gray-800 transition-colors duration-300">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 font-serif text-gray-800 dark:text-gray-100">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Upload className="w-5 h-5" />
                        </div>
                        上传菜单
                    </h2>
                    
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={clsx(
                            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                            uploading ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" : "border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700"
                        )}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleUpload} 
                            className="hidden" 
                            accept=".xlsx,.xls,.csv,.et" 
                            multiple
                            disabled={uploading}
                        />
                        {uploading ? (
                            <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                <span className="text-sm font-medium">正在上传并导入... ({uploadQueue.length} 个等待中)</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                                <FileSpreadsheet className="w-10 h-10 text-blue-400" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">点击上传 Excel/ET 文件 (支持多选)</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">文件名需包含日期 (如: 2026年1月4日.xlsx)</span>
                            </div>
                        )}
                    </div>

                    {uploadResults.length > 0 && (
                        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {uploadResults.map((res, i) => (
                                <div key={i} className={clsx("p-3 rounded-lg text-sm font-medium flex items-start gap-2", res.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400')}>
                                    {res.type === 'success' ? <Check className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <X className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                                    <div>
                                        <span className="font-bold">{res.name}:</span> {res.message}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* History Files Section */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-orange-100/50 dark:border-gray-800 transition-colors duration-300">
                    <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center justify-between">
                        <span>历史文件</span>
                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">{files.length}</span>
                    </h2>
                    
                    {files.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-600 text-sm">
                            暂无历史文件
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {files.map(file => (
                                <div key={file.name} className="group p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md hover:border-orange-200 dark:hover:border-orange-700 transition-all bg-white dark:bg-gray-800 relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                            <span className="font-medium text-gray-700 dark:text-gray-200 text-sm truncate" title={file.name}>{file.name}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => handleDownload(file.name)}
                                                className="text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                title="下载文件"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => setFileToDelete(file.name)}
                                                className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                title="删除文件"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500">
                                        <span>{new Date(file.mtime).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Menu Management Tab */}
        {activeTab === 'menus' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-orange-100/50 dark:border-gray-800 min-h-[600px] flex flex-col transition-colors duration-300">
                {viewMode === 'list' ? (
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2 font-serif text-gray-800 dark:text-gray-100">
                                <Calendar className="w-5 h-5 text-orange-500" />
                                已导入菜单日期
                            </h2>
                            {selectedDates.length > 0 && (
                                <button 
                                    onClick={handleBatchDelete}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-sm font-bold transition-colors animate-in fade-in slide-in-from-right-4"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    批量删除 ({selectedDates.length})
                                </button>
                            )}
                        </div>
                        {menuDates.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 dark:text-gray-500 flex flex-col items-center gap-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-full">
                                    <List className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                </div>
                                暂无数据，请先在文件管理中上传菜单
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(groupedDates).map(([month, items]) => (
                                    <div key={month} className="space-y-4">
                                        <div className="flex justify-between items-center pl-1 border-l-4 border-orange-500">
                                            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{month}</h3>
                                            <button 
                                                onClick={() => {
                                                    const monthDates = items.map(i => i.date);
                                                    const allSelected = monthDates.every(d => selectedDates.includes(d));
                                                    if (allSelected) {
                                                        setSelectedDates(prev => prev.filter(d => !monthDates.includes(d)));
                                                    } else {
                                                        setSelectedDates(prev => Array.from(new Set([...prev, ...monthDates])));
                                                    }
                                                }}
                                                className="text-xs text-orange-600 dark:text-orange-500 hover:text-orange-700 dark:hover:text-orange-400 font-bold px-2 py-1 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                                            >
                                                全选本月
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {items.map(item => (
                                                <div 
                                                    key={item.date}
                                                    onClick={() => {
                                                        if (selectedDates.length > 0) {
                                                            toggleDateSelection(item.date);
                                                        } else {
                                                            setViewMode('edit');
                                                            setEditDate(item.date);
                                                        }
                                                    }}
                                                    className={clsx(
                                                        "flex flex-col p-4 rounded-xl border transition-all text-left group relative overflow-hidden cursor-pointer",
                                                        selectedDates.includes(item.date) 
                                                            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30 ring-2 ring-orange-200 dark:ring-orange-800" 
                                                            : "border-orange-100 dark:border-gray-700 bg-orange-50/30 dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-gray-700/80 hover:border-orange-200 dark:hover:border-gray-600 hover:shadow-md"
                                                    )}
                                                >
                                                    <div className="absolute top-3 right-3 z-10" onClick={e => e.stopPropagation()}>
                                                         <input 
                                                            type="checkbox" 
                                                            checked={selectedDates.includes(item.date)}
                                                            onChange={() => toggleDateSelection(item.date)}
                                                            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-orange-600 focus:ring-orange-500 cursor-pointer dark:bg-gray-700"
                                                        />
                                                    </div>
                                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-orange-100/50 dark:to-orange-900/20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
                                                    <div className="flex items-center justify-between w-full mb-3 relative pr-8">
                                                        <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{item.date}</span>
                                                        <span className="text-xs text-orange-600 dark:text-orange-400 font-medium bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">{getDayName(item.date)}</span>
                                                    </div>
                                                    <div className="space-y-1 relative">
                                                        {[...item.counts].sort((a, b) => {
                                                            const order: Record<string, number> = { 'breakfast': 1, 'lunch': 2, 'dinner': 3, 'takeaway': 4 };
                                                            return (order[a.type] || 99) - (order[b.type] || 99);
                                                        }).map(c => (
                                                            <div key={c.type} className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                                                <span>{c.type === 'breakfast' ? '早餐' : c.type === 'lunch' ? '午餐' : c.type === 'dinner' ? '晚餐' : '外卖包点'}</span>
                                                                <span className="font-medium text-gray-700 dark:text-gray-300">{c.count}道</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b border-orange-100 dark:border-gray-800 flex items-center gap-4 bg-orange-50/30 dark:bg-gray-800 transition-colors duration-300">
                            <button 
                                onClick={() => setViewMode('list')}
                                className="p-2 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm rounded-lg text-gray-500 dark:text-gray-400 transition-all"
                                title="返回列表"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                    编辑菜单
                                    <span className="text-base font-normal text-gray-500 dark:text-gray-400 ml-2 border-l border-gray-300 dark:border-gray-600 pl-3">{editDate} {getDayName(editDate)}</span>
                                </h2>
                            </div>
                        </div>
                        
                        <div className="p-6 flex-1">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <div className="relative group">
                                    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-1.5 rounded-xl border border-orange-100 dark:border-gray-700 shadow-sm group-hover:shadow-md transition-all cursor-pointer">
                                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-500">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">切换日期</span>
                                            <span className="text-sm font-bold text-gray-800 dark:text-gray-100 font-mono">{editDate}</span>
                                        </div>
                                        <div className="pr-2 text-gray-400">
                                             <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <input
                                        type="date"
                                        value={editDate}
                                        onChange={e => setEditDate(e.target.value)}
                                        onClick={(e) => {
                                            try {
                                                e.currentTarget.showPicker();
                                            } catch {}
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700 mb-4">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="bg-orange-50/50 dark:bg-gray-800 border-b border-orange-100 dark:border-gray-700">
                                    <th className="p-3 text-xs font-bold text-orange-900/70 dark:text-orange-200/70 uppercase tracking-wider w-20">餐别</th>
                                    <th className="p-3 text-xs font-bold text-orange-900/70 dark:text-orange-200/70 uppercase tracking-wider w-24">分类</th>
                                    <th className="p-3 text-xs font-bold text-orange-900/70 dark:text-orange-200/70 uppercase tracking-wider w-64">菜名</th>
                                    <th className="p-3 text-xs font-bold text-orange-900/70 dark:text-orange-200/70 uppercase tracking-wider w-20">价格</th>
                                    <th className="p-3 text-xs font-bold text-orange-900/70 dark:text-orange-200/70 uppercase tracking-wider w-16 text-center">特色</th>
                                    <th className="p-3 text-xs font-bold text-orange-900/70 dark:text-orange-200/70 uppercase tracking-wider w-24 text-center">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {dailyMenus.length === 0 && !isAdding && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-gray-400 dark:text-gray-500">
                                                该日期暂无数据，请添加或从左侧导入
                                            </td>
                                        </tr>
                                    )}
                                    {dailyMenus.map(menu => (
                                    <tr key={menu.id} className={clsx("transition-colors group border-l-4", getRowClass(menu))}>
                                        {editingItem?.id === menu.id ? (
                                        <>
                                            <td className="p-3">
                                            <select 
                                                value={editingItem.type} 
                                                onChange={e => setEditingItem({...editingItem, type: e.target.value as any})}
                                                className="border border-orange-200 dark:border-gray-600 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="breakfast">早餐</option>
                                                <option value="lunch">午餐</option>
                                                <option value="dinner">晚餐</option>
                                                <option value="takeaway">外卖包点</option>
                                            </select>
                                            </td>
                                            <td className="p-3">
                                            <input 
                                                value={editingItem.category} 
                                                onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                                                className="border border-orange-200 dark:border-gray-600 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                                            />
                                            </td>
                                            <td className="p-3">
                                            <input 
                                                value={editingItem.name} 
                                                onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                                                className="border border-orange-200 dark:border-gray-600 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                                            />
                                            </td>
                                            <td className="p-3">
                                            <input 
                                                type="number"
                                                value={editingItem.price} 
                                                onChange={e => setEditingItem({...editingItem, price: parseInt(e.target.value)})}
                                                className="border border-orange-200 dark:border-gray-600 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                                            />
                                            </td>
                                            <td className="p-3 text-center">
                                            <input 
                                                type="checkbox"
                                                checked={editingItem.is_featured} 
                                                onChange={e => setEditingItem({...editingItem, is_featured: e.target.checked})}
                                                className="w-5 h-5 text-orange-600 focus:ring-orange-500 rounded cursor-pointer dark:bg-gray-700"
                                            />
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-2 justify-center">
                                                    <button onClick={handleUpdateItem} className="p-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors" title="保存"><Check className="w-4 h-4" /></button>
                                                    <button onClick={() => setEditingItem(null)} className="p-1.5 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" title="取消"><X className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </>
                                        ) : (
                                        <>
                                            <td className="p-3 font-medium text-sm">
                                            {menu.type === 'breakfast' ? '早餐' : menu.type === 'lunch' ? '午餐' : menu.type === 'dinner' ? '晚餐' : '外卖包点'}
                                            </td>
                                            <td className="p-3 text-sm opacity-80">{menu.category}</td>
                                            <td className="p-3 font-bold text-sm">{menu.name}</td>
                                            <td className="p-3 text-sm opacity-80">¥{menu.price}</td>
                                            <td className="p-3 text-center">{menu.is_featured ? <span className="text-red-500 text-lg">★</span> : <span className="text-gray-300 dark:text-gray-600">-</span>}</td>
                                            <td className="p-3">
                                                <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditingItem(menu)} className="p-1.5 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg transition-colors shadow-sm" title="编辑"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteItem(menu.id)} className="p-1.5 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 rounded-lg transition-colors shadow-sm" title="删除"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </>
                                        )}
                                    </tr>
                                    ))}
                                    
                                    {/* Add Row */}
                                    {isAdding && (
                  <tr className="bg-orange-50/50 dark:bg-orange-900/10 border-t border-orange-100 dark:border-orange-900/30 animate-in fade-in">
                    <td className="p-3">
                      <select 
                        value={newItem.type} 
                        onChange={e => setNewItem({...newItem, type: e.target.value as any})}
                        className="border border-orange-200 dark:border-orange-800 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="breakfast">早餐</option>
                        <option value="lunch">午餐</option>
                        <option value="dinner">晚餐</option>
                        <option value="takeaway">外卖</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <input 
                        value={newItem.category} 
                        onChange={e => setNewItem({...newItem, category: e.target.value})}
                        className="border border-orange-200 dark:border-orange-800 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                        placeholder="分类"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        value={newItem.name} 
                        onChange={e => setNewItem({...newItem, name: e.target.value})}
                        className="border border-orange-200 dark:border-orange-800 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="菜名"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number"
                        value={newItem.price} 
                        onChange={e => setNewItem({...newItem, price: parseInt(e.target.value)})}
                        className="border border-orange-200 dark:border-orange-800 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox"
                        checked={newItem.is_featured} 
                        onChange={e => setNewItem({...newItem, is_featured: e.target.checked})}
                        className="w-5 h-5 text-orange-600 focus:ring-orange-500 rounded cursor-pointer accent-orange-500"
                      />
                    </td>
                    <td className="p-3">
                        <div className="flex gap-2 justify-center">
                            <button onClick={handleAddItem} className="p-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors" title="确定"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setIsAdding(false)} className="p-1.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="取消"><X className="w-4 h-4" /></button>
                        </div>
                    </td>
                  </tr>
                )}
                                </tbody>
                                </table>
                            </div>

                            {!isAdding && (
                                <button onClick={() => setIsAdding(true)} className="w-full py-3 flex items-center justify-center gap-2 text-orange-600 font-bold hover:bg-orange-50 rounded-xl border border-dashed border-orange-200 transition-all">
                                    <Plus className="w-5 h-5" /> 添加新菜品
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        )}

      </main>

      {/* Delete Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">确认删除文件？</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        您即将删除文件 <span className="font-bold text-gray-800 dark:text-gray-200">{fileToDelete}</span><br/>
                        删除文件<strong className="text-orange-600 dark:text-orange-400">不会</strong>影响数据库中已导入的菜单数据。
                    </p>
                    {deleteError && (
                        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2 text-left">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {deleteError}
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button 
                            onClick={() => {
                                setFileToDelete(null);
                                setDeleteError(null);
                            }}
                            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            取消
                        </button>
                        <button 
                            onClick={confirmDeleteFile}
                            className="flex-1 px-4 py-2 bg-red-500 dark:bg-red-600 text-white font-bold rounded-xl hover:bg-red-600 dark:hover:bg-red-700 transition-colors shadow-lg shadow-red-200 dark:shadow-none"
                        >
                            确认删除
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Conflict Confirmation Modal */}
      {conflictData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">数据冲突提示</h3>
                    <p className="text-sm text-gray-500 mb-6 text-left bg-gray-50 p-3 rounded-lg">
                        系统检测到以下日期已有菜单数据：<br/>
                        <span className="font-bold text-gray-800 break-all">{conflictData.dates.slice(0, 5).join(', ')}{conflictData.dates.length > 5 ? '...' : ''}</span>
                        <br/><br/>
                        请选择操作：
                    </p>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => processUpload(conflictData.file, 'overwrite')}
                            className="w-full px-4 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                        >
                            覆盖旧数据 (删除并重新导入)
                        </button>
                        <button 
                            onClick={() => processUpload(conflictData.file, 'keep')}
                            className="w-full px-4 py-2.5 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
                        >
                            保留原数据 (仅保存文件)
                        </button>
                        <button 
                            onClick={() => {
                                setConflictData(null);
                                setUploadQueue(prev => prev.slice(1));
                            }}
                            className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            跳过此文件
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

        {/* Batch Delete Confirmation Modal */}
        {showBatchDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                    <div className="p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">确认批量删除?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            您即将删除 <span className="font-bold text-gray-800">{selectedDates.length}</span> 天的菜单数据。<br/>
                            此操作<strong className="text-red-600">不可撤销</strong>。
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowBatchDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                取消
                            </button>
                            <button 
                                onClick={confirmBatchDelete}
                                className="flex-1 px-4 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                            >
                                确认删除
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden scale-100 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800">
                    <div className="p-6">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <KeyRound className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">修改管理员密码</h3>
                        </div>
                        
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">原密码</label>
                                <input 
                                    type="password" 
                                    value={oldPassword} 
                                    onChange={e => setOldPassword(e.target.value)}
                                    className="w-full border border-gray-200 dark:border-gray-700 p-3 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                                    placeholder="请输入当前密码"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">新密码</label>
                                <input 
                                    type="password" 
                                    value={newPassword} 
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full border border-gray-200 dark:border-gray-700 p-3 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                                    placeholder="请输入新密码"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">确认新密码</label>
                                <input 
                                    type="password" 
                                    value={confirmNewPassword} 
                                    onChange={e => setConfirmNewPassword(e.target.value)}
                                    className="w-full border border-gray-200 dark:border-gray-700 p-3 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                                    placeholder="请再次输入新密码"
                                    required
                                    minLength={6}
                                />
                            </div>

                            {passwordStatus && (
                                <div className={clsx("p-3 rounded-lg text-sm font-medium flex items-center gap-2", passwordStatus.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400')}>
                                    {passwordStatus.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                    {passwordStatus.message}
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setShowSettings(false);
                                        setPasswordStatus(null);
                                        setOldPassword('');
                                        setNewPassword('');
                                        setConfirmNewPassword('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    取消
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-orange-500 dark:bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-600 dark:hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 dark:shadow-none"
                                >
                                    确认修改
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
