const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://localhost:5000',
      changeOrigin: true,
      onProxyRes: function (proxyRes) {
        proxyRes.headers['X-Content-Type-Options'] = 'nosniff';
        proxyRes.headers['X-Frame-Options'] = 'DENY'; // <- Add this
        proxyRes.headers['Content-Security-Policy'] =
          "default-src 'none'; " +
          "script-src 'self'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self'; " +
          "connect-src 'self'; " +
          "frame-ancestors 'none';"; // <- Add this
      },
    })
  );
};
