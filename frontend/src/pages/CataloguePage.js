import { useState, useEffect } from 'react';
import BookCard from '../components/BookCard';
import { apiCall } from '../utils/api';

export default function CataloguePage() {
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [minRating, setMinRating] = useState('');
  const [genres, setGenres] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load genres for filter dropdown
  useEffect(() => {
    apiCall('GET', '/onboarding/genres').then(setGenres).catch(console.error);
  }, []);

  // Load books when page changes (and no search active)
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

  // Handle search with debounce
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

  return (
    <div style={{maxWidth:'1200px',margin:'0 auto',padding:'24px',fontFamily:'Arial,sans-serif'}}>
      <h1 style={{color:'#2563EB',marginBottom:'24px'}}>Browse Books</h1>

      {/* Search and Filter Bar */}
      <div style={{display:'flex',gap:'12px',marginBottom:'24px',flexWrap:'wrap'}}>
        <input
          type='text'
          placeholder='Search by title or author...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{flex:1,minWidth:'200px',padding:'10px 14px',border:'1px solid #D1D5DB',borderRadius:'8px',fontSize:'15px'}}
        />
        <select
          value={selectedGenre}
          onChange={e => setSelectedGenre(e.target.value)}
          style={{padding:'10px 14px',border:'1px solid #D1D5DB',borderRadius:'8px',fontSize:'15px'}}
        >
          <option value=''>All Genres</option>
          {genres.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
        </select>
        <select
          value={minRating}
          onChange={e => setMinRating(e.target.value)}
          style={{padding:'10px 14px',border:'1px solid #D1D5DB',borderRadius:'8px',fontSize:'15px'}}
        >
          <option value=''>Any Rating</option>
          <option value='3'>3+ Stars</option>
          <option value='3.5'>3.5+ Stars</option>
          <option value='4'>4+ Stars</option>
          <option value='4.5'>4.5+ Stars</option>
        </select>
        {(searchQuery || selectedGenre || minRating) && (
          <button onClick={() => { setSearchQuery(''); setSelectedGenre(''); setMinRating(''); setIsSearching(false); }}
            style={{padding:'10px 14px',border:'1px solid #D1D5DB',borderRadius:'8px',backgroundColor:'white',cursor:'pointer'}}>
            Clear filters
          </button>
        )}
      </div>

      {/* Book Grid */}
      {loading ? (
        <div style={{textAlign:'center',padding:'60px',color:'#64748B'}}>Loading books...</div>
      ) : (
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'20px',marginBottom:'32px'}}>
            {books.map(book => <BookCard key={book.id} book={book} />)}
          </div>

          {/* Pagination (only when not searching) */}
          {!isSearching && pagination.totalPages > 1 && (
            <div style={{display:'flex',justifyContent:'center',gap:'12px',alignItems:'center'}}>
              <button
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={!pagination.hasPrevPage}
                style={{padding:'8px 16px',border:'1px solid #D1D5DB',borderRadius:'6px',cursor: pagination.hasPrevPage?'pointer':'not-allowed',backgroundColor:'white'}}
              >← Previous</button>
              <span style={{color:'#64748B'}}>Page {pagination.page} of {pagination.totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={!pagination.hasNextPage}
                style={{padding:'8px 16px',border:'1px solid #D1D5DB',borderRadius:'6px',cursor: pagination.hasNextPage?'pointer':'not-allowed',backgroundColor:'white'}}
              >Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
