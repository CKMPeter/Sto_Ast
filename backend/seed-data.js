/**
 * Firebase Realtime Database seed script
 * Adds test friends and messages for development/testing
 * 
 * Usage: node seed-data.js
 */

require('dotenv').config();
const { realtimeDatabase } = require('./firebase-admin-setup');

const testUserId = 'testuser123'; // Example user ID
const testFriendId1 = 'alice456';
const testFriendId2 = 'bob789';

async function seedDatabase() {
  try {
    console.log('🌱 Seeding Firebase Realtime Database...\n');

    // Add test friends for the user
    console.log(`Adding friends for user: ${testUserId}`);
    const friendsData = {
      [testFriendId1]: {
        id: testFriendId1,
        name: 'Alice',
        displayName: 'Alice Johnson',
        photoURL: 'https://via.placeholder.com/50',
        status: 'online',
        lastSeen: new Date().toISOString(),
      },
      [testFriendId2]: {
        id: testFriendId2,
        name: 'Bob',
        displayName: 'Bob Smith',
        photoURL: 'https://via.placeholder.com/50',
        status: 'offline',
        lastSeen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
    };

    await realtimeDatabase.ref(`friends/${testUserId}`).set(friendsData);
    console.log('✅ Friends added successfully\n');

    // Add test messages between user and Alice
    console.log(`Adding messages between ${testUserId} and ${testFriendId1}`);
    const now = Date.now();
    const messagesData = {
      msg1: {
        id: 'msg1',
        text: 'Hi there!',
        sender: testFriendId1,
        timestamp: now - 10000,
      },
      msg2: {
        id: 'msg2',
        text: 'Hello, Alice! How are you?',
        sender: testUserId,
        timestamp: now - 8000,
      },
      msg3: {
        id: 'msg3',
        text: "I'm good, thanks! Just wanted to check in.",
        sender: testFriendId1,
        timestamp: now - 5000,
      },
      msg4: {
        id: 'msg4',
        text: "That's great! Let's catch up soon.",
        sender: testUserId,
        timestamp: now - 2000,
      },
      msg5: {
        id: 'msg5',
        text: 'Sounds good! See you later!',
        sender: testFriendId1,
        timestamp: now,
      },
    };

    await realtimeDatabase
      .ref(`messages/${testUserId}/${testFriendId1}`)
      .set(messagesData);
    console.log('✅ Messages added successfully\n');

    // Add test messages between user and Bob (fewer messages)
    console.log(`Adding messages between ${testUserId} and ${testFriendId2}`);
    const messagesDataBob = {
      msg1: {
        id: 'msg1',
        text: 'Hey, what are you up to?',
        sender: testFriendId2,
        timestamp: now - 20000,
      },
      msg2: {
        id: 'msg2',
        text: "Just working on a project. You?",
        sender: testUserId,
        timestamp: now - 15000,
      },
    };

    await realtimeDatabase
      .ref(`messages/${testUserId}/${testFriendId2}`)
      .set(messagesDataBob);
    console.log('✅ Messages with Bob added successfully\n');

    // Add reverse friend entries (so they also see each other as friends)
    console.log(`Adding reverse friend entries...`);
    await realtimeDatabase.ref(`friends/${testFriendId1}`).set({
      [testUserId]: {
        id: testUserId,
        name: 'Test User',
        displayName: 'Test User',
        photoURL: 'https://via.placeholder.com/50',
        status: 'online',
      },
    });

    await realtimeDatabase.ref(`friends/${testFriendId2}`).set({
      [testUserId]: {
        id: testUserId,
        name: 'Test User',
        displayName: 'Test User',
        photoURL: 'https://via.placeholder.com/50',
        status: 'offline',
      },
    });

    console.log('✅ Reverse friend entries added\n');

    console.log('🎉 Database seeding completed!');
    console.log(
      `\nTest with these user IDs:\n- User: ${testUserId}\n- Friend 1: ${testFriendId1}\n- Friend 2: ${testFriendId2}`
    );

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
