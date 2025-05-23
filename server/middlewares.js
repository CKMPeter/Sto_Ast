const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { auth } = require("./firebase-admin-setup");

module.exports = function (app) {
  //json and urlencoded body parser setup
  //Allow larger request bodies
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  //CORS setup
  app.use(
    cors({
      origin: [
        "https://localhost:3000",
        "http://localhost:3000",
        process.env.FRONTEND_URL,
      ],
      credentials: true,
    })
  );

  //Helmet setup
  app.use(
    helmet({
      xFrameOptions: { action: "sameorigin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            process.env.FRONTEND_URL,
            "https://localhost:3000",
            "https://apis.google.com",
            "https://www.gstatic.com",
          ],
          styleSrc: [
            "'self'",
            process.env.FRONTEND_URL,
            "https://localhost:3000",
          ],
          imgSrc: [
            "'self'",
            "data:",
            "https://firebasestorage.googleapis.com",
            "https://*.googleusercontent.com",
          ],
          connectSrc: [
            "'self'",
            process.env.FRONTEND_URL,
            process.env.BACKEND_URL,
            "https://localhost:5000",
            "http://localhost:3000",
            "https://generativelanguage.googleapis.com",
          ],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          formAction: ["'self'"],
          frameSrc: [
            "'self'",
            "https://auth-development-f6d07.firebaseapp.com",
            "https://apis.google.com",
          ], // Allowing framing of Google Auth
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'self'"],
        },
      },
    })
  );

  //disable x-powered-by
  app.disable("x-powered-by");

  //token authentication setup
  app.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid Authorization header" });
    }

    const idToken = authHeader.split(" ")[1];
    if (!idToken) {
      return res.status(401).json({ error: "Token not found" });
    }

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      req.decodedToken = decodedToken; // includes uid, email, etc.
      next();
    } catch (err) {
      console.error("Token verification failed:", err.message);
      return res.status(401).json({ error: "Unauthorized" });
    }
  });
};
