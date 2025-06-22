import React, { useState, useEffect, useRef } from 'react';
import useDebounce from './hooks/useDebounce';
import './App.css';

const UserItem = React.memo(({ user }) => (
  <li key={user.id}>
    {user.firstName} {user.lastName} — {user.email}
  </li>
));

function App() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const [skip, setSkip] = useState(0); // how many users already fetched
  const limit = 10;

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const lastQueryRef = useRef('');

  const fetchUsers = async (query = '', skipValue = 0, append = false) => {
    setLoading(true);
    try {
      const url =
        query.length >= 2
          ? `https://dummyjson.com/users/search?q=${encodeURIComponent(query)}&limit=${limit}&skip=${skipValue}`
          : `https://dummyjson.com/users?limit=${limit}&skip=${skipValue}`;

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data.users)) {
        setUsers(prev => append ? [...prev, ...data.users] : data.users);
        setTotal(data.total || 0);
      } else {
        setUsers([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Reset on search term change
  useEffect(() => {
    setSkip(0);
    lastQueryRef.current = debouncedSearchTerm;
    fetchUsers(debouncedSearchTerm, 0, false);
  }, [debouncedSearchTerm]);

  // Handle "Load More"
  const handleLoadMore = () => {
    const nextSkip = skip + limit;
    setSkip(nextSkip);
    fetchUsers(lastQueryRef.current, nextSkip, true);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const hasMore = users.length < total;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>User Search (Load More)</h1>

      <input
        type="text"
        placeholder="Search by name, email, etc..."
        value={searchTerm}
        onChange={handleSearch}
        style={{
          padding: '8px',
          width: '300px',
          marginBottom: '20px',
          fontSize: '16px',
        }}
      />

      {users.length > 0 ? (
        <>
          <ul>
            {users.map((user) => (
              <UserItem key={user.id} user={user} />
            ))}
          </ul>

          {hasMore && (
            <div style={{ marginTop: '20px' }}>
              <button onClick={handleLoadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      ) : loading ? (
        <p>Loading users...</p>
      ) : (
        <p>No users found.</p>
      )}
    </div>
  );
}

export default App;
