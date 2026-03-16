/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Book as BookIcon, 
  QrCode, 
  Users as UsersIcon, 
  MoreHorizontal,
  Search,
  Plus,
  ArrowRightLeft,
  History,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Filter,
  X,
  Camera,
  LogOut,
  Settings,
  FileText,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  Edit,
  Moon,
  Sun,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, addDays, isAfter, parseISO, subDays, startOfMonth, isWithinInterval } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

import { Book, User, Transaction, Fine } from './types';
import { INITIAL_BOOKS, INITIAL_USERS, COLORS } from './constants';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'books', label: 'Books', icon: BookIcon },
    { id: 'scan', label: 'Scan', icon: QrCode },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-black/5 dark:border-white/5 pb-safe pt-2 px-4 flex justify-between items-center z-50 transition-colors duration-300">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "bottom-nav-item flex-1 py-2 relative",
              isActive ? "text-medium-indigo dark:text-indigo-400" : "text-slate-400 dark:text-slate-400"
            )}
          >
            <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="mt-1">{tab.label}</span>
            {isActive && (
              <motion.div 
                layoutId="activeTab"
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-medium-indigo dark:bg-indigo-400 rounded-full"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};

const Header = ({ title }: { title: string }) => (
  <header className="sticky top-0 bg-deep-indigo dark:bg-slate-950 text-white px-6 py-4 flex justify-between items-center z-40 shadow-md transition-colors duration-300">
    <h1 className="text-xl font-bold tracking-tight">{title}</h1>
  </header>
);

const StatCard = ({ label, value, icon: Icon, color, trend }: any) => (
  <div className="mobile-card p-4 flex flex-col gap-2">
    <div className="flex justify-between items-start">
      <div className={cn("p-2 rounded-xl bg-opacity-10", `bg-[${color}]`)} style={{ backgroundColor: `${color}1A` }}>
        <Icon size={20} style={{ color }} />
      </div>
      {trend && (
        <span className={cn("text-xs font-bold", trend > 0 ? "text-emerald" : "text-crimson")}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('ribath_books');
    return saved ? JSON.parse(saved) : INITIAL_BOOKS;
  });
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ribath_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('ribath_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ribath_books', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem('ribath_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('ribath_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // --- Derived Data ---
  const reportData = useMemo(() => {
    // 1. Basic Stats
    const available = books.filter(b => b.status === 'Available').length;
    const overdue = books.filter(b => b.status === 'Overdue').length;
    const activeUsers = users.filter(u => u.membershipStatus === 'Active').length;
    const totalFines = users.reduce((acc, u) => acc + u.outstandingFines, 0);

    // 2. Chart Data (Last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayName = format(date, 'EEE');
      
      const dayTransactions = transactions.filter(t => t.date === dateStr);
      const issues = dayTransactions.filter(t => t.type === 'Issue').length;
      const returns = dayTransactions.filter(t => t.type === 'Return').length;
      
      return { name: dayName, issues, returns };
    });

    // 3. Monthly Circulation
    const currentMonthStart = startOfMonth(new Date());
    const monthlyTransactions = transactions.filter(t => {
      try {
        const tDate = parseISO(t.date);
        return isAfter(tDate, currentMonthStart) || t.date === format(currentMonthStart, 'yyyy-MM-dd');
      } catch {
        return false;
      }
    });
    const monthlyCirculation = monthlyTransactions.length;

    // 4. Fine Collected
    const fineCollected = transactions
      .filter(t => t.type === 'Return' && t.status === 'Completed' && t.fineAmount)
      .reduce((acc, t) => acc + (t.fineAmount || 0), 0);

    // 5. Top Categories
    const categoryCounts: Record<string, number> = {};
    const borrowedBooks = books.filter(b => b.status === 'Borrowed' || b.status === 'Overdue');
    borrowedBooks.forEach(b => {
      categoryCounts[b.category] = (categoryCounts[b.category] || 0) + 1;
    });

    const totalBorrowed = borrowedBooks.length || 1;
    const topCategories = Object.entries(categoryCounts)
      .map(([label, count]) => ({
        label,
        value: Math.round((count / totalBorrowed) * 100),
        color: label === 'Fiction' ? COLORS.mediumIndigo : 
               label === 'Science' ? COLORS.emerald : 
               label === 'Classic' ? COLORS.amber : 
               COLORS.crimson
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);

    return { 
      available, 
      overdue, 
      activeUsers, 
      totalFines, 
      last7Days, 
      monthlyCirculation, 
      fineCollected, 
      topCategories 
    };
  }, [books, users, transactions]);

  const stats = reportData;
  const chartData = reportData.last7Days;

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('ribath_darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('ribath_settings');
    const defaults = {
      libraryName: 'Ribath Library',
      finePerDay: 5,
      currency: '₹',
      loanPeriod: 14,
      categories: ['Fiction', 'Classic', 'Dystopian', 'Science']
    };
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaults, ...parsed };
    }
    return defaults;
  });

  useEffect(() => {
    localStorage.setItem('ribath_darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('ribath_settings', JSON.stringify(settings));
  }, [settings]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [isBookDetailsOpen, setIsBookDetailsOpen] = useState(false);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [isFineModalOpen, setIsFineModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);

  const [isEditingBook, setIsEditingBook] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'book' | 'user', id: string } | null>(null);

  // --- Handlers ---
  const handleDeleteBook = (id: string) => {
    setDeleteTarget({ type: 'book', id });
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteUser = (id: string) => {
    setDeleteTarget({ type: 'user', id });
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'book') {
      setBooks(books.filter(b => b.id !== deleteTarget.id));
      setIsBookDetailsOpen(false);
    } else {
      setUsers(users.filter(u => u.id !== deleteTarget.id));
      setIsUserDetailsOpen(false);
    }
    setIsDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const handleEditBook = (updatedBook: Book) => {
    setBooks(books.map(b => b.id === updatedBook.id ? updatedBook : b));
    setSelectedBook(updatedBook);
    setIsEditingBook(false);
  };

  const handleEditUser = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    setSelectedUser(updatedUser);
    setIsEditingUser(false);
  };

  const handleIssueBook = (bookId: string, userId: string, issueDate: string = new Date().toISOString()) => {
    const book = books.find(b => b.id === bookId);
    const user = users.find(u => u.id === userId);

    if (book && user && book.status === 'Available') {
      const dueDate = format(addDays(parseISO(issueDate), 14), 'yyyy-MM-dd');
      
      setBooks(books.map(b => b.id === bookId ? { 
        ...b, 
        status: 'Borrowed', 
        borrowerId: userId, 
        dueDate 
      } : b));

      const newTransaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        bookId,
        userId,
        type: 'Issue',
        date: issueDate,
        dueDate,
        status: 'Completed'
      };
      setTransactions([newTransaction, ...transactions]);
      return true;
    }
    return false;
  };

  const handleReturnBook = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (book && book.status !== 'Available') {
      setBooks(books.map(b => b.id === bookId ? { 
        ...b, 
        status: 'Available', 
        borrowerId: undefined, 
        dueDate: undefined 
      } : b));

      const newTransaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        bookId,
        userId: book.borrowerId!,
        type: 'Return',
        date: new Date().toISOString(),
        status: 'Completed'
      };
      setTransactions([newTransaction, ...transactions]);
      return true;
    }
    return false;
  };

  // --- Views ---

  const DashboardView = () => (
    <div className="flex flex-col gap-6 pb-24">
      <div className="px-6 pt-4 flex gap-3">
        <button 
          onClick={() => setIsIssueModalOpen(true)}
          className="flex-1 bg-medium-indigo text-white p-4 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform shadow-sm"
        >
          <ArrowRightLeft size={24} />
          <span className="text-xs font-bold">Issue Book</span>
        </button>
        <button 
          onClick={() => setIsReturnModalOpen(true)}
          className="flex-1 bg-emerald text-white p-4 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform shadow-sm"
        >
          <History size={24} />
          <span className="text-xs font-bold">Return Book</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 px-6">
        <StatCard label="Books Available" value={stats.available} icon={BookIcon} color={COLORS.emerald} />
        <StatCard label="Overdue Items" value={stats.overdue} icon={AlertCircle} color={COLORS.crimson} />
        <StatCard label="Active Users" value={stats.activeUsers} icon={UsersIcon} color={COLORS.mediumIndigo} />
        <StatCard label="Total Fines" value={`${settings.currency}${stats.totalFines}`} icon={CreditCard} color={COLORS.amber} />
      </div>

      <div className="px-6">
        <div className="mobile-card p-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-medium-indigo dark:text-indigo-400" />
            Weekly Transactions
          </h3>
          <div className="h-48 w-full min-h-[192px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#334155" : "#E2E8F0"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: darkMode ? '#94A3B8' : '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: darkMode ? '#94A3B8' : '#64748B' }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    backgroundColor: darkMode ? '#1E293B' : '#FFFFFF',
                    color: darkMode ? '#FFFFFF' : '#000000'
                  }}
                  cursor={{ fill: darkMode ? '#334155' : '#F1F5F9' }}
                />
                <Bar dataKey="issues" fill={COLORS.mediumIndigo} radius={[4, 4, 0, 0]} />
                <Bar dataKey="returns" fill={COLORS.emerald} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="px-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Activity</h3>
          <button 
            onClick={() => setActiveTab('books')}
            className="text-xs font-bold text-medium-indigo dark:text-indigo-400"
          >
            View All
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {transactions.slice(0, 5).map((tx) => {
            const book = books.find(b => b.id === tx.bookId);
            const user = users.find(u => u.id === tx.userId);
            return (
              <div key={tx.id} className="mobile-card p-3 flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl",
                  tx.type === 'Issue' ? "bg-emerald/10 text-emerald" : "bg-medium-indigo/10 text-medium-indigo dark:text-indigo-400"
                )}>
                  <ArrowRightLeft size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{book?.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.fullName} • {tx.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-400">{format(parseISO(tx.date), 'HH:mm')}</p>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-400">{format(parseISO(tx.date), 'MMM d')}</p>
                </div>
              </div>
            );
          })}
          {transactions.length === 0 && (
            <div className="py-8 text-center text-slate-400 dark:text-slate-600">
              <History size={40} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const BooksView = () => {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    
    const filteredBooks = books.filter(b => {
      const searchLower = (search || '').toLowerCase();
      const matchesSearch = (b.title || '').toLowerCase().includes(searchLower) || 
                           (b.author || '').toLowerCase().includes(searchLower) ||
                           (b.isbn || '').includes(search || '');
      const matchesCategory = activeCategory === 'All' || b.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    return (
      <div className="flex flex-col gap-4 pb-24 px-6 pt-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search books, authors, ISBN..."
            className="w-full bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-medium-indigo/20 dark:focus:ring-indigo-500/20 transition-all dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {['All', ...(settings.categories || [])].map((cat) => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full border border-black/5 dark:border-white/5 text-xs font-bold transition-colors whitespace-nowrap",
                activeCategory === cat ? "bg-medium-indigo text-white" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredBooks.map((book) => (
            <motion.div 
              layout
              key={book.id} 
              onClick={() => {
                setSelectedBook(book);
                setIsBookDetailsOpen(true);
              }}
              className="mobile-card flex gap-4 p-3 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{book.title}</h4>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      book.status === 'Available' ? "bg-emerald/10 text-emerald" : 
                      book.status === 'Borrowed' ? "bg-medium-indigo/10 text-medium-indigo dark:text-indigo-400" : "bg-crimson/10 text-crimson"
                    )}>
                      {book.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{book.author}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1">ISBN: {book.isbn}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{book.category}</p>
                  <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-400">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <button 
          onClick={() => setIsAddBookModalOpen(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-medium-indigo text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform z-30"
        >
          <Plus size={28} />
        </button>
      </div>
    );
  };

  const UsersView = () => {
    const [search, setSearch] = useState('');
    const filteredUsers = users.filter(u => {
      const searchLower = (search || '').toLowerCase();
      return (u.fullName || '').toLowerCase().includes(searchLower) || 
             (u.email && u.email.toLowerCase().includes(searchLower));
    });

    return (
      <div className="flex flex-col gap-4 pb-24 px-6 pt-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search users by name, roll number..."
            className="w-full bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-medium-indigo/20 dark:focus:ring-indigo-500/20 transition-all dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3">
          {filteredUsers.map((user) => (
            <div 
              key={user.id} 
              onClick={() => {
                setSelectedUser(user);
                setIsUserDetailsOpen(true);
              }}
              className="mobile-card p-4 flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.fullName}</h4>
                  {user.outstandingFines > 0 && (
                    <span className="text-[10px] font-bold text-crimson bg-crimson/10 px-2 py-0.5 rounded-full">
                      {settings.currency}{user.outstandingFines}
                    </span>
                  )}
                </div>
                {user.email && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    user.membershipStatus === 'Active' ? "bg-emerald" : "bg-crimson"
                  )} />
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    {user.rollNumber} • {user.batch} • Exp: {format(parseISO(user.expiryDate), 'MMM yyyy')}
                  </span>
                </div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-400">
                <ChevronRight size={18} />
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => setIsAddUserModalOpen(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-medium-indigo text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform z-30"
        >
          <Plus size={28} />
        </button>
      </div>
    );
  };

  const ScanView = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [manualId, setManualId] = useState('');

    const handleManualSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!manualId.trim()) return;
      
      const decodedText = manualId.trim();
      const book = books.find(b => b.isbn === decodedText || b.id === decodedText);
      const user = users.find(u => u.id === decodedText);

      if (book) {
        setSelectedBook(book);
        setIsBookDetailsOpen(true);
        setManualId('');
      } else if (user) {
        setSelectedUser(user);
        setIsFineModalOpen(user.outstandingFines > 0);
        setManualId('');
      } else {
        alert(`ID: ${decodedText}. No matching book or user found.`);
      }
    };

    useEffect(() => {
      let html5QrCode: Html5Qrcode | null = null;
      let isScannerStarted = false;

      if (isScanning) {
        setScanError(null);
        html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            // Handle scan result
            console.log("Scan result:", decodedText);
            const book = books.find(b => b.isbn === decodedText || b.id === decodedText);
            const user = users.find(u => u.id === decodedText);

            if (book) {
              setSelectedBook(book);
              setIsBookDetailsOpen(true);
              setIsScanning(false);
            } else if (user) {
              setSelectedUser(user);
              setIsFineModalOpen(user.outstandingFines > 0);
              setIsScanning(false);
            } else {
              alert(`Scanned: ${decodedText}. No matching book or user found.`);
            }
          },
          (errorMessage) => {
            // parse error, ignore
          }
        ).then(() => {
          isScannerStarted = true;
        }).catch(err => {
          console.error("Scanner error:", err);
          if (err?.toString().includes("NotAllowedError") || err?.name === "NotAllowedError") {
            setScanError("Camera permission denied. Please enable camera access in your browser settings.");
          } else {
            setScanError("Failed to start camera. Please ensure no other app is using it.");
          }
          setIsScanning(false);
        });
      }

      return () => {
        if (html5QrCode && isScannerStarted) {
          html5QrCode.stop().catch(err => {
            // Only log if it's not the "not running" error which we're trying to avoid
            if (!err?.toString().includes("not running")) {
              console.error("Stop error:", err);
            }
          });
        }
      };
    }, [isScanning]);

    return (
      <div className="flex flex-col items-center justify-center gap-8 h-[calc(100vh-160px)] px-6">
        {scanError && (
          <div className="w-full bg-crimson/10 border border-crimson/20 p-4 rounded-2xl text-crimson text-sm flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="flex-1">{scanError}</p>
            <button onClick={() => setScanError(null)} className="p-1 hover:bg-crimson/10 rounded-full">
              <X size={16} />
            </button>
          </div>
        )}

        {isScanning ? (
          <div className="w-full max-w-sm">
            <div id="reader" className="overflow-hidden rounded-3xl border-2 border-medium-indigo dark:border-indigo-400 shadow-lg" />
            <button 
              onClick={() => setIsScanning(false)}
              className="mt-6 w-full py-4 bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2"
            >
              <X size={20} />
              Cancel Scanning
            </button>
          </div>
        ) : (
          <>
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 border-2 border-medium-indigo dark:border-indigo-400 rounded-3xl opacity-20" />
              <div className="absolute inset-4 border-2 border-dashed border-medium-indigo dark:border-indigo-400 rounded-2xl opacity-40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <QrCode size={120} className="text-medium-indigo dark:text-indigo-400 opacity-10" />
              </div>
              {/* Animated scanning line */}
              <motion.div 
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-4 right-4 h-0.5 bg-medium-indigo dark:bg-indigo-400 shadow-[0_0_10px_rgba(57,73,171,0.8)] z-10"
              />
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ready to Scan</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-[240px]">
                Align the barcode or QR code within the frame to automatically detect books or user IDs.
              </p>
            </div>

            <div className="flex gap-4 w-full">
              <button 
                onClick={() => setIsScanning(true)}
                className="flex-1 bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 p-4 rounded-2xl flex flex-col items-center gap-2 active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
              >
                <BookIcon size={24} className="text-medium-indigo dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Scan Book</span>
              </button>
              <button 
                onClick={() => setIsScanning(true)}
                className="flex-1 bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 p-4 rounded-2xl flex flex-col items-center gap-2 active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
              >
                <UsersIcon size={24} className="text-medium-indigo dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Scan User</span>
              </button>
            </div>

            <div className="w-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or Enter Manually</span>
                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
              </div>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input 
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="Enter ISBN or User ID"
                  className="flex-1 bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-medium-indigo/20 dark:text-white"
                />
                <button type="submit" className="p-3 bg-medium-indigo text-white rounded-xl active:scale-95 transition-transform">
                  <ChevronRight size={20} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    );
  };

  const MoreView = () => {
    const menuItems = [
      { icon: History, label: 'Transaction History', color: COLORS.mediumIndigo, action: () => setIsHistoryOpen(true) },
      { icon: FileText, label: 'Reports & Analytics', color: COLORS.emerald, action: () => setIsReportsOpen(true) },
      { icon: CreditCard, label: 'Fine Management', color: COLORS.amber, action: () => setActiveTab('users') },
      { icon: Settings, label: 'App Settings', color: COLORS.neutralGray, action: () => setIsSettingsOpen(true) },
    ];

    return (
      <div className="flex flex-col gap-6 pb-24 px-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage your library profile</p>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 rounded-2xl text-slate-600 dark:text-slate-400 active:scale-95 transition-all shadow-sm"
          >
            {darkMode ? <Sun size={20} className="text-amber" /> : <Moon size={20} className="text-medium-indigo" />}
          </button>
        </div>

        <div className="mobile-card p-6 flex flex-col items-center gap-3 bg-gradient-to-br from-deep-indigo to-medium-indigo text-white border-none">
          <div className="text-center">
            <h3 className="text-lg font-bold">Zack Moon</h3>
            <p className="text-xs text-white/70 font-medium uppercase tracking-widest">Library Administrator</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {menuItems.map((item, i) => (
            <button 
              key={i} 
              onClick={item.action}
              className="mobile-card p-4 flex items-center gap-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
            >
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <item.icon size={20} />
              </div>
              <span className="flex-1 text-left text-sm font-bold text-slate-700 dark:text-slate-200">{item.label}</span>
              <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
            </button>
          ))}
        </div>

        <button className="mobile-card p-4 flex items-center gap-4 text-crimson active:bg-crimson/5 transition-colors">
          <div className="p-2 rounded-xl bg-crimson/10">
            <LogOut size={20} />
          </div>
          <span className="flex-1 text-left text-sm font-bold">Logout Session</span>
        </button>

        <div className="text-center py-4">
          <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em]">{settings.libraryName} Mobile v1.0</p>
        </div>
      </div>
    );
  };

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'books': return <BooksView />;
      case 'users': return <UsersView />;
      case 'scan': return <ScanView />;
      case 'more': return <MoreView />;
      default: return <DashboardView />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return settings.libraryName;
      case 'books': return 'Book Catalog';
      case 'users': return 'User Directory';
      case 'scan': return 'Quick Scan';
      case 'more': return 'System Menu';
      default: return settings.libraryName;
    }
  };

  const Modal = ({ isOpen, onClose, title, children }: any) => (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[32px] z-[70] px-6 pt-4 pb-12 max-h-[90vh] overflow-y-auto no-scrollbar transition-colors duration-300"
          >
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
              <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400">
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-neutral-gray dark:bg-slate-950 font-sans select-none transition-colors duration-300">
      <Header title={getTitle()} />
      
      <main className="max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modals */}
      <Modal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        title="App Settings"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-medium-indigo/10 text-medium-indigo dark:text-indigo-400 rounded-xl">
                  {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Dark Mode</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Switch between light and dark themes</p>
                </div>
              </div>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={cn(
                  "w-14 h-7 rounded-full relative transition-all duration-500 ease-in-out p-1",
                  darkMode ? "bg-medium-indigo" : "bg-slate-200"
                )}
              >
                <div className={cn(
                  "w-5 h-5 bg-white rounded-full shadow-md transition-all duration-500 ease-in-out flex items-center justify-center",
                  darkMode ? "translate-x-7" : "translate-x-0"
                )}>
                  {darkMode ? <Moon size={10} className="text-medium-indigo" /> : <Sun size={10} className="text-amber" />}
                </div>
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase ml-1">Library Name</label>
              <input 
                value={settings.libraryName}
                onChange={(e) => setSettings({ ...settings, libraryName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white transition-all focus:ring-2 focus:ring-medium-indigo/20" 
                placeholder="Enter library name" 
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase ml-1">Currency Symbol</label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {['₹', '$', '€', '£', '¥', 'USD', 'INR'].map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setSettings({ ...settings, currency: curr })}
                    className={cn(
                      "px-4 py-2 rounded-xl border text-xs font-bold transition-all",
                      settings.currency === curr 
                        ? "bg-medium-indigo text-white border-medium-indigo" 
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-black/5 dark:border-white/5"
                    )}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase ml-1">Manage Categories</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(settings.categories || []).map((cat: string) => (
                  <div key={cat} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
                    <span className="text-xs font-medium dark:text-white">{cat}</span>
                    <button 
                      onClick={() => setSettings({ ...settings, categories: settings.categories.filter((c: string) => c !== cat) })}
                      className="text-slate-400 hover:text-crimson transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  id="new-category"
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none dark:text-white" 
                  placeholder="New category..." 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && !settings.categories.includes(val)) {
                        setSettings({ ...settings, categories: [...settings.categories, val] });
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('new-category') as HTMLInputElement;
                    const val = input.value.trim();
                    if (val && !settings.categories.includes(val)) {
                      setSettings({ ...settings, categories: [...settings.categories, val] });
                      input.value = '';
                    }
                  }}
                  className="bg-medium-indigo text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase ml-1">Fine Per Day ({settings.currency})</label>
                <input 
                  type="number"
                  value={settings.finePerDay}
                  onChange={(e) => setSettings({ ...settings, finePerDay: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white transition-all focus:ring-2 focus:ring-medium-indigo/20" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase ml-1">Loan Period (Days)</label>
                <input 
                  type="number"
                  value={settings.loanPeriod}
                  onChange={(e) => setSettings({ ...settings, loanPeriod: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white transition-all focus:ring-2 focus:ring-medium-indigo/20" 
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => {
                const defaults = {
                  libraryName: 'Ribath Library',
                  finePerDay: 5,
                  currency: '₹',
                  loanPeriod: 14,
                  categories: ['Fiction', 'Classic', 'Dystopian', 'Science']
                };
                setSettings(defaults);
                setDarkMode(false);
              }}
              className="flex-1 px-4 py-3 rounded-xl border border-black/5 dark:border-white/5 text-slate-500 dark:text-slate-400 text-sm font-bold active:scale-95 transition-transform"
            >
              Reset
            </button>
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="flex-[2] btn-primary"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isIssueModalOpen} 
        onClose={() => setIsIssueModalOpen(false)} 
        title="Issue Book"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Select Book</label>
            <select 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white"
              value={selectedBook?.id || ""}
              onChange={(e) => setSelectedBook(books.find(b => b.id === e.target.value) || null)}
            >
              <option value="">Choose a book...</option>
              {books.filter(b => b.status === 'Available').map(b => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Select User</label>
            <select 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white"
              value={selectedUser?.id || ""}
              onChange={(e) => setSelectedUser(users.find(u => u.id === e.target.value) || null)}
            >
              <option value="">Choose a user...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Issue Date</label>
            <input 
              type="date" 
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white"
            />
          </div>
          <button 
            disabled={!selectedBook || !selectedUser}
            onClick={() => {
              if (selectedBook && selectedUser) {
                handleIssueBook(selectedBook.id, selectedUser.id, issueDate);
                setIsIssueModalOpen(false);
                setSelectedBook(null);
                setSelectedUser(null);
                setIssueDate(format(new Date(), 'yyyy-MM-dd'));
              }
            }}
            className="btn-primary w-full mt-4 disabled:opacity-50"
          >
            Confirm Issue
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={isReturnModalOpen} 
        onClose={() => setIsReturnModalOpen(false)} 
        title="Return Book"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Select Book to Return</label>
            <select 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white"
              value={selectedBook?.id || ""}
              onChange={(e) => setSelectedBook(books.find(b => b.id === e.target.value) || null)}
            >
              <option value="">Choose a book...</option>
              {books.filter(b => b.status !== 'Available').map(b => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          </div>
          <button 
            disabled={!selectedBook}
            onClick={() => {
              if (selectedBook) {
                handleReturnBook(selectedBook.id);
                setIsReturnModalOpen(false);
                setSelectedBook(null);
              }
            }}
            className="btn-primary w-full mt-4 disabled:opacity-50"
          >
            Confirm Return
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        title="Transaction History"
      >
        <div className="flex flex-col gap-3">
          {transactions.map((tx) => {
            const book = books.find(b => b.id === tx.bookId);
            const user = users.find(u => u.id === tx.userId);
            return (
              <div key={tx.id} className="mobile-card p-4 flex items-center gap-4">
                <div className={cn(
                  "p-2 rounded-xl",
                  tx.type === 'Issue' ? "bg-emerald/10 text-emerald" : "bg-medium-indigo/10 text-medium-indigo"
                )}>
                  <ArrowRightLeft size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{book?.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.fullName} • {tx.type}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1">{format(parseISO(tx.date), 'MMM d, yyyy HH:mm')}</p>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    tx.status === 'Completed' ? "bg-emerald/10 text-emerald" : "bg-amber/10 text-amber"
                  )}>
                    {tx.status}
                  </span>
                </div>
              </div>
            );
          })}
          {transactions.length === 0 && (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>No transactions found</p>
            </div>
          )}
        </div>
      </Modal>

      <Modal 
        isOpen={isReportsOpen} 
        onClose={() => setIsReportsOpen(false)} 
        title="Reports & Analytics"
      >
        <div className="flex flex-col gap-6">
          <div className="mobile-card p-4 bg-medium-indigo text-white border-none">
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Monthly Circulation</p>
            <h3 className="text-3xl font-black">{reportData.monthlyCirculation.toLocaleString()}</h3>
            <div className="mt-4 h-24 min-h-[96px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="issues" stroke="#FFFFFF" fillOpacity={1} fill="url(#colorIssues)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="mobile-card p-4">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase mb-1">Total Users</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{reportData.activeUsers}</p>
            </div>
            <div className="mobile-card p-4">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase mb-1">Fine Collected</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{settings.currency}{reportData.fineCollected.toLocaleString()}</p>
            </div>
          </div>

          <div className="mobile-card p-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Top Borrowed Categories</h4>
            <div className="flex flex-col gap-3">
              {reportData.topCategories.length > 0 ? reportData.topCategories.map((item, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-400 text-center py-4">No data available</p>
              )}
            </div>
          </div>

          <button className="btn-primary w-full">
            <FileText size={20} />
            Export Monthly Report (PDF)
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={isBookDetailsOpen} 
        onClose={() => {
          setIsBookDetailsOpen(false);
          setIsEditingBook(false);
        }} 
        title={isEditingBook ? "Edit Book" : "Book Details"}
      >
        {selectedBook && (
          isEditingBook ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleEditBook({
                ...selectedBook,
                title: formData.get('title') as string,
                author: formData.get('author') as string,
                isbn: formData.get('isbn') as string,
                category: formData.get('category') as string,
                price: Number(formData.get('price'))
              });
            }} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Book Title</label>
                <input name="title" defaultValue={selectedBook.title} required className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Author</label>
                <input name="author" defaultValue={selectedBook.author} required className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">ISBN</label>
                <input name="isbn" defaultValue={selectedBook.isbn} required className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Price ({settings.currency})</label>
                <input name="price" type="number" defaultValue={selectedBook.price} required className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                <select name="category" defaultValue={selectedBook.category} required className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white">
                  {(settings.categories || []).map((cat: string) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setIsEditingBook(false)} className="flex-1 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Save Changes</button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedBook.title}</h3>
                    <button onClick={() => setIsEditingBook(true)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 active:scale-90 transition-transform">
                      <Edit size={18} />
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{selectedBook.author}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">{selectedBook.category}</span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      selectedBook.status === 'Available' ? "bg-emerald/10 text-emerald" : "bg-amber/10 text-amber"
                    )}>
                      {selectedBook.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">ISBN</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{selectedBook.isbn}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">ID</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{selectedBook.id}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Price</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{settings.currency}{selectedBook.price}</p>
                </div>
              </div>

              <div className="flex gap-3">
                {selectedBook.status === 'Available' ? (
                  <button 
                    onClick={() => {
                      setIsBookDetailsOpen(false);
                      setIsIssueModalOpen(true);
                    }}
                    className="btn-primary flex-1"
                  >
                    Issue This Book
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      handleReturnBook(selectedBook.id);
                      setIsBookDetailsOpen(false);
                    }}
                    className="btn-primary flex-1 bg-emerald"
                  >
                    Process Return
                  </button>
                )}
                <button 
                  onClick={() => handleDeleteBook(selectedBook.id)}
                  className="p-4 bg-crimson/10 text-crimson rounded-2xl active:scale-95 transition-transform"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          )
        )}
      </Modal>

      <Modal 
        isOpen={isUserDetailsOpen} 
        onClose={() => {
          setIsUserDetailsOpen(false);
          setIsEditingUser(false);
        }} 
        title={isEditingUser ? "Edit User" : "User Details"}
      >
        {selectedUser && (
          isEditingUser ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleEditUser({
                ...selectedUser,
                fullName: formData.get('fullName') as string,
                rollNumber: formData.get('rollNumber') as string,
                batch: formData.get('batch') as string,
              });
            }} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                <input name="fullName" defaultValue={selectedUser.fullName} required className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Roll Number</label>
                <input name="rollNumber" defaultValue={selectedUser.rollNumber} required className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Batch</label>
                <input name="batch" defaultValue={selectedUser.batch} required className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white" />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setIsEditingUser(false)} className="flex-1 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Save Changes</button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedUser.fullName}</h3>
                    <button onClick={() => setIsEditingUser(true)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 active:scale-90 transition-transform">
                      <Edit size={18} />
                    </button>
                  </div>
                  {selectedUser.email && <p className="text-sm text-slate-500 dark:text-slate-400">{selectedUser.email}</p>}
                  <div className="mt-2 flex gap-2">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      selectedUser.membershipStatus === 'Active' ? "bg-emerald/10 text-emerald" : "bg-crimson/10 text-crimson"
                    )}>
                      {selectedUser.membershipStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Roll Number</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{selectedUser.rollNumber}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Batch</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{selectedUser.batch}</p>
                </div>
                {selectedUser.phone && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{selectedUser.phone}</p>
                  </div>
                )}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Fines</p>
                  <p className="text-xs font-bold text-crimson">{settings.currency}{selectedUser.outstandingFines}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase ml-1">Library History</h4>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto no-scrollbar">
                  {transactions.filter(tx => tx.userId === selectedUser.id).length > 0 ? (
                    transactions
                      .filter(tx => tx.userId === selectedUser.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((tx) => {
                        const book = books.find(b => b.id === tx.bookId);
                        return (
                          <div key={tx.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-3">
                            <div className={cn(
                              "p-1.5 rounded-lg",
                              tx.type === 'Issue' ? "bg-emerald/10 text-emerald" : "bg-medium-indigo/10 text-medium-indigo"
                            )}>
                              <ArrowRightLeft size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{book?.title || 'Unknown Book'}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-400">{tx.type} • {format(parseISO(tx.date), 'MMM d, yyyy')}</p>
                            </div>
                            <div className="text-right">
                              <span className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                                tx.status === 'Completed' ? "bg-emerald/10 text-emerald" : "bg-amber/10 text-amber"
                              )}>
                                {tx.status}
                              </span>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="py-6 text-center text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <p className="text-[10px] font-medium">No transaction history</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {selectedUser.outstandingFines > 0 && (
                  <button 
                    onClick={() => {
                      setIsUserDetailsOpen(false);
                      setIsFineModalOpen(true);
                    }}
                    className="btn-primary flex-1 bg-amber"
                  >
                    Pay Fines
                  </button>
                )}
                <button 
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  className="p-4 bg-crimson/10 text-crimson rounded-2xl active:scale-95 transition-transform"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          )
        )}
      </Modal>

      <Modal 
        isOpen={isFineModalOpen} 
        onClose={() => setIsFineModalOpen(false)} 
        title="Fine Payment"
      >
        {selectedUser && (
          <div className="flex flex-col gap-6">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-amber/10 text-amber rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Outstanding Fines</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{selectedUser.fullName}</p>
              <p className="text-4xl font-black text-slate-900 dark:text-white mt-4">{settings.currency}{selectedUser.outstandingFines}</p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  setUsers(users.map(u => u.id === selectedUser.id ? { ...u, outstandingFines: 0 } : u));
                  setIsFineModalOpen(false);
                }}
                className="btn-primary w-full"
              >
                Pay Full Amount
              </button>
              <button 
                onClick={() => setIsFineModalOpen(false)}
                className="w-full py-4 text-sm font-bold text-slate-500 dark:text-slate-400"
              >
                Pay Later
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal 
        isOpen={isDeleteConfirmOpen} 
        onClose={() => setIsDeleteConfirmOpen(false)} 
        title="Confirm Delete"
      >
        <div className="flex flex-col gap-6 text-center">
          <div className="w-16 h-16 bg-crimson/10 text-crimson rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Are you sure?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              This action cannot be undone. This will permanently delete the {deleteTarget?.type}.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="flex-1 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              className="flex-1 py-4 text-sm font-bold text-white bg-crimson rounded-2xl"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isAddBookModalOpen} 
        onClose={() => setIsAddBookModalOpen(false)} 
        title="Add New Book"
      >
        <form onSubmit={(e) => {
          try {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const title = formData.get('title') as string;
            const author = formData.get('author') as string;
            const isbn = formData.get('isbn') as string;
            const category = formData.get('category') as string;
            const price = Number(formData.get('price'));

            if (!title || !author || !isbn || !category) return;

            const newBook: Book = {
              id: `B${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
              title,
              author,
              isbn,
              category,
              price,
              status: 'Available',
              coverImage: `https://picsum.photos/seed/${encodeURIComponent(title)}/200/300`
            };
            
            setBooks(prev => [newBook, ...prev]);
            setIsAddBookModalOpen(false);
            e.currentTarget.reset();
          } catch (error) {
            console.error("Add book error:", error);
            alert("Failed to add book. Please try again.");
          }
        }} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Book Title</label>
            <input name="title" required className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white" placeholder="Enter title" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Author</label>
            <input name="author" required className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white" placeholder="Enter author name" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">ISBN</label>
            <input name="isbn" required className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white" placeholder="Enter ISBN" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Price ({settings.currency})</label>
            <input name="price" type="number" required className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white" placeholder="Enter price" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
            <select name="category" required className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white">
              {(settings.categories || []).map((cat: string) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full mt-4">Add Book</button>
        </form>
      </Modal>

      <Modal 
        isOpen={isAddUserModalOpen} 
        onClose={() => setIsAddUserModalOpen(false)} 
        title="Register New User"
      >
        <form onSubmit={(e) => {
          try {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const fullName = formData.get('fullName') as string;
            const rollNumber = formData.get('rollNumber') as string;
            const batch = formData.get('batch') as string;

            if (!fullName || !rollNumber || !batch) return;

            const newUser: User = {
              id: `U${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
              fullName,
              rollNumber,
              batch,
              profilePhoto: `https://i.pravatar.cc/150?u=${encodeURIComponent(fullName)}`,
              membershipStatus: 'Active',
              expiryDate: format(addDays(new Date(), 365), 'yyyy-MM-dd'),
              outstandingFines: 0
            };
            
            setUsers(prev => [newUser, ...prev]);
            setIsAddUserModalOpen(false);
            
            // Reset form
            e.currentTarget.reset();
          } catch (error) {
            console.error("Registration error:", error);
            alert("Failed to register user. Please try again.");
          }
        }} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
            <input name="fullName" required className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white" placeholder="Enter full name" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Roll Number</label>
            <input name="rollNumber" required className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white" placeholder="Enter roll number" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Batch</label>
            <input name="batch" required className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/5 rounded-xl p-4 text-sm focus:outline-none dark:text-white" placeholder="Enter batch (e.g. 2024-2028)" />
          </div>
          <button type="submit" className="btn-primary w-full mt-4">Register User</button>
        </form>
      </Modal>
    </div>
  );
}
