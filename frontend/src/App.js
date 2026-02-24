import { useState, useEffect } from 'react';

function App() {
  // --- Global state for my books ---
  // Start with an empty list so the map function doesn't crash on load
  const [books, setBooks] = useState([]);
  
  // Need this to show a spinner or "Loading" message while fetching
  const [loading, setLoading] = useState(true);
  
  // Catching errors here so the UI doesn't just go blank if the API is down
  const [error, setError] = useState(null);

  // Run the fetch once as soon as the app mounts
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        // Pointing this to my local Express server (port 3001)
        const response = await fetch('http://localhost:3001/api/books');

        if (!response.ok) {
          throw new Error('Database connection failed or server is acting up');
        }

        const data = await response.json();
        
        // Everything looks good, update the list
        setBooks(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        // Stop the loading state regardless of if it worked or not
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // Simple guard clauses for loading/error states
  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Wait a sec, grabbing your library...</div>;
  }

  if (error) {
    return <div style={{ padding: '40px', color: '#ef4444' }}>Oops: {error}</div>;
  }

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: '10px' }}>📚 Bookish</h1>
      <p style={{ marginBottom: '30px', opacity: 0.8 }}>
        Found {books.length} entries in the database.
      </p>

      {/* Main book list loop */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {books.map((book) => (
          <div
            key={book.id}
            style={{
              display: 'flex',
              gap: '20px',
              padding: '20px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            {/* Cover image with a quick fallback for broken links */}
            {book.cover_image_url && (
              <img
                src={book.cover_image_url}
                alt={book.title}
                style={{ width: '80px', borderRadius: '4px' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}

            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.25rem', margin: '0 0 8px 0' }}>{book.title}</h2>
              
              {/* Clean up the authors list if there's more than one */}
              <p style={{ margin: '0 0 10px 0', color: '#475569' }}>
                By {book.authors && book.authors.filter(Boolean).join(', ')}
              </p>

              {/* Just rounding the rating to one decimal place for neatness */}
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#b45309' }}>
                ⭐ {book.average_rating ? Number(book.average_rating).toFixed(1) : 'NR'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;