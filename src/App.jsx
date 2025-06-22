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
  const [skip, setSkip] = useState(0);

  const limit = 10;
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const controllerRef = useRef(null);
  const fetchKeyRef = useRef({ query: '', skip: -1 });

  // Fetch users with optional append mode
  const fetchUsers = async (query = '', skipValue = 0, append = false) => {
    // Avoid duplicate fetch
    if (
      fetchKeyRef.current.query === query &&
      fetchKeyRef.current.skip === skipValue
    ) {
      return;
    }

    fetchKeyRef.current = { query, skip: skipValue };

    // Abort previous request
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    try {
      const url =
        query.length >= 2
          ? `https://dummyjson.com/users/search?q=${encodeURIComponent(query)}&limit=${limit}&skip=${skipValue}`
          : `https://dummyjson.com/users?limit=${limit}&skip=${skipValue}`;

      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();

      if (Array.isArray(data.users)) {
        setUsers(prev =>
          append ? [...prev, ...data.users] : data.users
        );
        setTotal(typeof data.total === 'number' ? data.total : 0);
      } else {
        setUsers([]);
        setTotal(0);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // Fetch was aborted
        return;
      }
      console.error('Fetch error:', err);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Reset on search change
  useEffect(() => {
    setSkip(0);
    fetchUsers(debouncedSearchTerm, 0, false);
  }, [debouncedSearchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleLoadMore = () => {
    const nextSkip = skip + limit;
    setSkip(nextSkip);
    fetchUsers(debouncedSearchTerm, nextSkip, true);
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

      <p>
        Showing {users.length} of {total} users
      </p>

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
