import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import BookCard from '../components/BookCard';
import DefaultBookCover from '../components/DefaultBookCover';
import { apiCall } from '../utils/api';

function hasGoodCover(url) {
  return url && (url.includes('books.google') || url.includes('openlibrary'));
}

export default function CataloguePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentPage = parseInt(searchParams.get('page') || '1');
  const searchQuery = searchParams.get('query') || '';
  const selectedGenre = searchParams.get('genre') || '';
  const minRating = searchParams.get('minRating') || '';

  const [books, setBooks] = useState([]);
  const [googleBooks, setGoogleBooks] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState([]);
  const [importingId, setImportingId] = useState(null);
  const [hoverBookId, setHoverBookId] = useState(null);

  const isSearching = !!(searchQuery || selectedGenre || minRating);
  const isTextSearching = !!searchQuery;

  function updateParams(updates) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
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
    setGoogleBooks([]);

    if (isSearching) {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedGenre) params.append('genre', selectedGenre);
      if (minRating) params.append('minRating', minRating);

      const timer = setTimeout(() => {
        // Always fetch local results
        const localFetch = apiCall('GET', `/books/search?${params.toString()}`)
          .then(data => setBooks(data))
          .catch(console.error);

        // Only fetch Google Books if there's a text query
        const googleFetch = isTextSearching
          ? apiCall('GET', `/books/search/combined?query=${encodeURIComponent(searchQuery)}`)
              .then(data => setGoogleBooks(data.google || []))
              .catch(console.error)
          : Promise.resolve();

        Promise.all([localFetch, googleFetch]).finally(() => setLoading(false));
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
  }, [currentPage, searchQuery, selectedGenre, minRating, isSearching, isTextSearching]);

  // When user clicks a Google Books result — import it then navigate
  async function handleGoogleBookClick(googleBook) {
    setImportingId(googleBook.google_books_id);
    try {
      const result = await apiCall('POST', '/books/import', {
        google_books_id: googleBook.google_books_id,
        title: googleBook.title,
        authors: googleBook.authors,
        genres: googleBook.genres,
        cover_image_url: googleBook.cover_image_url,
        average_rating: googleBook.average_rating,
        ratings_count: googleBook.ratings_count,
        publication_year: googleBook.publication_year,
        page_count: googleBook.page_count,
        synopsis: googleBook.synopsis,
      });
      navigate(`/books/${result.id}`);
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setImportingId(null);
    }
  }

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
                ...inputStyle, cursor: 'pointer',
                background: 'transparent',
                color: 'rgba(212,175,100,0.7)',
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div style={{
            textAlign: 'center', padding: '60px',
            color: 'rgba(212,175,100,0.6)', fontStyle: 'italic',
          }}>
            Loading books...
          </div>
        ) : (
          <>
            {/* ── Local results ── */}
            {books.length > 0 && (
              <>
                {isSearching && (
                  <p style={{
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: '12px', color: 'rgba(212,175,100,0.45)',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    marginBottom: '16px',
                  }}>
                    {books.length} result{books.length !== 1 ? 's' : ''} in Bookish catalogue
                  </p>
                )}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '20px', marginBottom: '40px',
                }}>
                  {books.map(book => <BookCard key={book.id} book={book} />)}
                </div>
              </>
            )}

            {books.length === 0 && isSearching && (
              <p style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: '14px', color: 'rgba(212,175,100,0.45)',
                fontStyle: 'italic', marginBottom: '32px',
              }}>
                No books found in the Bookish catalogue for this search.
              </p>
            )}

            {/* ── Google Books results ── */}
            {googleBooks.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  marginBottom: '20px',
                }}>
                  <div style={{
                    flex: 1, height: '1px',
                    background: 'rgba(212,175,100,0.12)',
                  }} />
                  <p style={{
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: '12px', color: 'rgba(212,175,100,0.45)',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    margin: 0, whiteSpace: 'nowrap',
                  }}>
                    Also found via Google Books
                  </p>
                  <div style={{
                    flex: 1, height: '1px',
                    background: 'rgba(212,175,100,0.12)',
                  }} />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '20px',
                }}>
                  {googleBooks.map(book => (
                    <div
                      key={book.google_books_id}
                      onClick={() => handleGoogleBookClick(book)}
                      onMouseEnter={() => setHoverBookId(book.google_books_id)}
                      onMouseLeave={() => setHoverBookId(null)}
                      style={{
                        cursor: importingId === book.google_books_id ? 'wait' : 'pointer',
                        transform: hoverBookId === book.google_books_id ? 'translateY(-4px)' : 'translateY(0)',
                        transition: 'transform 0.18s ease',
                        opacity: importingId && importingId !== book.google_books_id ? 0.5 : 1,
                      }}
                    >
                      {/* Cover */}
                      <div style={{
                        width: '100%', aspectRatio: '2/3',
                        borderRadius: '6px', overflow: 'hidden',
                        boxShadow: hoverBookId === book.google_books_id
                          ? '0 12px 32px rgba(0,0,0,0.6)'
                          : '0 4px 16px rgba(0,0,0,0.4)',
                        border: '1px solid rgba(212,175,100,0.15)',
                        transition: 'box-shadow 0.18s ease',
                        marginBottom: '10px',
                        position: 'relative',
                      }}>
                        {importingId === book.google_books_id && (
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(8,5,2,0.7)',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', zIndex: 2,
                          }}>
                            <span style={{
                              fontFamily: "'Lora', Georgia, serif",
                              fontSize: '11px', color: 'rgba(212,175,100,0.8)',
                              fontStyle: 'italic',
                            }}>Adding...</span>
                          </div>
                        )}
                        {hasGoodCover(book.cover_image_url) ? (
                          <img
                            src={book.cover_image_url}
                            alt={book.title}
                            style={{
                              width: '100%', height: '100%', objectFit: 'cover',
                              filter: 'sepia(8%) contrast(105%) brightness(95%)',
                            }}
                          />
                        ) : (
                          <DefaultBookCover
                            title={book.title}
                            author={(book.authors || []).join(', ')}
                            width="100%"
                            height="100%"
                          />
                        )}
                      </div>

                      {/* Title */}
                      <p style={{
                        fontFamily: "'Lora', Georgia, serif",
                        fontSize: '13px', color: 'rgba(232,213,176,0.85)',
                        margin: '0 0 3px 0', fontWeight: '600',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', lineHeight: '1.4',
                      }}>
                        {book.title}
                      </p>

                      {/* Author */}
                      <p style={{
                        fontFamily: "'Lora', Georgia, serif",
                        fontSize: '11px', color: 'rgba(212,175,100,0.5)',
                        margin: '0 0 3px 0', fontStyle: 'italic',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {(book.authors || []).join(', ')}
                      </p>

                      {/* Year */}
                      {book.publication_year && (
                        <p style={{
                          fontFamily: "'Lora', Georgia, serif",
                          fontSize: '11px', color: 'rgba(212,175,100,0.35)',
                          margin: 0,
                        }}>
                          {book.publication_year}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination — only when not searching */}
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