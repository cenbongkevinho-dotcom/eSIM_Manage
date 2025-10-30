// 生成随机日期
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// 生成随机状态
function randomStatus<T extends string>(statuses: T[]): T {
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// 运营商列表
const operators = ['op_cn_cmcc', 'op_cn_unicom', 'op_cn_telecom', 'op_global_airalo', 'op_global_holafly'];

// 套餐列表
const plans = ['plan_global_5gb_30d', 'plan_cn_10gb_30d', 'plan_cn_20gb_30d', 'plan_global_2gb_7d', 'plan_global_10gb_30d'];

// 生成激活码数据
export const mockActivationCodes = Array.from({ length: 50 }, (_, index) => ({
  id: `activation_code_${index + 1}`,
  operatorId: randomStatus(operators),
  planId: randomStatus(plans),
  customerId: `cus_${Math.floor(Math.random() * 50) + 1}`,
  code: `E${Math.floor(Math.random() * 1000)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`,
  status: randomStatus(['unused', 'used', 'expired']),
  createdAt: randomDate(new Date('2024-01-01'), new Date()).toISOString()
}));

// 生成订阅数据
export const mockSubscriptions = Array.from({ length: 30 }, (_, index) => ({
  id: `subscription_${index + 1}`,
  operatorId: randomStatus(operators),
  planId: randomStatus(plans),
  customerId: `cus_${Math.floor(Math.random() * 50) + 1}`,
  status: randomStatus(['active', 'inactive', 'cancelled']),
  createdAt: randomDate(new Date('2024-01-01'), new Date()).toISOString(),
  expiresAt: randomDate(new Date(), new Date('2025-12-31')).toISOString()
}));

// 生成发票数据
export const mockInvoices = Array.from({ length: 20 }, (_, index) => ({
  id: `invoice_${index + 1}`,
  subscriptionId: `subscription_${Math.floor(Math.random() * 30) + 1}`,
  customerId: `cus_${Math.floor(Math.random() * 50) + 1}`,
  operatorId: randomStatus(operators),
  period: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
  amount: Math.floor(Math.random() * 10000) / 100,
  currency: 'USD',
  status: randomStatus(['draft', 'issued', 'paid', 'overdue']),
  createdAt: randomDate(new Date('2024-01-01'), new Date()).toISOString(),
  dueDate: randomDate(new Date(), new Date('2025-12-31')).toISOString()
}));
