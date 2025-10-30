import { setupMockServer } from '@/mock/server';
import { mockActivationCodes, mockSubscriptions, mockInvoices } from '@/mock/data';

// 启动模拟服务器
setupMockServer({
  mockActivationCodes,
  mockSubscriptions,
  mockInvoices
});
