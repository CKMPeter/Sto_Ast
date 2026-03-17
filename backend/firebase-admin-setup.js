const admin = require("firebase-admin");
const serviceAccount = {
  type: "service_account",
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
};

// Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

// Export Firebase services
const auth = admin.auth();
const firestore = admin.firestore();
const realtimeDatabase = admin.database();

// Realtime DB helpers
const ref = (path) => realtimeDatabase.ref(path);
const remove = async (path) => await realtimeDatabase.ref(path).remove();
const update = async (path, data) =>
  await realtimeDatabase.ref(path).update(data);

module.exports = {
  admin,
  auth,
  verifyIdToken: auth.verifyIdToken,
  db: firestore,
  realtimeDatabase,
  ServerValue: admin.database.ServerValue,
  FieldValue: admin.firestore.FieldValue,
  ref,
  remove,
  update,

  formatDoc: (doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate().toISOString() || null,
    };
  },
};
