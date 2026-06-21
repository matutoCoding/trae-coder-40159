import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { formatDate, getSiteTypeName, getSiteStatusName } from '../lib/format';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, Zap, Droplets, Wrench, MapPin } from 'lucide-react';
import type { CreateSiteRequest, SiteType, SiteStatus } from '../../shared/types';

const siteTypes: { value: SiteType; label: string }[] = [
  { value: 'standard', label: '标准营位' },
  { value: 'premium', label: '高级营位' },
  { value: 'vip', label: 'VIP营位' },
];

const siteStatuses: { value: SiteStatus; label: string }[] = [
  { value: 'available', label: '可用' },
  { value: 'maintenance', label: '维护中' },
  { value: 'closed', label: '关闭' },
];

export default function Sites() {
  const { sites, fetchSites, createSite, updateSite, deleteSite } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<{ id: string; data: CreateSiteRequest } | null>(null);
  const [formData, setFormData] = useState<CreateSiteRequest>({
    name: '',
    code: '',
    type: 'standard',
    hasElectricity: true,
    hasWater: true,
    hasSewer: true,
    status: 'available',
    description: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchSites();
      setLoading(false);
    };
    load();
  }, [fetchSites]);

  const openModal = (site?: { id: string; data: CreateSiteRequest }) => {
    if (site) {
      setEditingSite(site);
      setFormData(site.data);
    } else {
      setEditingSite(null);
      setFormData({
        name: '',
        code: '',
        type: 'standard',
        hasElectricity: true,
        hasWater: true,
        hasSewer: true,
        status: 'available',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let success;
    
    if (editingSite) {
      success = await updateSite(editingSite.id, formData);
    } else {
      success = await createSite(formData);
    }
    
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`确定要删除营位「${name}」吗？`)) {
      await deleteSite(id);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
            营位管理
          </h1>
          <p className="text-zinc-500 mt-1">管理房车营地的所有营位信息</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          新增营位
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map((site, index) => (
          <div
            key={site.id}
            className="card p-5 animate-fade-in-up hover:shadow-md transition-shadow"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  site.type === 'vip'
                    ? 'bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-900/30 dark:to-amber-800/30'
                    : site.type === 'premium'
                    ? 'bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-800/30'
                    : 'bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700'
                }`}>
                  <MapPin className={`w-6 h-6 ${
                    site.type === 'vip'
                      ? 'text-amber-600 dark:text-amber-400'
                      : site.type === 'premium'
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white">{site.name}</h3>
                  <p className="text-sm text-zinc-500">{getSiteTypeName(site.type)}</p>
                </div>
              </div>
              <span className={`badge ${
                site.status === 'available' ? 'badge-available' :
                site.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
              }`}>
                {getSiteStatusName(site.status)}
              </span>
            </div>

            {site.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                {site.description}
              </p>
            )}

            <div className="flex items-center gap-4 mb-4">
              <div className={`flex items-center gap-1.5 text-sm ${
                site.hasElectricity ? 'text-yellow-600 dark:text-yellow-400' : 'text-zinc-400 line-through'
              }`}>
                <Zap className="w-4 h-4" />
                <span>电力</span>
              </div>
              <div className={`flex items-center gap-1.5 text-sm ${
                site.hasWater ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 line-through'
              }`}>
                <Droplets className="w-4 h-4" />
                <span>供水</span>
              </div>
              <div className={`flex items-center gap-1.5 text-sm ${
                site.hasSewer ? 'text-green-600 dark:text-green-400' : 'text-zinc-400 line-through'
              }`}>
                <Wrench className="w-4 h-4" />
                <span>排污</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-xs text-zinc-500">
                更新于 {formatDate(site.updatedAt)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModal({
                    id: site.id,
                    data: {
                      name: site.name,
                      code: site.code,
                      type: site.type,
                      hasElectricity: site.hasElectricity,
                      hasWater: site.hasWater,
                      hasSewer: site.hasSewer,
                      status: site.status,
                      description: site.description || '',
                    },
                  })}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-blue-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(site.id, site.name)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSite ? '编辑营位' : '新增营位'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                营位名称
              </label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：标准营位 A1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                营位编码
              </label>
              <input
                type="text"
                className="input"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="如：A1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                营位类型
              </label>
              <select
                className="input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as SiteType })}
              >
                {siteTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                状态
              </label>
              <select
                className="input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as SiteStatus })}
              >
                {siteStatuses.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              设施配置
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasElectricity}
                  onChange={(e) => setFormData({ ...formData, hasElectricity: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">电力接口</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasWater}
                  onChange={(e) => setFormData({ ...formData, hasWater: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">供水接口</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasSewer}
                  onChange={(e) => setFormData({ ...formData, hasSewer: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">排污接口</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              描述说明
            </label>
            <textarea
              className="input min-h-[80px]"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="营位的位置、特点等说明"
            />
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
              {editingSite ? '保存修改' : '创建营位'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
