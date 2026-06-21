import { useEffect, useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate, getSiteTypeName, getBookingStatusName, getTodayDateString, getTomorrowDateString, getDaysBetween, getRateTypeName } from '../lib/format';
import Modal from '../components/Modal';
import { Plus, X, Calendar as CalendarIcon, User, Phone, Zap, Droplets, Wrench, AlertTriangle, ChevronLeft, ChevronRight, Trash2, CheckCircle2 } from 'lucide-react';
import type { CreateBookingRequest, Site, Booking, CalculationResult } from '../../shared/types';

export default function Bookings() {
  const { sites, bookings, fetchSites, fetchBookings, createBooking, cancelBooking, checkConflict, calculateFee } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [conflictResult, setConflictResult] = useState<{ hasConflict: boolean; conflictingBookings: Booking[] } | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [formData, setFormData] = useState<CreateBookingRequest>({
    siteId: '',
    customerName: '',
    customerPhone: '',
    checkIn: getTodayDateString(),
    checkOut: getTomorrowDateString(),
    hasElectricity: true,
    hasWater: true,
    hasSewer: true,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchSites(), fetchBookings()]);
      setLoading(false);
    };
    load();
  }, [fetchSites, fetchBookings]);

  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day + (day === 0 ? -6 : 1));
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentDate]);

  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const openBookingModal = (site: Site, date?: string) => {
    setSelectedSite(site);
    setFormData({
      siteId: site.id,
      customerName: '',
      customerPhone: '',
      checkIn: date || getTodayDateString(),
      checkOut: date ? new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0] : getTomorrowDateString(),
      hasElectricity: site.hasElectricity,
      hasWater: site.hasWater,
      hasSewer: site.hasSewer,
    });
    setCalculation(null);
    setConflictResult(null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isModalOpen && formData.siteId && formData.checkIn && formData.checkOut) {
      const check = async () => {
        setCheckingConflict(true);
        const [conflict, calc] = await Promise.all([
          checkConflict(formData.siteId, formData.checkIn, formData.checkOut),
          calculateFee({
            checkIn: formData.checkIn,
            checkOut: formData.checkOut,
            siteType: selectedSite?.type || 'standard',
            hasElectricity: formData.hasElectricity,
            hasWater: formData.hasWater,
            hasSewer: formData.hasSewer,
          }),
        ]);
        setConflictResult(conflict);
        setCalculation(calc);
        setCheckingConflict(false);
      };
      check();
    }
  }, [isModalOpen, formData.siteId, formData.checkIn, formData.checkOut, formData.hasElectricity, formData.hasWater, formData.hasSewer, selectedSite?.type, checkConflict, calculateFee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (conflictResult?.hasConflict) {
      return;
    }
    
    const result = await createBooking(formData);
    if (result) {
      setIsModalOpen(false);
    }
  };

  const handleCancel = async (booking: Booking) => {
    if (window.confirm(`确定要取消「${booking.customerName}」的预订吗？取消后时段将被释放。`)) {
      await cancelBooking(booking.id);
    }
  };

  const getSiteBookingsForDate = (siteId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => 
      b.siteId === siteId && 
      b.status !== 'cancelled' &&
      b.checkIn <= dateStr && 
      b.checkOut > dateStr
    );
  };

  const getBookingColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-500';
      case 'checked-in': return 'bg-green-500';
      case 'checked-out': return 'bg-zinc-400';
      default: return 'bg-zinc-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
            预订管理
          </h1>
          <p className="text-zinc-500 mt-1">管理营位预订、排期和冲突检测</p>
        </div>
        <button
          onClick={() => {
            setSelectedSite(null);
            setFormData({
              siteId: sites[0]?.id || '',
              customerName: '',
              customerPhone: '',
              checkIn: getTodayDateString(),
              checkOut: getTomorrowDateString(),
              hasElectricity: true,
              hasWater: true,
              hasSewer: true,
            });
            setCalculation(null);
            setConflictResult(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          新建预订
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={navigatePrev}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white min-w-[200px] text-center">
              {viewMode === 'week' 
                ? `${formatDate(weekDates[0].toISOString())} - ${formatDate(weekDates[6].toISOString())}`
                : `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`
              }
            </h2>
            <button
              onClick={navigateNext}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                周视图
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                月视图
              </button>
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="btn btn-secondary text-sm py-1.5"
            >
              今天
            </button>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white dark:bg-zinc-900 p-3 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 min-w-[140px]">
                  营位
                </th>
                {weekDates.map((date) => {
                  const isToday = date.toISOString().split('T')[0] === getTodayDateString();
                  return (
                    <th
                      key={date.toISOString()}
                      className={`p-3 text-center text-sm font-medium border-b border-zinc-200 dark:border-zinc-800 min-w-[120px] ${
                        isToday ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                      }`}
                    >
                      <div className={`text-xs ${
                        isToday ? 'text-primary-600 dark:text-primary-400 font-semibold' : 'text-zinc-500'
                      }`}>
                        {['日', '一', '二', '三', '四', '五', '六'][date.getDay()]}
                      </div>
                      <div className={`text-lg font-semibold ${
                        isToday ? 'text-primary-700 dark:text-primary-300' : 'text-zinc-900 dark:text-white'
                      }`}>
                        {date.getDate()}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr key={site.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="sticky left-0 bg-white dark:bg-zinc-900 p-3 border-b border-zinc-200 dark:border-zinc-800">
                    <div
                      className="cursor-pointer group"
                      onClick={() => openBookingModal(site)}
                    >
                      <div className="font-medium text-zinc-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {site.code} - {site.name}
                      </div>
                      <div className="text-xs text-zinc-500">{getSiteTypeName(site.type)}</div>
                      <div className="flex gap-1 mt-1">
                        {site.hasElectricity && <span className="text-xs">⚡</span>}
                        {site.hasWater && <span className="text-xs">💧</span>}
                        {site.hasSewer && <span className="text-xs">🚽</span>}
                      </div>
                    </div>
                  </td>
                  {weekDates.map((date) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const dayBookings = getSiteBookingsForDate(site.id, date);
                    const isToday = dateStr === getTodayDateString();
                    
                    return (
                      <td
                        key={date.toISOString()}
                        className={`p-1 border-b border-zinc-200 dark:border-zinc-800 ${
                          isToday ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                        }`}
                      >
                        <div
                          className="min-h-[60px] p-1.5 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          onClick={() => openBookingModal(site, dateStr)}
                        >
                          {dayBookings.length > 0 ? (
                            <div className="space-y-1">
                              {dayBookings.map((booking) => {
                                const isStart = booking.checkIn === dateStr;
                                const isEnd = booking.checkOut === dateStr;
                                return (
                                  <div
                                    key={booking.id}
                                    className={`text-xs p-1.5 rounded-md text-white truncate ${getBookingColor(booking.status)} ${
                                      isStart ? 'rounded-l-lg' : ''
                                    } ${isEnd ? 'rounded-r-lg' : ''}`}
                                    title={`${booking.customerName} - ${formatDate(booking.checkIn)} 至 ${formatDate(booking.checkOut)}`}
                                  >
                                    {booking.customerName}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700 group-hover:text-primary-400 transition-colors">
                              <Plus className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">已确认</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">已入住</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-zinc-400"></span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">已退房</span>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          最近预订
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left p-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">客户</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">营位</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">入住</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">退房</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">金额</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">状态</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 10).map((booking) => {
                const site = sites.find(s => s.id === booking.siteId);
                return (
                  <tr key={booking.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="p-3">
                      <div className="font-medium text-zinc-900 dark:text-white">{booking.customerName}</div>
                      <div className="text-xs text-zinc-500">{booking.customerPhone}</div>
                    </td>
                    <td className="p-3 text-zinc-600 dark:text-zinc-400">
                      {site?.name || '未知'}
                    </td>
                    <td className="p-3 text-zinc-600 dark:text-zinc-400">{formatDate(booking.checkIn)}</td>
                    <td className="p-3 text-zinc-600 dark:text-zinc-400">{formatDate(booking.checkOut)}</td>
                    <td className="p-3 font-medium text-zinc-900 dark:text-white">
                      {formatCurrency(booking.totalAmount)}
                    </td>
                    <td className="p-3">
                      <span className={`badge ${
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        booking.status === 'checked-in' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}>
                        {getBookingStatusName(booking.status)}
                      </span>
                    </td>
                    <td className="p-3">
                      {booking.status !== 'cancelled' && booking.status !== 'checked-out' && (
                        <button
                          onClick={() => handleCancel(booking)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-500 hover:text-red-600 transition-colors"
                          title="取消预订"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="新建预订"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                营位
              </label>
              <select
                className="input"
                value={formData.siteId}
                onChange={(e) => {
                  const site = sites.find(s => s.id === e.target.value);
                  setFormData({
                    ...formData,
                    siteId: e.target.value,
                    hasElectricity: site?.hasElectricity ?? true,
                    hasWater: site?.hasWater ?? true,
                    hasSewer: site?.hasSewer ?? true,
                  });
                  setSelectedSite(site || null);
                }}
                required
              >
                <option value="">请选择营位</option>
                {sites.filter(s => s.status === 'available').map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.code} - {site.name} ({getSiteTypeName(site.type)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                入住天数
              </label>
              <div className="input bg-zinc-50 dark:bg-zinc-800/50 border-dashed">
                {formData.checkIn && formData.checkOut
                  ? `${getDaysBetween(formData.checkIn, formData.checkOut)} 天`
                  : '请选择日期'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                入住日期
              </label>
              <input
                type="date"
                className="input"
                value={formData.checkIn}
                min={getTodayDateString()}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                退房日期
              </label>
              <input
                type="date"
                className="input"
                value={formData.checkOut}
                min={formData.checkIn || getTodayDateString()}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                客户姓名
              </label>
              <input
                type="text"
                className="input"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="请输入客户姓名"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                联系电话
              </label>
              <input
                type="tel"
                className="input"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="请输入联系电话"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              接驳服务
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasElectricity}
                  onChange={(e) => setFormData({ ...formData, hasElectricity: e.target.checked })}
                  disabled={selectedSite && !selectedSite.hasElectricity}
                  className="w-4 h-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
                />
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">电力</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasWater}
                  onChange={(e) => setFormData({ ...formData, hasWater: e.target.checked })}
                  disabled={selectedSite && !selectedSite.hasWater}
                  className="w-4 h-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
                />
                <Droplets className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">供水</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasSewer}
                  onChange={(e) => setFormData({ ...formData, hasSewer: e.target.checked })}
                  disabled={selectedSite && !selectedSite.hasSewer}
                  className="w-4 h-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
                />
                <Wrench className="w-4 h-4 text-green-500" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">排污</span>
              </label>
            </div>
          </div>

          {checkingConflict && (
            <div className="flex items-center justify-center gap-2 text-zinc-500 py-4">
              <div className="animate-spin w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full"></div>
              <span>正在检测时段冲突...</span>
            </div>
          )}

          {conflictResult && conflictResult.hasConflict && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-shake">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-400">时段冲突</p>
                  <p className="text-sm text-red-700 dark:text-red-500 mt-1">
                    该营位在所选时段已被预订：
                  </p>
                  <div className="mt-2 space-y-1">
                    {conflictResult.conflictingBookings.map((b) => (
                      <div key={b.id} className="text-sm text-red-700 dark:text-red-500">
                        • {b.customerName} - {formatDate(b.checkIn)} 至 {formatDate(b.checkOut)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {calculation && !conflictResult?.hasConflict && (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-400">时段可用</p>
                  <p className="text-sm text-green-700 dark:text-green-500">
                    该时段可以预订，费用明细如下：
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                {calculation.segments.map((seg, idx) => (
                  <div key={idx} className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>
                      {getRateTypeName(seg.rate.type)} - {formatDate(seg.startDate)} 至 {formatDate(seg.endDate)} ({seg.days}天)
                    </span>
                    <span>{formatCurrency(seg.rate.pricePerDay * seg.days)}</span>
                  </div>
                ))}
                
                {calculation.electricityFee > 0 && (
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>电力接驳费 ({calculation.totalDays}天)</span>
                    <span>{formatCurrency(calculation.electricityFee)}</span>
                  </div>
                )}
                {calculation.waterFee > 0 && (
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>供水接驳费 ({calculation.totalDays}天)</span>
                    <span>{formatCurrency(calculation.waterFee)}</span>
                  </div>
                )}
                {calculation.sewerFee > 0 && (
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>排污接驳费 ({calculation.totalDays}天)</span>
                    <span>{formatCurrency(calculation.sewerFee)}</span>
                  </div>
                )}
                
                <div className="pt-2 mt-2 border-t border-green-200 dark:border-green-800 flex justify-between font-semibold text-lg text-green-800 dark:text-green-400">
                  <span>合计</span>
                  <span>{formatCurrency(calculation.total)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={checkingConflict || conflictResult?.hasConflict || !formData.siteId}
            >
              确认预订
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
