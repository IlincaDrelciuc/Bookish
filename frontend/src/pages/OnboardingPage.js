import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';
import DefaultBookCover from '../components/DefaultBookCover';

const BG_IMAGE = '/foto-register.webp';

function hasGoodCover(url) {
  return url && (url.includes('books.google') || url.includes('openlibrary'));
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [genres, setGenres] = useState([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    apiCall('GET', '/onboarding/genres')
      .then(data => setGenres(data))
      .catch(err => setError(err.message));
  }, []);

  function toggleGenre(genreId) {
    setSelectedGenreIds(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  }

  // Search both local DB and Google Books
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const [localData, combinedData] = await Promise.all([
          apiCall('GET', `/books/search?query=${encodeURIComponent(searchQuery)}&limit=5`),
          apiCall('GET', `/books/search/combined?query=${encodeURIComponent(searchQuery)}`),
        ]);
        const localIds = new Set(localData.map(b => b.id));
        const googleBooks = (combinedData.google || []).map(b => ({
          ...b,
          id: `google_${b.google_books_id}`,
          _isGoogle: true,
        }));
        setSearchResults([...localData, ...googleBooks].slice(0, 10));
      } catch (err) {
        console.error(err);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function toggleBook(book) {
    setSelectedBooks(prev =>
      prev.find(b => b.id === book.id)
        ? prev.filter(b => b.id !== book.id)
        : [...prev, book]
    );
  }

  async function handleFinish() {
    setLoading(true);
    try {
      // Import any Google Books selections first
      const resolvedBooks = await Promise.all(
        selectedBooks.map(async book => {
          if (book._isGoogle) {
            const result = await apiCall('POST', '/books/import', {
              google_books_id: book.google_books_id,
              title: book.title,
              authors: book.authors,
              genres: book.genres,
              cover_image_url: book.cover_image_url,
              average_rating: book.average_rating,
              ratings_count: book.ratings_count,
              publication_year: book.publication_year,
              page_count: book.page_count,
              synopsis: book.synopsis,
            });
            return result.id;
          }
          return book.id;
        })
      );

      await apiCall('POST', '/onboarding/complete', {
        genreIds: selectedGenreIds,
        priorBookIds: resolvedBooks,
      }, token);
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const needsMore = 3 - selectedGenreIds.length;

  const chipStyle = (selected) => ({
    padding: '8px 18px',
    borderRadius: '20px',
    border: `1px solid ${selected ? 'rgba(212,175,100,0.6)' : 'rgba(212,175,100,0.2)'}`,
    backgroundColor: selected ? 'rgba(212,175,100,0.18)' : 'rgba(255,245,220,0.06)',
    color: selected ? '#f0e0c0' : 'rgba(232,213,176,0.6)',
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '13px',
    fontWeight: selected ? '600' : '400',
    cursor: 'pointer',
    letterSpacing: '0.04em',
    transition: 'all 0.15s',
  });

  if (error) return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url(${BG_IMAGE})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#e09090', fontFamily: "'Lora', Georgia, serif",
      position: 'relative',
    }}>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,6,2,0.6)', zIndex: 0 }} />
      <span style={{ position: 'relative', zIndex: 1 }}>Error: {error}</span>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url(${BG_IMAGE})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: "'Lora', Georgia, serif",
      position: 'relative',
    }}>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,6,2,0.6)', zIndex: 0 }} />

      <span style={{
        position: 'relative', zIndex: 1,
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '48px', fontWeight: '700',
        color: '#f0e0c0', letterSpacing: '0.04em',
        marginBottom: '8px', textShadow: '0 2px 12px rgba(0,0,0,0.5)',
      }}>Bookish</span>

      <span style={{
        position: 'relative', zIndex: 1,
        fontFamily: "'Lora', Georgia, serif",
        fontSize: '14px', color: 'rgba(240,224,192,0.6)',
        fontStyle: 'italic', marginBottom: '32px', letterSpacing: '0.06em',
      }}>Let's personalise your reading experience</span>

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: '620px', width: '100%',
        background: 'rgba(20,12,4,0.55)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(212,175,100,0.2)',
        borderRadius: '4px', padding: '52px 56px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,100,0.08)',
      }}>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              height: '2px', flex: 1, borderRadius: '1px',
              backgroundColor: step >= s ? '#d4af37' : 'rgba(212,175,100,0.15)',
              transition: 'background-color 0.3s',
            }} />
          ))}
        </div>

        {/* ── Step 1: Genres ── */}
        {step === 1 && (
          <div>
            <span style={{
              color: 'rgba(212,175,100,0.5)', fontSize: '11px',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              display: 'block', marginBottom: '10px',
            }}>Step 1 of 2</span>

            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '24px', fontWeight: '600',
              color: '#f0e0c0', marginBottom: '8px', marginTop: 0,
              textShadow: '0 1px 8px rgba(0,0,0,0.4)',
            }}>What genres do you love?</h2>

            <p style={{
              color: selectedGenreIds.length >= 3
                ? 'rgba(144,200,120,0.7)'
                : 'rgba(212,175,100,0.6)',
              fontSize: '13px', fontStyle: 'italic', marginBottom: '28px',
              transition: 'color 0.2s',
            }}>
              {selectedGenreIds.length === 0
                ? 'Select at least 3 to continue'
                : selectedGenreIds.length < 3
                ? `${needsMore} more to go...`
                : `${selectedGenreIds.length} selected — looking good!`}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '36px' }}>
              {genres.map(genre => (
                <button
                  key={genre.id}
                  onClick={() => toggleGenre(genre.id)}
                  style={chipStyle(selectedGenreIds.includes(genre.id))}
                >
                  {genre.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={selectedGenreIds.length < 3}
              style={{
                width: '100%', padding: '13px',
                background: selectedGenreIds.length >= 3
                  ? 'linear-gradient(135deg, #7a4f0d 0%, #4e3008 100%)'
                  : 'rgba(212,175,100,0.08)',
                border: '1px solid rgba(212,175,100,0.25)',
                borderRadius: '2px',
                color: selectedGenreIds.length >= 3 ? '#fff8ee' : 'rgba(212,175,100,0.25)',
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '13px', fontWeight: '600',
                letterSpacing: '0.15em', textTransform: 'uppercase',
                cursor: selectedGenreIds.length >= 3 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >Continue</button>
          </div>
        )}

        {/* ── Step 2: Prior books ── */}
        {step === 2 && (
          <div>
            <span style={{
              color: 'rgba(212,175,100,0.5)', fontSize: '11px',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              display: 'block', marginBottom: '10px',
            }}>Step 2 of 2</span>

            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '24px', fontWeight: '600',
              color: '#f0e0c0', marginBottom: '8px', marginTop: 0,
              textShadow: '0 1px 8px rgba(0,0,0,0.4)',
            }}>Books you've already read</h2>

            <p style={{
              color: 'rgba(212,175,100,0.6)', fontSize: '13px',
              fontStyle: 'italic', marginBottom: '24px',
            }}>
              Helps us recommend better from the start.
              {selectedBooks.length > 0 && (
                <span style={{ color: 'rgba(144,200,120,0.7)', marginLeft: '6px' }}>
                  {selectedBooks.length} added.
                </span>
              )}
            </p>

            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title or author..."
              style={{
                width: '100%', padding: '12px 16px',
                background: 'rgba(255,245,220,0.06)',
                border: '1px solid rgba(212,175,100,0.2)',
                borderRadius: '2px', color: '#e8d5b0',
                fontSize: '14px', fontFamily: "'Lora', Georgia, serif",
                marginBottom: '12px', outline: 'none', boxSizing: 'border-box',
              }}
            />

            {/* Search results */}
            <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '16px' }}>
              {searchResults.map(book => {
                const selected = !!selectedBooks.find(b => b.id === book.id);
                return (
                  <div
                    key={book.id}
                    onClick={() => toggleBook(book)}
                    style={{
                      display: 'flex', gap: '12px', padding: '10px 12px',
                      border: `1px solid ${selected ? 'rgba(212,175,100,0.5)' : 'rgba(212,175,100,0.12)'}`,
                      borderRadius: '4px', marginBottom: '6px',
                      cursor: 'pointer',
                      backgroundColor: selected ? 'rgba(212,175,100,0.12)' : 'rgba(255,245,220,0.03)',
                      transition: 'all 0.15s', alignItems: 'center',
                    }}
                  >
                    {/* Cover */}
                    <div style={{
                      width: '32px', height: '48px', flexShrink: 0,
                      borderRadius: '2px', overflow: 'hidden',
                    }}>
                      {hasGoodCover(book.cover_image_url) ? (
                        <img
                          src={book.cover_image_url}
                          alt={book.title}
                          style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            filter: 'sepia(10%) contrast(105%) brightness(95%)',
                          }}
                        />
                      ) : (
                        <DefaultBookCover
                          title={book.title}
                          author={(book.authors || []).join(', ')}
                          width="32px"
                          height="48px"
                        />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: "'Lora', Georgia, serif",
                        fontSize: '13px', color: '#e8d5b0',
                        marginBottom: '2px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{book.title}</div>
                      <div style={{
                        color: 'rgba(212,175,100,0.55)',
                        fontSize: '11px', fontStyle: 'italic',
                      }}>
                        {(book.authors || []).join(', ')}
                        {book._isGoogle && (
                          <span style={{
                            marginLeft: '6px',
                            color: 'rgba(212,175,100,0.35)',
                            fontSize: '10px',
                          }}>· Google Books</span>
                        )}
                      </div>
                    </div>

                    {selected && (
                      <span style={{ color: '#d4af37', fontSize: '16px', flexShrink: 0 }}>✓</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected books summary */}
            {selectedBooks.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <span style={{
                  fontSize: '11px', letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'rgba(212,175,100,0.5)',
                  display: 'block', marginBottom: '10px',
                }}>Added ({selectedBooks.length})</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedBooks.map(b => (
                    <span
                      key={b.id}
                      onClick={() => toggleBook(b)}
                      title="Click to remove"
                      style={{
                        ...chipStyle(true),
                        maxWidth: '180px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                    >{b.title}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: '13px 24px', background: 'transparent',
                  border: '1px solid rgba(212,175,100,0.2)', borderRadius: '2px',
                  color: 'rgba(232,213,176,0.6)', fontFamily: "'Lora', Georgia, serif",
                  fontSize: '13px', cursor: 'pointer', letterSpacing: '0.04em',
                }}
              >Back</button>

              <button
                onClick={handleFinish}
                disabled={loading}
                style={{
                  flex: 1, padding: '13px',
                  background: 'linear-gradient(135deg, #7a4f0d 0%, #4e3008 100%)',
                  border: '1px solid rgba(212,175,100,0.25)', borderRadius: '2px',
                  color: '#fff8ee',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '13px', fontWeight: '600',
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {loading ? 'Saving...' : selectedBooks.length > 0 ? 'Begin Reading' : 'Finish Setup'}
              </button>
            </div>

            <p
              onClick={handleFinish}
              style={{
                textAlign: 'center', marginTop: '14px',
                fontFamily: "'Lora', Georgia, serif",
                fontSize: '12px', color: 'rgba(212,175,100,0.35)',
                fontStyle: 'italic', cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Skip this step
            </p>
          </div>
        )}
      </div>
    </div>
  );
}