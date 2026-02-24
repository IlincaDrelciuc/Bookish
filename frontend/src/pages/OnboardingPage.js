import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

export default function OnboardingPage() {
  const [step, setStep] = useState(1); // 1 = genres, 2 = prior books
  const [genres, setGenres] = useState([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { token } = useAuth();
  const navigate = useNavigate();

  // Load genres when component first appears
  useEffect(() => {
    apiCall('GET', '/onboarding/genres')
      .then(data => setGenres(data))
      .catch(err => setError(err.message));
  }, []);

  // Toggle a genre selected/deselected
  function toggleGenre(genreId) {
    setSelectedGenreIds(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId) // remove if already selected
        : [...prev, genreId]                // add if not selected
    );
  }

  // Search for books as user types
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    // Wait 400ms after user stops typing before searching
    const timer = setTimeout(async () => {
      try {
        const data = await apiCall('GET', `/books/search?query=${encodeURIComponent(searchQuery)}&limit=8`);
        setSearchResults(data);
      } catch (err) {
        console.error(err);
      }
    }, 400);
    return () => clearTimeout(timer); // cleanup timer
  }, [searchQuery]);

  // Toggle a book selected/deselected
  function toggleBook(book) {
    setSelectedBooks(prev =>
      prev.find(b => b.id === book.id)
        ? prev.filter(b => b.id !== book.id)
        : [...prev, book]
    );
  }

  // Submit the completed quiz
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

  if (error) return <div style={{padding:'20px',color:'red'}}>Error: {error}</div>;

  return (
    <div style={{maxWidth:'700px',margin:'0 auto',padding:'40px 20px',fontFamily:'Arial,sans-serif'}}>
      <h1 style={{color:'#2563EB'}}>📚 Welcome to Bookish!</h1>
      <p style={{color:'#64748B'}}>Let's personalise your experience. This takes less than 2 minutes.</p>

      {/* Progress indicator */}
      <div style={{display:'flex',gap:'8px',marginBottom:'32px'}}>
        {[1,2].map(s => (
          <div key={s} style={{
            height:'4px',flex:1,borderRadius:'2px',
            backgroundColor: step >= s ? '#2563EB' : '#E2E8F0'
          }} />
        ))}
      </div>

      {/* STEP 1: Genre Selection */}
      {step === 1 && (
        <div>
          <h2>Step 1: What genres do you love?</h2>
          <p style={{color:'#64748B'}}>Select at least 3 genres. ({selectedGenreIds.length} selected)</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:'10px',marginBottom:'24px'}}>
            {genres.map(genre => (
              <button
                key={genre.id}
                onClick={() => toggleGenre(genre.id)}
                style={{
                  padding:'10px 18px',
                  borderRadius:'20px',
                  border: selectedGenreIds.includes(genre.id) ? '2px solid #2563EB' : '2px solid #E2E8F0',
                  backgroundColor: selectedGenreIds.includes(genre.id) ? '#EFF6FF' : 'white',
                  color: selectedGenreIds.includes(genre.id) ? '#2563EB' : '#374151',
                  fontWeight: selectedGenreIds.includes(genre.id) ? 'bold' : 'normal',
                  cursor:'pointer',
                  fontSize:'15px',
                }}
              >
                {genre.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={selectedGenreIds.length < 3}
            style={{
              padding:'12px 28px',backgroundColor: selectedGenreIds.length >= 3 ? '#2563EB' : '#CBD5E1',
              color:'white',border:'none',borderRadius:'8px',fontSize:'16px',cursor: selectedGenreIds.length >= 3 ? 'pointer' : 'not-allowed'
            }}
          >
            Continue →
          </button>
        </div>
      )}

      {/* STEP 2: Prior Reading */}
      {step === 2 && (
        <div>
          <h2>Step 2: Any books you've already read?</h2>
          <p style={{color:'#64748B'}}>This helps us recommend better. You can skip this step.</p>
          <input
            type='text'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder='Search by title or author...'
            style={{width:'100%',padding:'12px',border:'1px solid #D1D5DB',borderRadius:'8px',fontSize:'16px',boxSizing:'border-box',marginBottom:'12px'}}
          />
          {searchResults.map(book => (
            <div key={book.id} onClick={() => toggleBook(book)} style={{
              display:'flex',gap:'12px',padding:'10px',border:'1px solid #E2E8F0',borderRadius:'8px',
              marginBottom:'8px',cursor:'pointer',
              backgroundColor: selectedBooks.find(b=>b.id===book.id) ? '#EFF6FF' : 'white'
            }}>
              <img src={book.cover_image_url} alt={book.title} style={{width:'40px',height:'60px',objectFit:'cover'}}
                onError={e=>{e.target.style.display='none'}} />
              <div>
                <div style={{fontWeight:'bold'}}>{book.title}</div>
                <div style={{color:'#64748B',fontSize:'14px'}}>{(book.authors||[]).join(', ')}</div>
                {selectedBooks.find(b=>b.id===book.id) && <div style={{color:'#2563EB',fontSize:'13px'}}>✓ Added</div>}
              </div>
            </div>
          ))}
          {selectedBooks.length > 0 && (
            <div style={{marginBottom:'16px'}}>
              <strong>Books you've read ({selectedBooks.length}):</strong>
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginTop:'8px'}}>
                {selectedBooks.map(b=>(<span key={b.id} style={{backgroundColor:'#EFF6FF',color:'#2563EB',padding:'4px 10px',borderRadius:'12px',fontSize:'13px'}}>{b.title}</span>))}
              </div>
            </div>
          )}
          <div style={{display:'flex',gap:'12px',marginTop:'16px'}}>
            <button onClick={handleFinish} disabled={loading} style={{padding:'12px 28px',backgroundColor:'#2563EB',color:'white',border:'none',borderRadius:'8px',fontSize:'16px',cursor:'pointer'}}>
              {loading ? 'Saving...' : 'Finish Setup →'}
            </button>
            <button onClick={handleFinish} style={{padding:'12px 28px',backgroundColor:'white',color:'#64748B',border:'1px solid #D1D5DB',borderRadius:'8px',fontSize:'16px',cursor:'pointer'}}>
              Skip for now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
