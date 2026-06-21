import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate, getSiteTypeName, getBookingStatusName } from '../lib/format';
import { ArrowUpRight, ArrowDownRight, Users, BedDouble, DollarSign, Calendar, MapPin, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function Dashboard() {
  const { dashboardStats, fetchDashboardStats, fetchBookings, bookings, sites } = useStore();
  const [timeline, setTimeline] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchBookings(),
        useStore.getState().fetchSites(),
      ]);
      
      const today = new Date().toISOString().split('T')[0];
      const todayBookings = bookings.filter(b => 
        (b.checkIn === today || b.checkOut === today) && 
        b.status !== 'cancelled'
      ).map(b => ({
        ...b,
        eventType: b.checkIn === today ? 'check-in' : 'check-out' as 'check-in' | 'check-out',
      })).sort((a, b) => {
        if (a.eventType === 'check-in' && b.eventType === 'check-out') return -1;
        if (a.eventType === 'check-out' && b.eventType === 'check-in') return 1;
        return a.checkIn.localeCompare(b.checkIn);
      });
      setTimeline(todayBookings);

      const weekLater = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      const upcomingBookings = bookings.filter(b => 
        b.checkIn >= today && b.checkIn <= weekLater && b.status !== 'cancelled'
      ).sort((a, b) => a.checkIn.localeCompare(b.checkIn));
      setUpcoming(upcomingBookings);
      
      setLoading(false);
    };
    loadData();
  }, [fetchDashboardStats, fetchBookings, bookings]);

  const stats = [
    {
      label: '今日入住',
      value: dashboardStats?.todayCheckIns || 0,
      icon: ArrowUpRight,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: '今日退房',
      value: dashboardStats?.todayCheckOuts || 0,
      icon: ArrowDownRight,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      label: '已占用营位',
      value: `${dashboardStats?.occupiedSites || 0}/${dashboardStats?.totalSites || 0}`,
      icon: BedDouble,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: '入住率',
      value: `${dashboardStats?.occupancyRate || 0}%`,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: '今日营收',
      value: formatCurrency(dashboardStats?.todayRevenue || 0),
      icon: DollarSign,
      color: 'text-primary-600',
      bg: 'bg-primary-50 dark:bg-primary-900/20',
    },
    {
      label: '本月营收',
      value: formatCurrency(dashboardStats?.monthRevenue || 0),
      icon: DollarSign,
      color: 'text-accent-600',
      bg: 'bg-accent-50 dark:bg-accent-900/20',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
          仪表盘
        </h1>
        <p className="text-zinc-500 mt-1">欢迎回来，今天是 {formatDate(new Date().toISOString())}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="card p-5 animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-zinc-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
              <Clock className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
              今日日程
            </h2>
          </div>
          
          {timeline.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">今日暂无入住或退房安排</p>
          ) : (
            <div className="space-y-3">
              {timeline.map((item, index) => {
                const site = sites.find(s => s.id === item.siteId);
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
                  >
                    <div className={`mt-1 p-1.5 rounded-lg ${
                      item.eventType === 'check-in' 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {item.eventType === 'check-in' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-zinc-900 dark:text-white truncate">
                          {item.customerName}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          item.eventType === 'check-in'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          {item.eventType === 'check-in' ? '入住' : '退房'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{site?.name || '未知营位'}</span>
                        <span className="text-zinc-300 dark:text-zinc-700">|</span>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(item.checkIn)} - {formatDate(item.checkOut)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-accent-50 dark:bg-accent-900/20">
              <Calendar className="w-5 h-5 text-accent-600" />
            </div>
            <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
              未来7天预订
            </h2>
          </div>
          
          {upcoming.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">未来7天暂无预订</p>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 5).map((booking) => {
                const site = sites.find(s => s.id === booking.siteId);
                return (
                  <div
                    key={booking.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center">
                      <span className="font-bold text-primary-700 dark:text-primary-400">
                        {site?.code || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 dark:text-white truncate">
                        {booking.customerName}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <span>{formatDate(booking.checkIn)}</span>
                        <span className="text-zinc-300 dark:text-zinc-700">→</span>
                        <span>{formatDate(booking.checkOut)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        {formatCurrency(booking.totalAmount)}
                      </p>
                      <span className={`text-xs ${
                        booking.status === 'confirmed'
                          ? 'text-blue-600 dark:text-blue-400'
                          : booking.status === 'checked-in'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-zinc-500'
                      }`}>
                        {getBookingStatusName(booking.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card p-6 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
        <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          营位概览
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {sites.map((site, index) => {
            const isOccupied = bookings.some(b => 
              b.siteId === site.id && 
              b.status !== 'cancelled' && 
              b.status !== 'checked-out' &&
              new Date(b.checkIn) <= new Date() && 
              new Date(b.checkOut) > new Date()
            );
            
            return (
              <div
                key={site.id}
                className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                  isOccupied
                    ? 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10'
                    : site.status === 'available'
                    ? 'border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10'
                    : 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800'
                }`}
                style={{ animationDelay: `${600 + index * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-zinc-900 dark:text-white">{site.code}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    isOccupied ? 'bg-red-500' : site.status === 'available' ? 'bg-green-500' : 'bg-zinc-400'
                  }`}></span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{getSiteTypeName(site.type)}</p>
                <div className="flex gap-1 mt-2">
                  {site.hasElectricity && <span className="text-xs">⚡</span>}
                  {site.hasWater && <span className="text-xs">💧</span>}
                  {site.hasSewer && <span className="text-xs">🚽</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
