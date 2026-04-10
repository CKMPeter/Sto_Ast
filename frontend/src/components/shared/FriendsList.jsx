import React from 'react';
import useFriends from '../../hooks/useFriends';

export default function FriendsList({ userId }) {
  const { friends, loading, error, refresh } = useFriends(userId);

  return (
    <div className="friends-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Friends</h3>
        <button onClick={refresh} disabled={loading} style={{ fontSize: 12 }}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {!loading && friends.length === 0 && <div>No friends found.</div>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {friends.map((f) => (
          <li key={f.id || f._id || f.userid} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <div style={{ fontWeight: 600 }}>{f.name || f.username || f.displayName || f.id}</div>
            {f.status && <div style={{ fontSize: 12, color: '#666' }}>{f.status}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
