const { auth } = require("../firebase-admin-setup");

module.exports = {
  // Update user information
  updateUser: async (uid, email, newPassword) => {
    try {
      return await auth.updateUser(uid, {
        email: email,
        password: newPassword,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },
};
