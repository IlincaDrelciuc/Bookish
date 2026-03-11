import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

const BG_IMAGE = '/foto-register.webp';

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
      prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]
    );
  }

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const data = await apiCall('GET', `/books/search?query=${encodeURIComponent(searchQuery)}&limit=8`);
        setSearchResults(data);
      } catch (err) { console.error(err); }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function toggleBook(book) {
    setSelectedBooks(prev =>
      prev.find(b => b.id === book.id) ? prev.filter(b => b.id !== book.id) : [...prev, book]
    );
  }

  async function handleFinish() {
    setLoading(true);
    try {
      await apiCall('POST', '/onboarding/complete', {
        genreIds: selectedGenreIds,
        priorBookIds: selectedBooks.map(b => b.id),
      }, token);
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#e09090',
      fontFamily: "'Lora', Georgia, serif",
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
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: "'Lora', Georgia, serif",
      position: 'relative',
    }}>

      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,6,2,0.6)',
        zIndex: 0,
      }} />

      {/* App name above card */}
      <span style={{
        position: 'relative',
        zIndex: 1,
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '48px',
        fontWeight: '700',
        color: '#f0e0c0',
        letterSpacing: '0.04em',
        marginBottom: '8px',
        textShadow: '0 2px 12px rgba(0,0,0,0.5)',
      }}>Bookish</span>
      <span style={{
        position: 'relative',
        zIndex: 1,
        fontFamily: "'Lora', Georgia, serif",
        fontSize: '14px',
        color: 'rgba(240,224,192,0.6)',
        fontStyle: 'italic',
        marginBottom: '32px',
        letterSpacing: '0.06em',
      }}>Let's personalise your reading experience</span>

      {/* Card */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '620px',
        width: '100%',
        background: 'rgba(20,12,4,0.55)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(212,175,100,0.2)',
        borderRadius: '4px',
        padding: '52px 56px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,100,0.08)',
      }}>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              height: '2px',
              flex: 1,
              borderRadius: '1px',
              backgroundColor: step >= s ? '#d4af37' : 'rgba(212,175,100,0.15)',
              transition: 'background-color 0.3s',
            }} />
          ))}
        </div>

        {step === 1 && (
          <div>
            <span style={{
              color: 'rgba(212,175,100,0.5)',
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '10px',
            }}>
              Step 1 of 2
            </span>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '24px',
              fontWeight: '600',
              color: '#f0e0c0',
              marginBottom: '8px',
              marginTop: 0,
              textShadow: '0 1px 8px rgba(0,0,0,0.4)',
            }}>
              What genres do you love?
            </h2>
            <p style={{
              color: 'rgba(212,175,100,0.6)',
              fontSize: '13px',
              fontStyle: 'italic',
              marginBottom: '28px',
            }}>
              Select at least 3 — {selectedGenreIds.length} selected
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
                width: '100%',
                padding: '13px',
                background: selectedGenreIds.length >= 3
                  ? 'linear-gradient(135deg, #7a4f0d 0%, #4e3008 100%)'
                  : 'rgba(212,175,100,0.08)',
                border: '1px solid rgba(212,175,100,0.25)',
                borderRadius: '2px',
                color: selectedGenreIds.length >= 3 ? '#fff8ee' : 'rgba(212,175,100,0.25)',
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '13px',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor: selectedGenreIds.length >= 3 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <span style={{
              color: 'rgba(212,175,100,0.5)',
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '10px',
            }}>
              Step 2 of 2
            </span>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '24px',
              fontWeight: '600',
              color: '#f0e0c0',
              marginBottom: '8px',
              marginTop: 0,
              textShadow: '0 1px 8px rgba(0,0,0,0.4)',
            }}>
              Books you've already read
            </h2>
            <p style={{
              color: 'rgba(212,175,100,0.6)',
              fontSize: '13px',
              fontStyle: 'italic',
              marginBottom: '24px',
            }}>
              This helps us recommend better. You can skip this step.
            </p>

            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title or author..."
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255,245,220,0.06)',
                border: '1px solid rgba(212,175,100,0.2)',
                borderRadius: '2px',
                color: '#e8d5b0',
                fontSize: '14px',
                fontFamily: "'Lora', Georgia, serif",
                marginBottom: '16px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            {searchResults.map(book => {
              const selected = selectedBooks.find(b => b.id === book.id);
              return (
                <div key={book.id} onClick={() => toggleBook(book)} style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px',
                  border: `1px solid ${selected ? 'rgba(212,175,100,0.5)' : 'rgba(212,175,100,0.15)'}`,
                  borderRadius: '4px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  backgroundColor: selected ? 'rgba(212,175,100,0.12)' : 'rgba(255,245,220,0.04)',
                  transition: 'all 0.15s',
                }}>
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    style={{
                      width: '36px', height: '54px',
                      objectFit: 'cover', borderRadius: '2px',
                      filter: 'sepia(10%) contrast(105%) brightness(95%)',
                    }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: "'Lora', Georgia, serif",
                      fontSize: '14px',
                      color: '#e8d5b0',
                      marginBottom: '3px',
                    }}>
                      {book.title}
                    </div>
                    <div style={{
                      color: 'rgba(212,175,100,0.6)',
                      fontSize: '12px',
                      fontStyle: 'italic',
                    }}>
                      {(book.authors || []).join(', ')}
                    </div>
                  </div>
                  {selected && (
                    <span style={{ color: '#d4af37', fontSize: '16px', alignSelf: 'center' }}>✓</span>
                  )}
                </div>
              );
            })}

            {selectedBooks.length > 0 && (
              <div style={{ marginBottom: '20px', marginTop: '16px' }}>
                <span style={{
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(212,175,100,0.5)',
                  display: 'block',
                  marginBottom: '10px',
                }}>
                  Added ({selectedBooks.length})
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedBooks.map(b => (
                    <span key={b.id} style={chipStyle(true)}>{b.title}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: '13px 24px',
                  background: 'transparent',
                  border: '1px solid rgba(212,175,100,0.2)',
                  borderRadius: '2px',
                  color: 'rgba(232,213,176,0.6)',
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: '13px',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  transition: 'all 0.15s',
                }}
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '13px',
                  background: 'linear-gradient(135deg, #7a4f0d 0%, #4e3008 100%)',
                  border: '1px solid rgba(212,175,100,0.25)',
                  borderRadius: '2px',
                  color: '#fff8ee',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '13px',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.target.style.opacity = '0.85'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              >
                {loading ? 'Saving...' : 'Begin Reading'}
              </button>
              <button
                onClick={handleFinish}
                style={{
                  padding: '13px 20px',
                  background: 'transparent',
                  border: '1px solid rgba(212,175,100,0.2)',
                  borderRadius: '2px',
                  color: 'rgba(232,213,176,0.6)',
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: '13px',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  transition: 'all 0.15s',
                }}
              >
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}