import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

export default function BookDetailPage() {
  const { id } = useParams();
  const { token, isLoggedIn } = useAuth();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addSuccess, setAddSuccess] = useState('');
  const [error, setError] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [loadingSynopsis, setLoadingSynopsis] = useState(false);

  useEffect(() => {
    apiCall('GET', `/books/${id}`)
      .then(data => {
        console.log('Book data received:', data);
        setBook(data);
        if (!data.synopsis) {
          const authorNames = (data.authors || []).map(a => a.name).join(', ');
          console.log('No synopsis found, fetching for:', data.title, authorNames);
          fetchSynopsis(data.title, authorNames);
        } else {
          console.log('Synopsis found in database:', data.synopsis);
          setSynopsis(data.synopsis);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function fetchSynopsis(title, authors) {
    console.log('fetchSynopsis called with:', title, authors);
    console.log('token available:', !!token);
    setLoadingSynopsis(true);
    try {
      const data = await apiCall('POST', '/synopsis', { title, authors }, token);
      console.log('synopsis response:', data);
      if (data.synopsis) setSynopsis(data.synopsis);
    } catch (err) {
      console.error('Synopsis fetch failed:', err);
    } finally {
      setLoadingSynopsis(false);
    }
  }

  async function addToList(status) {
    if (!isLoggedIn) { setError('Please log in to add books.'); return; }
    try {
      await apiCall('POST', '/reading-list', { bookId: parseInt(id), status }, token);
      setAddSuccess(`Added to your ${status} list!`);
      setTimeout(() => setAddSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitReview() {
    if (!reviewText.trim()) return;
    setReviewSubmitting(true);
    try {
      await apiCall('POST', '/reviews', {
        bookId: parseInt(id),
        body: reviewText,
        score: reviewScore,
      }, token);
      setReviewSuccess('Review submitted!');
      setReviewText('');
      const updated = await apiCall('GET', `/books/${id}`);
      setBook(updated);
      setTimeout(() => setReviewSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setReviewSubmitting(false); }
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f5ead6 0%, #ede0c4 50%, #e8d5b0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Lora', Georgia, serif",
      color: '#8b6530', fontStyle: 'italic',
    }}>
      Loading book details...
    </div>
  );

  if (error) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f5ead6 0%, #ede0c4 50%, #e8d5b0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Lora', Georgia, serif", color: '#8b3030',
    }}>
      {error}
    </div>
  );

  if (!book) return null;

  const avgRating = book.communityRating?.average || 0;
  const ratingCount = book.communityRating?.count || 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f5ead6 0%, #ede0c4 50%, #e8d5b0 100%)',
      fontFamily: "'Lora', Georgia, serif",
      paddingBottom: '80px',
    }}>

      <div style={{
        borderBottom: '1px solid rgba(139,101,48,0.15)',
        padding: '40px 48px 32px',
      }}>
        <p style={{
          fontSize: '13px', color: '#8b6530',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          margin: 0, marginBottom: '8px',
        }}>Book Details</p>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '32px', fontWeight: '700',
          color: '#2c1a06', margin: 0, lineHeight: 1.2,
        }}>{book.title}</h1>
        <p style={{
          fontSize: '16px', color: '#8b6530',
          fontStyle: 'italic', margin: '8px 0 0',
        }}>
          by {(book.authors || []).map(a => a.name).join(', ')}
        </p>
      </div>

      <div style={{ padding: '40px 48px' }}>

        <div style={{ display: 'flex', gap: '48px', marginBottom: '48px', flexWrap: 'wrap' }}>

          <div style={{ flexShrink: 0 }}>
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={book.title}
                style={{
                  width: '200px', borderRadius: '3px',
                  boxShadow: '0 8px 32px rgba(139,101,48,0.25)',
                  border: '1px solid rgba(139,101,48,0.2)',
                  display: 'block',
                }}
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = `https://covers.openlibrary.org/b/id/${book.goodbooks_id}-L.jpg`;
                }}
              />
            ) : (
              <div style={{
                width: '200px', height: '300px',
                background: 'rgba(139,101,48,0.08)',
                borderRadius: '3px', border: '1px solid rgba(139,101,48,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '64px',
              }}>📖</div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: '250px' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px', color: '#8b6914', letterSpacing: '2px' }}>
                {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
              </span>
              <span style={{ fontSize: '13px', color: '#a07840', fontStyle: 'italic' }}>
                {avgRating.toFixed(1)} · {ratingCount.toLocaleString()} ratings
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
              {(book.genres || []).map(g => (
                <span key={g.id} style={{
                  background: 'rgba(139,101,48,0.1)',
                  color: '#6b4c1a', padding: '4px 12px',
                  borderRadius: '2px', fontSize: '12px',
                  border: '1px solid rgba(139,101,48,0.2)',
                  fontFamily: "'Lora', Georgia, serif",
                  letterSpacing: '0.04em',
                }}>{g.name}</span>
              ))}
            </div>

            <div style={{
              fontSize: '13px', color: '#a07840',
              marginBottom: '28px', lineHeight: 2, fontStyle: 'italic',
            }}>
              {book.publication_year && <div>Published {book.publication_year}</div>}
              {book.page_count && <div>{book.page_count} pages</div>}
            </div>

            {addSuccess && (
              <div style={{
                color: '#5a7a3a', fontSize: '13px',
                fontStyle: 'italic', marginBottom: '12px',
              }}>{addSuccess}</div>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { status: 'to-read', label: 'Want to Read' },
                { status: 'reading', label: 'Reading Now' },
                { status: 'finished', label: 'Already Read' },
              ].map(({ status, label }) => (
                <button
                  key={status}
                  onClick={() => addToList(status)}
                  style={{
                    padding: '9px 18px',
                    background: status === 'finished'
                      ? 'linear-gradient(135deg, #8b6914 0%, #6b4f10 100%)'
                      : 'transparent',
                    border: '1px solid rgba(139,101,48,0.35)',
                    borderRadius: '2px',
                    color: status === 'finished' ? '#fff8ee' : '#6b4c1a',
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: '13px',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (status !== 'finished') {
                      e.target.style.background = 'rgba(139,101,48,0.08)';
                      e.target.style.borderColor = 'rgba(139,101,48,0.6)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (status !== 'finished') {
                      e.target.style.background = 'transparent';
                      e.target.style.borderColor = 'rgba(139,101,48,0.35)';
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(139,101,48,0.15)', marginBottom: '40px' }} />

        <div style={{ marginBottom: '48px', maxWidth: '720px' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '20px', fontWeight: '600',
            color: '#2c1a06', marginTop: 0, marginBottom: '16px',
          }}>About this book</h2>
          {loadingSynopsis ? (
            <p style={{ color: '#a07840', fontStyle: 'italic', fontSize: '14px' }}>
              Generating description...
            </p>
          ) : synopsis ? (
            <p style={{
              color: '#4a3010', lineHeight: '1.9',
              fontSize: '15px', fontStyle: 'italic', margin: 0,
            }}>{synopsis}</p>
          ) : (
            <p style={{ color: '#a07840', fontStyle: 'italic', fontSize: '14px' }}>
              No description available.
            </p>
          )}
        </div>

        <div style={{ height: '1px', background: 'rgba(139,101,48,0.15)', marginBottom: '40px' }} />

        <div style={{ maxWidth: '720px' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '20px', fontWeight: '600',
            color: '#2c1a06', marginTop: 0, marginBottom: '24px',
          }}>
            Reader Reviews
            <span style={{
              fontSize: '14px', fontWeight: '400',
              color: '#a07840', marginLeft: '10px', fontStyle: 'italic',
            }}>
              {book.reviews?.length || 0} reviews
            </span>
          </h2>

          <div style={{
            background: 'rgba(255,250,240,0.7)',
            border: '1px solid rgba(139,101,48,0.2)',
            borderRadius: '3px', padding: '24px', marginBottom: '32px',
          }}>
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '16px', color: '#2c1a06',
              marginTop: 0, marginBottom: '16px',
            }}>Write a Review</h3>

            <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setReviewScore(n)} style={{
                  fontSize: '22px', border: 'none', background: 'none',
                  cursor: 'pointer', padding: '0 2px',
                  color: n <= reviewScore ? '#8b6914' : 'rgba(139,101,48,0.2)',
                  transition: 'color 0.15s',
                }}>★</button>
              ))}
            </div>

            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Share your thoughts about this book..."
              rows={4}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'rgba(255,250,240,0.8)',
                border: '1px solid rgba(139,101,48,0.25)',
                borderRadius: '2px', color: '#2c1a06',
                fontFamily: "'Lora', Georgia, serif",
                fontSize: '14px', lineHeight: '1.6',
                boxSizing: 'border-box', resize: 'vertical', outline: 'none',
              }}
            />

            {reviewSuccess && (
              <p style={{ color: '#5a7a3a', fontSize: '13px', fontStyle: 'italic', margin: '8px 0 0' }}>
                {reviewSuccess}
              </p>
            )}

            <button
              onClick={submitReview}
              disabled={reviewSubmitting || !reviewText.trim()}
              style={{
                marginTop: '12px', padding: '10px 24px',
                background: reviewText.trim()
                  ? 'linear-gradient(135deg, #8b6914 0%, #6b4f10 100%)'
                  : 'rgba(139,101,48,0.1)',
                border: '1px solid rgba(139,101,48,0.3)',
                borderRadius: '2px',
                color: reviewText.trim() ? '#fff8ee' : 'rgba(139,101,48,0.3)',
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '13px', fontWeight: '600',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: reviewText.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>

          {book.reviews?.length === 0 && (
            <p style={{ color: '#a07840', fontStyle: 'italic', fontSize: '14px' }}>
              No reviews yet. Be the first to share your thoughts.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(book.reviews || []).map((review, i) => (
              <div key={review.id} style={{
                padding: '20px 0',
                borderBottom: i < book.reviews.length - 1
                  ? '1px solid rgba(139,101,48,0.12)' : 'none',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginBottom: '8px', alignItems: 'center',
                }}>
                  <span style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '14px', fontWeight: '600', color: '#2c1a06',
                  }}>{review.username}</span>
                  <span style={{ fontSize: '12px', color: '#a07840', fontStyle: 'italic' }}>
                    {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {review.user_rating && (
                  <div style={{ color: '#8b6914', fontSize: '14px', marginBottom: '8px', letterSpacing: '2px' }}>
                    {'★'.repeat(review.user_rating)}{'☆'.repeat(5 - review.user_rating)}
                  </div>
                )}
                <p style={{ margin: 0, color: '#4a3010', lineHeight: '1.7', fontSize: '14px' }}>
                  {review.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}