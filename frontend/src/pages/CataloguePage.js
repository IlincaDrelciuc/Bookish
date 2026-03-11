import { useState, useEffect } from 'react';
import BookCard from '../components/BookCard';
import { apiCall } from '../utils/api';

export default function CataloguePage() {
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [minRating, setMinRating] = useState('');
  const [genres, setGenres] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    apiCall('GET', '/onboarding/genres').then(setGenres).catch(console.error);
  }, []);

  useEffect(() => {
    if (isSearching) return;
    setLoading(true);
    apiCall('GET', `/books?page=${currentPage}`)
      .then(data => {
        setBooks(data.books);
        setPagination(data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentPage, isSearching]);

  useEffect(() => {
    if (!searchQuery && !selectedGenre && !minRating) {
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedGenre) params.append('genre', selectedGenre);
      if (minRating) params.append('minRating', minRating);
      setLoading(true);
      apiCall('GET', `/books/search?${params.toString()}`)
        .then(data => setBooks(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedGenre, minRating]);

  const inputStyle = {
    padding: '10px 14px',
    background: 'rgba(255,250,240,0.8)',
    border: '1px solid rgba(139,101,48,0.25)',
    borderRadius: '2px',
    color: '#2c1a06',
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

      {/* Dark overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8, 5, 2, 0.68)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        borderBottom: '1px solid rgba(212,175,100,0.12)',
        padding: '28px 48px 24px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        background: 'rgba(20, 12, 4, 0.25)',
      }}>
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '13px',
          color: 'rgba(212,175,100,0.6)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          margin: 0,
          marginBottom: '8px',
        }}>Explore</p>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '36px',
          fontWeight: '700',
          color: '#f0e0c0',
          margin: 0,
        }}>Browse Books</h1>
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '32px 48px 0' }}>

        {/* Search and filter bar */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
          flexWrap: 'wrap',
        }}>
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              ...inputStyle,
              flex: 1, minWidth: '200px',
              background: 'rgba(20,12,4,0.5)',
              border: '1px solid rgba(212,175,100,0.2)',
              color: '#e8d5b0',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(212,175,100,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(212,175,100,0.2)'}
          />
          <select
            value={selectedGenre}
            onChange={e => setSelectedGenre(e.target.value)}
            style={{
              ...inputStyle,
              cursor: 'pointer',
              background: 'rgba(20,12,4,0.5)',
              border: '1px solid rgba(212,175,100,0.2)',
              color: '#e8d5b0',
            }}
          >
            <option value="">All Genres</option>
            {genres.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
          </select>
          <select
            value={minRating}
            onChange={e => setMinRating(e.target.value)}
            style={{
              ...inputStyle,
              cursor: 'pointer',
              background: 'rgba(20,12,4,0.5)',
              border: '1px solid rgba(212,175,100,0.2)',
              color: '#e8d5b0',
            }}
          >
            <option value="">Any Rating</option>
            <option value="3">3+ Stars</option>
            <option value="3.5">3.5+ Stars</option>
            <option value="4">4+ Stars</option>
            <option value="4.5">4.5+ Stars</option>
          </select>
          {(searchQuery || selectedGenre || minRating) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGenre('');
                setMinRating('');
                setIsSearching(false);
              }}
              style={{
                ...inputStyle,
                cursor: 'pointer',
                background: 'transparent',
                border: '1px solid rgba(212,175,100,0.2)',
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
            textAlign: 'center',
            padding: '60px',
            fontFamily: "'Lora', Georgia, serif",
            color: 'rgba(212,175,100,0.6)',
            fontStyle: 'italic',
          }}>
            Loading books...
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '20px',
              marginBottom: '40px',
            }}>
              {books.map(book => <BookCard key={book.id} book={book} />)}
            </div>

            {/* Pagination */}
            {!isSearching && pagination.totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                paddingBottom: '20px',
              }}>
                <button
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={!pagination.hasPrevPage}
                  style={{
                    padding: '9px 20px',
                    background: 'transparent',
                    border: '1px solid rgba(212,175,100,0.25)',
                    borderRadius: '2px',
                    color: pagination.hasPrevPage ? 'rgba(232,213,176,0.8)' : 'rgba(212,175,100,0.25)',
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: '13px',
                    cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed',
                    letterSpacing: '0.04em',
                  }}
                >
                  ← Previous
                </button>
                <span style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: '13px',
                  color: 'rgba(212,175,100,0.6)',
                  fontStyle: 'italic',
                }}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={!pagination.hasNextPage}
                  style={{
                    padding: '9px 20px',
                    background: 'transparent',
                    border: '1px solid rgba(212,175,100,0.25)',
                    borderRadius: '2px',
                    color: pagination.hasNextPage ? 'rgba(232,213,176,0.8)' : 'rgba(212,175,100,0.25)',
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: '13px',
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