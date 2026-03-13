import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import BookCard from '../components/BookCard';
import { apiCall } from '../utils/api';

export default function CataloguePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read state from URL instead of useState
  const currentPage = parseInt(searchParams.get('page') || '1');
  const searchQuery = searchParams.get('query') || '';
  const selectedGenre = searchParams.get('genre') || '';
  const minRating = searchParams.get('minRating') || '';

  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState([]);

  const isSearching = !!(searchQuery || selectedGenre || minRating);

  // Helper to update URL params
  function updateParams(updates) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    // Reset to page 1 whenever filters change
    if (updates.query !== undefined || updates.genre !== undefined || updates.minRating !== undefined) {
      next.delete('page');
    }
    setSearchParams(next, { replace: true });
  }

  useEffect(() => {
    apiCall('GET', '/onboarding/genres').then(setGenres).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);

    if (isSearching) {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedGenre) params.append('genre', selectedGenre);
      if (minRating) params.append('minRating', minRating);

      const timer = setTimeout(() => {
        apiCall('GET', `/books/search?${params.toString()}`)
          .then(data => setBooks(data))
          .catch(console.error)
          .finally(() => setLoading(false));
      }, 400);
      return () => clearTimeout(timer);
    } else {
      apiCall('GET', `/books?page=${currentPage}`)
        .then(data => {
          setBooks(data.books);
          setPagination(data.pagination);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [currentPage, searchQuery, selectedGenre, minRating, isSearching]);

  const inputStyle = {
    padding: '10px 14px',
    background: 'rgba(20,12,4,0.5)',
    border: '1px solid rgba(212,175,100,0.2)',
    borderRadius: '2px',
    color: '#e8d5b0',
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url('/fundal_register.avif')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      fontFamily: "'Lora', Georgia, serif",
      paddingBottom: '60px',
      position: 'relative',
    }}>

      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(8,5,2,0.68)',
        zIndex: 0, pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 1,
        borderBottom: '1px solid rgba(212,175,100,0.12)',
        padding: '28px 48px 24px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        background: 'rgba(20,12,4,0.25)',
      }}>
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '13px', color: 'rgba(212,175,100,0.6)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          margin: '0 0 8px 0',
        }}>Explore</p>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '36px', fontWeight: '700',
          color: '#f0e0c0', margin: 0,
        }}>Browse Books</h1>
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '32px 48px 0' }}>

        {/* Search and filter bar */}
        <div style={{
          display: 'flex', gap: '12px',
          marginBottom: '32px', flexWrap: 'wrap',
        }}>
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={e => updateParams({ query: e.target.value })}
            style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
            onFocus={e => e.target.style.borderColor = 'rgba(212,175,100,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(212,175,100,0.2)'}
          />
          <select
            value={selectedGenre}
            onChange={e => updateParams({ genre: e.target.value })}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">All Genres</option>
            {genres.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
          </select>
          <select
            value={minRating}
            onChange={e => updateParams({ minRating: e.target.value })}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">Any Rating</option>
            <option value="3">3+ Stars</option>
            <option value="3.5">3.5+ Stars</option>
            <option value="4">4+ Stars</option>
            <option value="4.5">4.5+ Stars</option>
          </select>
          {isSearching && (
            <button
              onClick={() => setSearchParams({}, { replace: true })}
              style={{
                ...inputStyle,
                cursor: 'pointer',
                background: 'transparent',
                color: 'rgba(212,175,100,0.7)',
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Book grid */}
        {loading ? (
          <div style={{
            textAlign: 'center', padding: '60px',
            fontFamily: "'Lora', Georgia, serif",
            color: 'rgba(212,175,100,0.6)', fontStyle: 'italic',
          }}>
            Loading books...
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '20px', marginBottom: '40px',
            }}>
              {books.map(book => <BookCard key={book.id} book={book} />)}
            </div>

            {/* Pagination */}
            {!isSearching && pagination.totalPages > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'center',
                alignItems: 'center', gap: '16px', paddingBottom: '20px',
              }}>
                <button
                  onClick={() => updateParams({ page: String(currentPage - 1) })}
                  disabled={!pagination.hasPrevPage}
                  style={{
                    padding: '9px 20px', background: 'transparent',
                    border: '1px solid rgba(212,175,100,0.25)', borderRadius: '2px',
                    color: pagination.hasPrevPage ? 'rgba(232,213,176,0.8)' : 'rgba(212,175,100,0.25)',
                    fontFamily: "'Lora', Georgia, serif", fontSize: '13px',
                    cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed',
                    letterSpacing: '0.04em',
                  }}
                >
                  ← Previous
                </button>
                <span style={{
                  fontFamily: "'Lora', Georgia, serif", fontSize: '13px',
                  color: 'rgba(212,175,100,0.6)', fontStyle: 'italic',
                }}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => updateParams({ page: String(currentPage + 1) })}
                  disabled={!pagination.hasNextPage}
                  style={{
                    padding: '9px 20px', background: 'transparent',
                    border: '1px solid rgba(212,175,100,0.25)', borderRadius: '2px',
                    color: pagination.hasNextPage ? 'rgba(232,213,176,0.8)' : 'rgba(212,175,100,0.25)',
                    fontFamily: "'Lora', Georgia, serif", fontSize: '13px',
                    cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed',
                    letterSpacing: '0.04em',
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}