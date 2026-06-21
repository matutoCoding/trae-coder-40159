import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate, formatDateTime, getBillStatusName, getBillItemTypeName } from '../lib/format';
import Modal from '../components/Modal';
import { Eye, CreditCard, RefreshCcw, FileText, Search, Filter, ChevronDown, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { Bill, BillItem } from '../../shared/types';

type BillWithDetails = Bill & { customerName: string; siteName: string };

export default function Bills() {
  const { bills, fetchBills, payBill, refundBill } = useStore();
  const billsWithDetails = bills as BillWithDetails[];
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<(Bill & { customerName: string; siteName: string; items: BillItem[] }) | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchBills();
      setLoading(false);
    };
    load();
  }, [fetchBills]);

  const handleViewDetail = async (bill: Bill & { customerName: string; siteName: string }) => {
    try {
      const response = await fetch(`/api/bills/${bill.id}`);
      const detail = await response.json();
      setSelectedBill(detail);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('获取账单详情失败:', error);
    }
  };

  const handlePay = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要标记该账单为已支付吗？')) {
      await payBill(id);
      if (selectedBill?.id === id) {
        setSelectedBill({ ...selectedBill, status: 'paid' });
      }
    }
  };

  const handleRefund = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要对该账单执行退款吗？')) {
      await refundBill(id);
      if (selectedBill?.id === id) {
        setSelectedBill({ ...selectedBill, status: 'refunded' });
      }
    }
  };

  const filteredBills = billsWithDetails.filter(bill => {
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    const matchesSearch = !searchQuery || 
      bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return CheckCircle;
      case 'refunded': return XCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'refunded': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default: return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
    }
  };

  const stats = {
    total: billsWithDetails.length,
    pending: billsWithDetails.filter(b => b.status === 'pending').length,
    paid: billsWithDetails.filter(b => b.status === 'paid').length,
    refunded: billsWithDetails.filter(b => b.status === 'refunded').length,
    totalAmount: billsWithDetails.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.total, 0),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
            账单管理
          </h1>
          <p className="text-zinc-500 mt-1">管理所有预订账单，支持查看、支付和退款操作</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">总账单</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">待支付</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">已支付</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.paid}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">已收金额</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            className="input pl-10"
            placeholder="搜索账单号或客户姓名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {statusFilter === 'all' ? '全部状态' : getBillStatusName(statusFilter)}
            <ChevronDown className="w-4 h-4" />
          </button>
          {showFilterDropdown && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 z-10 animate-fade-in">
              {['all', 'pending', 'paid', 'refunded'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    statusFilter === status ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {status === 'all' ? '全部状态' : getBillStatusName(status)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">账单号</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">客户</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">营位</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">金额</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">状态</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">创建时间</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredBills.map((bill, index) => {
                const StatusIcon = getStatusIcon(bill.status);
                return (
                  <tr key={bill.id} className="animate-fade-in-up hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer" style={{ animationDelay: `${index * 30}ms` }} onClick={() => handleViewDetail(bill)}>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-zinc-900 dark:text-white">{bill.billNumber}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-zinc-900 dark:text-white">{bill.customerName}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {bill.siteName}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-semibold text-primary-600 dark:text-primary-400">{formatCurrency(bill.total)}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                        <StatusIcon className="w-3 h-3" />
                        {getBillStatusName(bill.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {formatDateTime(bill.createdAt)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleViewDetail(bill)}
                          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-blue-600 transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {bill.status === 'pending' && (
                          <button
                            onClick={(e) => handlePay(bill.id, e)}
                            className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-zinc-500 hover:text-green-600 transition-colors"
                            title="标记已支付"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        {bill.status === 'paid' && (
                          <button
                            onClick={(e) => handleRefund(bill.id, e)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-500 hover:text-red-600 transition-colors"
                            title="退款"
                          >
                            <RefreshCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredBills.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">暂无账单记录</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="账单详情"
        size="lg"
      >
        {selectedBill && (
          <div className="space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
                  {selectedBill.billNumber}
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  客户：{selectedBill.customerName} | 营位：{selectedBill.siteName}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(selectedBill.status)}`}>
                {selectedBill.status === 'paid' && <CheckCircle className="w-4 h-4" />}
                {selectedBill.status === 'refunded' && <XCircle className="w-4 h-4" />}
                {selectedBill.status === 'pending' && <Clock className="w-4 h-4" />}
                {getBillStatusName(selectedBill.status)}
              </span>
            </div>

            <div>
              <h4 className="font-medium text-zinc-900 dark:text-white mb-3">费用明细</h4>
              <div className="space-y-2">
                {selectedBill.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">{item.description}</p>
                      <p className="text-xs text-zinc-500">
                        {getBillItemTypeName(item.type)} × {item.quantity} × {formatCurrency(item.unitPrice)}
                        {item.period && ` (${item.period})`}
                      </p>
                    </div>
                    <span className="font-semibold text-zinc-900 dark:text-white">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary-50 to-amber-50 dark:from-primary-900/20 dark:to-amber-900/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-600 dark:text-zinc-400">小计</span>
                <span className="text-zinc-900 dark:text-white">{formatCurrency(selectedBill.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-primary-200 dark:border-primary-800">
                <span className="font-semibold text-zinc-900 dark:text-white">应付总额</span>
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(selectedBill.total)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-zinc-500 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <span>创建时间：{formatDateTime(selectedBill.createdAt)}</span>
              {selectedBill.paidAt && <span>支付时间：{formatDateTime(selectedBill.paidAt)}</span>}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="btn btn-secondary"
              >
                关闭
              </button>
              {selectedBill.status === 'pending' && (
                <button
                  onClick={() => handlePay(selectedBill.id, {} as React.MouseEvent)}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  标记已支付
                </button>
              )}
              {selectedBill.status === 'paid' && (
                <button
                  onClick={() => handleRefund(selectedBill.id, {} as React.MouseEvent)}
                  className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                >
                  <RefreshCcw className="w-4 h-4" />
                  退款
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
