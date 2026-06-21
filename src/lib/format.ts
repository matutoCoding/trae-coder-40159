export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getSiteTypeName(type: string): string {
  const names: Record<string, string> = {
    standard: '标准营位',
    premium: '高级营位',
    vip: 'VIP营位',
  };
  return names[type] || type;
}

export function getRateTypeName(type: string): string {
  const names: Record<string, string> = {
    peak: '旺季',
    normal: '平季',
    off_peak: '淡季',
  };
  return names[type] || type;
}

export function getBookingStatusName(status: string): string {
  const names: Record<string, string> = {
    confirmed: '已确认',
    'checked-in': '已入住',
    'checked-out': '已退房',
    cancelled: '已取消',
  };
  return names[status] || status;
}

export function getBillStatusName(status: string): string {
  const names: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    refunded: '已退款',
  };
  return names[status] || status;
}

export function getSiteStatusName(status: string): string {
  const names: Record<string, string> = {
    available: '可用',
    maintenance: '维护中',
    closed: '关闭',
  };
  return names[status] || status;
}

export function getDaysBetween(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

export function getBillItemTypeName(type: string): string {
  const names: Record<string, string> = {
    site_fee: '营位费',
    electricity: '电力接驳费',
    water: '供水接驳费',
    sewer: '排污接驳费',
  };
  return names[type] || type;
}
