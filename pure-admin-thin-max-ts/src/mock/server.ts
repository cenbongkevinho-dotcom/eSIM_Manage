import { setupWorker, rest } from 'msw';

interface MockData {
  mockActivationCodes: any[];
  mockSubscriptions: any[];
  mockInvoices: any[];
}

export function setupMockServer(mockData: MockData) {
  // 只有开发环境才启用mock
  if (import.meta.env.PROD) return;

  const { mockActivationCodes, mockSubscriptions, mockInvoices } = mockData;
  
  const handlers = [
    // 激活码相关
    rest.get('/api/activation-codes', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json(mockActivationCodes)
      );
    }),
    
    // 订阅相关
    rest.get('/api/subscriptions', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json(mockSubscriptions)
      );
    }),
    
    rest.get('/api/subscriptions/:id', (req, res, ctx) => {
      const { id } = req.params;
      const subscription = mockSubscriptions.find(s => s.id === id);
      return res(
        ctx.status(subscription ? 200 : 404),
        ctx.json(subscription || { error: 'Subscription not found' })
      );
    }),
    
    // 发票相关
    rest.get('/api/billing/invoices', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json(mockInvoices)
      );
    }),
    
    rest.get('/api/billing/invoices/:id', (req, res, ctx) => {
      const { id } = req.params;
      const invoice = mockInvoices.find(i => i.id === id);
      return res(
        ctx.status(invoice ? 200 : 404),
        ctx.json(invoice || { error: 'Invoice not found' })
      );
    }),
    
    rest.post('/api/billing/invoices/:id/reconcile', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          message: '对账成功',
          data: {
            differences: [],
            totalAmount: 1000,
            reconcileItems: []
          }
        })
      );
    }),
    
    rest.post('/api/billing/invoices/:id/approve', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          message: '审批成功',
          status: 'approved'
        })
      );
    }),
    
    rest.post('/api/billing/invoices/:id/sign', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          message: '签章成功',
          status: 'signed'
        })
      );
    }),
    
    rest.get('/api/billing/invoices/:id/pdf', (req, res, ctx) => {
      // 创建一个简单的PDF文件（实际应用中应该返回真实的PDF）
      const blob = new Blob(['Mock PDF Content'], { type: 'application/pdf' });
      return res(
        ctx.status(200),
        ctx.set('Content-Type', 'application/pdf'),
        ctx.body(blob)
      );
    })
  ];
  
  const worker = setupWorker(...handlers);
  
  worker.start().catch(err => {
    console.error('Mock server failed to start:', err);
  });
}
