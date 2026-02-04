const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  target = process.env.REACT_APP_FRONTEND_URL || 'https://localhost:3000';
  app.use(
    '/api',
    createProxyMiddleware({
      target: `${target}`, // Ensure this matches your development server
      changeOrigin: true,
      secure: false, // Allow self-signed certificates for local HTTPS (if necessary)
      onProxyRes: function (proxyRes) {
        proxyRes.headers['X-Content-Type-Options'] = 'nosniff';
        proxyRes.headers['X-Frame-Options'] = 'DENY'; // Anti-clickjacking
        proxyRes.headers['Content-Security-Policy'] = 
          "default-src 'self'; " +
          "script-src 'self'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "imgSrc 'self', 'data:', 'https://firebasestorage.googleapis.com', 'https://*.googleusercontent.com'" +
          "connect-src 'self'; " +
          "frame-ancestors 'none';"; // Prevent framing and clickjacking
      },
    })
  );
};
