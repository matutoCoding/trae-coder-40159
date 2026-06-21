import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate, getRateTypeName, getSiteTypeName } from '../lib/format';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, Calendar, Zap, Droplets, Wrench, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { CreateRateRequest, RateType, SiteType } from '../../shared/types';

const rateTypes: { value: RateType; label: string; icon: typeof TrendingUp; color: string }[] = [
  { value: 'peak', label: '旺季', icon: TrendingUp, color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'normal', label: '平季', icon: Minus, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'off-peak', label: '淡季', icon: TrendingDown, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
];

const siteTypes: { value: SiteType; label: string }[] = [
  { value: 'standard', label: '标准营位' },
  { value: 'premium', label: '高级营位' },
  { value: 'vip', label: 'VIP营位' },
];

export default function Rates() {
  const { rates, fetchRates, createRate, updateRate, deleteRate } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<{ id: string; data: CreateRateRequest } | null>(null);
  const [formData, setFormData] = useState<CreateRateRequest>({
    name: '',
    type: 'normal',
    siteType: 'standard',
    pricePerDay: 200,
    startDate: '',
    endDate: '',
    priority: 5,
    electricityRate: 20,
    waterRate: 15,
    sewerRate: 10,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchRates();
      setLoading(false);
    };
    load();
  }, [fetchRates]);

  const openModal = (rate?: { id: string; data: CreateRateRequest }) => {
    if (rate) {
      setEditingRate(rate);
      setFormData(rate.data);
    } else {
      setEditingRate(null);
      const today = new Date();
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + 3);
      setFormData({
        name: '',
        type: 'normal',
        siteType: 'standard',
        pricePerDay: 200,
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        priority: 5,
        electricityRate: 20,
        waterRate: 15,
        sewerRate: 10,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let success;
    
    if (editingRate) {
      success = await updateRate(editingRate.id, formData);
    } else {
      success = await createRate(formData);
    }
    
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`确定要删除费率「${name}」吗？`)) {
      await deleteRate(id);
    }
  };

  const getRateTypeInfo = (type: string) => {
    return rateTypes.find(t => t.value === type) || rateTypes[1];
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
            费率管理
          </h1>
          <p className="text-zinc-500 mt-1">管理旺季、平季、淡季的费率配置和接驳费用</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          新增费率
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rateTypes.map((type) => {
          const typeRates = rates.filter(r => r.type === type.value);
          const Icon = type.icon;
          return (
            <div key={type.value} className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white">{type.label}</h3>
                  <p className="text-sm text-zinc-500">{typeRates.length} 条费率</p>
                </div>
              </div>
              {typeRates.length > 0 && (
                <div className="space-y-2">
                  {typeRates.slice(0, 3).map(rate => (
                    <div key={rate.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                      <span className="text-zinc-600 dark:text-zinc-400">{getSiteTypeName(rate.siteType)}</span>
                      <span className="font-semibold text-primary-600 dark:text-primary-400">{formatCurrency(rate.pricePerDay)}/天</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-white">所有费率配置</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">费率名称</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">类型</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">适用营位</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">日租金</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">有效期</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">接驳费用</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">优先级</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {rates.map((rate, index) => {
                const typeInfo = getRateTypeInfo(rate.type);
                const TypeIcon = typeInfo.icon;
                return (
                  <tr key={rate.id} className="animate-fade-in-up hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors" style={{ animationDelay: `${index * 30}ms` }}>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-medium text-zinc-900 dark:text-white">{rate.name}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        <TypeIcon className="w-3 h-3" />
                        {getRateTypeName(rate.type)}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {getSiteTypeName(rate.siteType)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-semibold text-primary-600 dark:text-primary-400">{formatCurrency(rate.pricePerDay)}</span>
                      <span className="text-sm text-zinc-500">/天</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(rate.startDate)} ~ {formatDate(rate.endDate)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                          <Zap className="w-3.5 h-3.5" />
                          <span>{formatCurrency(rate.electricityRate)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <Droplets className="w-3.5 h-3.5" />
                          <span>{formatCurrency(rate.waterRate)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <Wrench className="w-3.5 h-3.5" />
                          <span>{formatCurrency(rate.sewerRate)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rate.priority >= 8 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        rate.priority >= 5 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {rate.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal({
                            id: rate.id,
                            data: {
                              name: rate.name,
                              type: rate.type,
                              siteType: rate.siteType,
                              pricePerDay: rate.pricePerDay,
                              startDate: rate.startDate,
                              endDate: rate.endDate,
                              priority: rate.priority,
                              electricityRate: rate.electricityRate,
                              waterRate: rate.waterRate,
                              sewerRate: rate.sewerRate,
                            },
                          })}
                          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rate.id, rate.name)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
        title={editingRate ? '编辑费率' : '新增费率'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                费率名称
              </label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：2024年夏季旺季"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                优先级
              </label>
              <input
                type="number"
                className="input"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                min="1"
                max="10"
                required
              />
              <p className="text-xs text-zinc-500 mt-1">1-10，数字越大优先级越高</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                费率类型
              </label>
              <select
                className="input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as RateType })}
              >
                {rateTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                适用营位类型
              </label>
              <select
                className="input"
                value={formData.siteType}
                onChange={(e) => setFormData({ ...formData, siteType: e.target.value as SiteType })}
              >
                {siteTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              日租金（元/天）
            </label>
            <input
              type="number"
              className="input"
              value={formData.pricePerDay}
              onChange={(e) => setFormData({ ...formData, pricePerDay: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                开始日期
              </label>
              <input
                type="date"
                className="input"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                结束日期
              </label>
              <input
                type="date"
                className="input"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              接驳服务费用（元/天）
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  电力接驳
                </label>
                <input
                  type="number"
                  className="input"
                  value={formData.electricityRate}
                  onChange={(e) => setFormData({ ...formData, electricityRate: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  供水接驳
                </label>
                <input
                  type="number"
                  className="input"
                  value={formData.waterRate}
                  onChange={(e) => setFormData({ ...formData, waterRate: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  <Wrench className="w-4 h-4 text-green-600" />
                  排污接驳
                </label>
                <input
                  type="number"
                  className="input"
                  value={formData.sewerRate}
                  onChange={(e) => setFormData({ ...formData, sewerRate: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
            >
              {editingRate ? '保存修改' : '创建费率'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
