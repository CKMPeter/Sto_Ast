const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { auth } = require("../firebase-admin-setup");

module.exports = function (app) {
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  app.use(
    cors({
      origin: [
        "https://localhost:3000",
        "http://localhost:3000",
        process.env.FRONTEND_URL,
      ],
      credentials: false,
      methods: ['GET', 'PUT', 'OPTIONS', 'POST', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(
    helmet({
      xFrameOptions: { action: "sameorigin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", process.env.FRONTEND_URL],
          styleSrc: ["'self'", process.env.FRONTEND_URL],
          imgSrc: ["'self'", "data:", "https://firebasestorage.googleapis.com"],
          connectSrc: ["'self'", process.env.FRONTEND_URL, process.env.BACKEND_URL],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
        },
      },
    })
  );

  app.disable("x-powered-by");

  // ✅ Global auth middleware that skips only /api/user/theme
  app.use(async (req, res, next) => {
    const isThemeAPI =
      req.path === `${process.env.BACKEND_URL}/api/user/theme` &&
      (req.method === "GET" || req.method === "PUT");

    if (isThemeAPI) {
      console.log("Skipping token check for theme API");
      return next(); // Skip token check for this API
    }

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const idToken = authHeader.split(" ")[1];
    if (!idToken) {
      return res.status(401).json({ error: "Token not found" });
    }

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      req.decodedToken = decodedToken;
      next();
    } catch (err) {
      console.error("Token verification failed:", err.message);
      return res.status(401).json({ error: "Unauthorized" });
    }
  });
};
