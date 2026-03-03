import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

const BG_IMAGE = 'https://images.unsplash.com/photo-1507842217343-583bb7270b66';

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
    padding: '9px 20px',
    borderRadius: '2px',
    border: `1px solid ${selected ? '#8b6914' : 'rgba(100,70,20,0.25)'}`,
    backgroundColor: selected ? 'rgba(139,105,20,0.15)' : 'rgba(255,250,240,0.6)',
    color: selected ? '#5c3d0a' : '#6b4c1a',
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
      background: '#0f0a06',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#e09090',
      fontFamily: "'Lora', Georgia, serif",
    }}>
      Error: {error}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url(${BG_IMAGE})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: "'Lora', Georgia, serif",
      position: 'relative',
    }}>

      {/* Dark overlay over photo */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,6,2,0.55)',
        zIndex: 0,
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '640px',
        width: '100%',
        background: 'rgba(255,248,230,0.97)',
        border: '1px solid rgba(180,140,60,0.3)',
        borderRadius: '4px',
        padding: '56px 52px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}>

        <div style={{ marginBottom: '40px' }}>
          <span style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '26px',
            fontWeight: '700',
            color: '#2c1a06',
            letterSpacing: '0.02em',
            display: 'block',
            marginBottom: '6px',
          }}>
            Bookish
          </span>
          <p style={{
            color: '#8b6530',
            fontSize: '13px',
            fontStyle: 'italic',
            marginBottom: '28px',
          }}>
            Let's personalise your reading experience
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                height: '2px',
                flex: 1,
                borderRadius: '1px',
                backgroundColor: step >= s ? '#8b6914' : 'rgba(139,105,20,0.2)',
                transition: 'background-color 0.3s',
              }} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div>
            <span style={{
              color: '#8b6530',
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
              color: '#2c1a06',
              marginBottom: '8px',
              marginTop: 0,
            }}>
              What genres do you love?
            </h2>
            <p style={{
              color: '#8b6530',
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
                  ? 'linear-gradient(135deg, #8b6914 0%, #6b4f10 100%)'
                  : 'rgba(139,105,20,0.1)',
                border: '1px solid rgba(139,105,20,0.3)',
                borderRadius: '2px',
                color: selectedGenreIds.length >= 3 ? '#fff8ee' : 'rgba(100,70,20,0.3)',
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
              color: '#8b6530',
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
              color: '#2c1a06',
              marginBottom: '8px',
              marginTop: 0,
            }}>
              Books you've already read
            </h2>
            <p style={{
              color: '#8b6530',
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
                background: 'rgba(255,250,240,0.8)',
                border: '1px solid rgba(139,105,20,0.3)',
                borderRadius: '2px',
                color: '#2c1a06',
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
                  border: `1px solid ${selected ? '#8b6914' : 'rgba(139,105,20,0.2)'}`,
                  borderRadius: '2px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  backgroundColor: selected ? 'rgba(139,105,20,0.1)' : 'rgba(255,250,240,0.6)',
                  transition: 'all 0.15s',
                }}>
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    style={{ width: '36px', height: '54px', objectFit: 'cover', borderRadius: '1px' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: "'Lora', Georgia, serif",
                      fontSize: '14px',
                      color: '#2c1a06',
                      marginBottom: '3px',
                    }}>
                      {book.title}
                    </div>
                    <div style={{
                      color: '#8b6530',
                      fontSize: '12px',
                      fontStyle: 'italic',
                    }}>
                      {(book.authors || []).join(', ')}
                    </div>
                  </div>
                  {selected && (
                    <span style={{ color: '#8b6914', fontSize: '16px', alignSelf: 'center' }}>✓</span>
                  )}
                </div>
              );
            })}

            {selectedBooks.length > 0 && (
              <div style={{ marginBottom: '20px', marginTop: '8px' }}>
                <span style={{
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#8b6530',
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
                  border: '1px solid rgba(139,105,20,0.3)',
                  borderRadius: '2px',
                  color: '#8b6530',
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: '13px',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
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
                  background: 'linear-gradient(135deg, #8b6914 0%, #6b4f10 100%)',
                  border: '1px solid rgba(139,105,20,0.3)',
                  borderRadius: '2px',
                  color: '#fff8ee',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '13px',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {loading ? 'Saving...' : 'Begin Reading'}
              </button>
              <button
                onClick={handleFinish}
                style={{
                  padding: '13px 20px',
                  background: 'transparent',
                  border: '1px solid rgba(139,105,20,0.3)',
                  borderRadius: '2px',
                  color: '#8b6530',
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: '13px',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
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