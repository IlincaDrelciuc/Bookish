import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

export default function MyBooksPage() {
  const [books, setBooks] = useState({ 'to-read': [], 'reading': [], 'finished': [] });
  const [activeTab, setActiveTab] = useState('reading');
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    apiCall('GET', '/reading-list', null, token)
      .then(setBooks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  async function updateStatus(bookId, newStatus) {
    try {
      await apiCall('PATCH', `/reading-list/${bookId}`, { status: newStatus }, token);
      const updated = await apiCall('GET', '/reading-list', null, token);
      setBooks(updated);
    } catch (err) { console.error(err); }
  }

  async function updateProgress(bookId, currentPage) {
    try {
      await apiCall('PATCH', `/reading-list/${bookId}`, { currentPage: parseInt(currentPage) }, token);
    } catch (err) { console.error(err); }
  }

  const tabs = [
    { key: 'reading', label: 'Currently Reading' },
    { key: 'to-read', label: 'Want to Read' },
    { key: 'finished', label: 'Finished' },
  ];

  const currentBooks = books[activeTab] || [];

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f5ead6 0%, #ede0c4 50%, #e8d5b0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Lora', Georgia, serif",
      color: '#8b6530',
      fontStyle: 'italic',
    }}>
      Loading your books...
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f5ead6 0%, #ede0c4 50%, #e8d5b0 100%)',
      fontFamily: "'Lora', Georgia, serif",
      paddingBottom: '60px',
    }}>

      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(139,101,48,0.2)',
        padding: '40px 48px 32px',
      }}>
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: '13px',
          color: '#8b6530',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          margin: 0,
          marginBottom: '8px',
        }}>Your Collection</p>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '36px',
          fontWeight: '700',
          color: '#2c1a06',
          margin: 0,
        }}>My Books</h1>
      </div>

      <div style={{ padding: '0 48px' }}>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(139,101,48,0.2)',
          marginBottom: '36px',
          marginTop: '32px',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderBottom: activeTab === tab.key
                  ? '2px solid #8b6914'
                  : '2px solid transparent',
                background: 'transparent',
                color: activeTab === tab.key ? '#2c1a06' : '#a07840',
                fontFamily: "'Lora', Georgia, serif",
                fontSize: '13px',
                fontWeight: activeTab === tab.key ? '600' : '400',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
              <span style={{
                marginLeft: '8px',
                fontSize: '11px',
                color: activeTab === tab.key ? '#8b6914' : 'rgba(139,101,48,0.4)',
              }}>
                {books[tab.key]?.length || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Empty state */}
        {currentBooks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
          }}>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '18px',
              color: 'rgba(139,101,48,0.5)',
              fontStyle: 'italic',
              marginBottom: '24px',
            }}>
              No books here yet
            </div>
            <button
              onClick={() => navigate('/books')}
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #8b6914 0%, #6b4f10 100%)',
                border: '1px solid rgba(139,105,20,0.3)',
                borderRadius: '2px',
                color: '#fff8ee',
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '13px',
                fontWeight: '600',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Browse Books
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentBooks.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                gap: '20px',
                padding: '20px',
                background: 'rgba(255,250,240,0.7)',
                border: '1px solid rgba(139,101,48,0.15)',
                borderRadius: '3px',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(139,101,48,0.35)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(139,101,48,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(139,101,48,0.15)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Cover */}
                <div style={{
                  flexShrink: 0,
                  width: '64px',
                  height: '96px',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  border: '1px solid rgba(139,101,48,0.2)',
                  cursor: 'pointer',
                }}
                  onClick={() => navigate(`/books/${item.book_id}`)}
                >
                  <img
                    src={item.cover_image_url}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => {
                      e.target.style.display = 'none';
                      e.target.parentNode.style.background = 'rgba(139,101,48,0.08)';
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <h3
                    onClick={() => navigate(`/books/${item.book_id}`)}
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: '17px',
                      fontWeight: '600',
                      color: '#2c1a06',
                      margin: 0,
                      marginBottom: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {item.title}
                  </h3>
                  <p style={{
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: '13px',
                    color: '#8b6530',
                    fontStyle: 'italic',
                    margin: 0,
                    marginBottom: '14px',
                  }}>
                    {(item.authors || []).join(', ')}
                  </p>

                  {/* Progress bar for currently reading */}
                  {activeTab === 'reading' && item.page_count && (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: '#a07840',
                        letterSpacing: '0.06em',
                        marginBottom: '6px',
                      }}>
                        <span>PROGRESS</span>
                        <span>{item.current_page || 0} / {item.page_count} pages · {Math.round(((item.current_page || 0) / item.page_count) * 100)}%</span>
                      </div>
                      <div style={{
                        height: '3px',
                        background: 'rgba(139,101,48,0.15)',
                        borderRadius: '2px',
                        marginBottom: '8px',
                      }}>
                        <div style={{
                          height: '100%',
                          borderRadius: '2px',
                          background: 'linear-gradient(90deg, #8b6914, #d4a54a)',
                          width: `${Math.min(100, Math.round(((item.current_page || 0) / item.page_count) * 100))}%`,
                          transition: 'width 0.3s',
                        }} />
                      </div>
                      <input
                        type="number"
                        placeholder="Update page"
                        defaultValue={item.current_page || ''}
                        min={0}
                        max={item.page_count}
                        onBlur={e => updateProgress(item.book_id, e.target.value)}
                        style={{
                          padding: '5px 10px',
                          background: 'rgba(255,250,240,0.8)',
                          border: '1px solid rgba(139,101,48,0.25)',
                          borderRadius: '2px',
                          color: '#2c1a06',
                          fontFamily: "'Lora', Georgia, serif",
                          fontSize: '12px',
                          width: '130px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {activeTab !== 'reading' && (
                      <button
                        onClick={() => updateStatus(item.book_id, 'reading')}
                        style={{
                          padding: '6px 14px',
                          background: 'transparent',
                          border: '1px solid rgba(139,101,48,0.35)',
                          borderRadius: '2px',
                          color: '#6b4c1a',
                          fontFamily: "'Lora', Georgia, serif",
                          fontSize: '12px',
                          cursor: 'pointer',
                          letterSpacing: '0.04em',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.target.style.background = 'rgba(139,101,48,0.08)';
                          e.target.style.borderColor = 'rgba(139,101,48,0.6)';
                        }}
                        onMouseLeave={e => {
                          e.target.style.background = 'transparent';
                          e.target.style.borderColor = 'rgba(139,101,48,0.35)';
                        }}
                      >
                        Start Reading
                      </button>
                    )}
                    {activeTab !== 'finished' && (
                      <button
                        onClick={() => updateStatus(item.book_id, 'finished')}
                        style={{
                          padding: '6px 14px',
                          background: 'linear-gradient(135deg, #8b6914 0%, #6b4f10 100%)',
                          border: '1px solid rgba(139,105,20,0.3)',
                          borderRadius: '2px',
                          color: '#fff8ee',
                          fontFamily: "'Lora', Georgia, serif",
                          fontSize: '12px',
                          cursor: 'pointer',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Mark Finished
                      </button>
                    )}
                    {activeTab !== 'to-read' && (
                      <button
                        onClick={() => updateStatus(item.book_id, 'to-read')}
                        style={{
                          padding: '6px 14px',
                          background: 'transparent',
                          border: '1px solid rgba(139,101,48,0.2)',
                          borderRadius: '2px',
                          color: '#a07840',
                          fontFamily: "'Lora', Georgia, serif",
                          fontSize: '12px',
                          cursor: 'pointer',
                          letterSpacing: '0.04em',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.target.style.background = 'rgba(139,101,48,0.06)';
                          e.target.style.borderColor = 'rgba(139,101,48,0.4)';
                        }}
                        onMouseLeave={e => {
                          e.target.style.background = 'transparent';
                          e.target.style.borderColor = 'rgba(139,101,48,0.2)';
                        }}
                      >
                        Want to Read
                      </button>
                    )}
                  </div>

                  {/* Dates */}
                  {(item.start_date || item.finish_date) && (
                    <div style={{
                      fontSize: '11px',
                      color: 'rgba(139,101,48,0.5)',
                      marginTop: '10px',
                      fontStyle: 'italic',
                      letterSpacing: '0.03em',
                    }}>
                      {item.start_date && <span>Started {new Date(item.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}  </span>}
                      {item.finish_date && <span>· Finished {new Date(item.finish_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}