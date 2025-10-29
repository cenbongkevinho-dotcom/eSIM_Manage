/**
 * Dredd hooks (optional):
 * - 自动注入 Idempotency-Key 与 X-Request-ID
 * - 便于在 CI 环境中保证 POST 幂等与可观测性关联
 */

const crypto = require('crypto');

function genId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return crypto.randomBytes(16).toString('hex');
}

module.exports = (hooks) => {
  hooks.beforeAll((transactions, done) => {
    process.env.REQUEST_ID = process.env.REQUEST_ID || genId();
    done();
  });

  hooks.beforeEach((transaction, done) => {
    transaction.request.headers = transaction.request.headers || {};

    if (!transaction.request.headers['Idempotency-Key']) {
      transaction.request.headers['Idempotency-Key'] = process.env.IDEMPOTENCY_KEY || genId();
    }

    if (!transaction.request.headers['X-Request-ID']) {
      transaction.request.headers['X-Request-ID'] = process.env.REQUEST_ID || genId();
    }

    done();
  });
};

