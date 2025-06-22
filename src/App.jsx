import React, { useState, useEffect, useRef } from 'react';
import useDebounce from './hooks/useDebounce';
import './App.css';

// Memoized list item for performance
const UserItem = React.memo(({ user }) => (
  <li key={user.id}>
    {user.firstName} {user.lastName} — {user.email}
  </li>
));

function App() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const debouncedSearchTerm = useDebounce(searchTerm, 1000);
  const lastFetchRef = useRef({ term: '', page: -1 });

  const fetchUsers = async (query = '', page = 0) => {
    const skip = page * limit;

    // Prevent duplicate fetches
    if (lastFetchRef.current.term === query && lastFetchRef.current.page === page) {
      return;
    }

    lastFetchRef.current = { term: query, page };
    setLoading(true);

    try {
      const url = query.length >= 2
        ? `https://dummyjson.com/users/search?q=${encodeURIComponent(query)}&limit=${limit}&skip=${skip}`
        : `https://dummyjson.com/users?limit=${limit}&skip=${skip}`;

      const response = await fetch(url);
      const data = await response.json();

      setUsers(Array.isArray(data.users) ? data.users : []);
      setTotal(typeof data.total === 'number' ? data.total : 0);
    } catch (error) {
      console.error('Fetch error:', error);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(debouncedSearchTerm, page);
  }, [debouncedSearchTerm, page]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setPage(0); // reset to first page on new search
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>User Search (with Pagination)</h1>

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

      {loading ? (
        <div style={{ minHeight: '300px' }}>
          <p>Loading users...111</p>
        </div>
      ) : users.length > 0 ? (
        <>
          <ul>
            {users.map((user) => (
              <UserItem key={user.id} user={user} />
            ))}
          </ul>

          {totalPages > 1 && (
            <div style={{ marginTop: '20px' }}>
              <button
                aria-label="Previous page"
                disabled={page === 0}
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              >
                ◀ Prev
              </button>

              <span style={{ margin: '0 10px' }}>
                Page {page + 1} of {totalPages}
              </span>

              <button
                aria-label="Next page"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next ▶
              </button>
            </div>
          )}
        </>
      ) : (
        <p>No users found.</p>
      )}
    </div>
  );
}

export default App;
