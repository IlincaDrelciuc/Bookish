import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

export default function BookDetailPage() {
  // useParams reads the :id from the URL
  const { id } = useParams();
  const { token, isLoggedIn } = useAuth();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingStatus, setAddingStatus] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiCall('GET', `/books/${id}`)
      .then(setBook)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

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

  if (loading) return <div style={{padding:'40px',textAlign:'center'}}>Loading book details...</div>;
  if (error) return <div style={{padding:'40px',color:'red'}}>Error: {error}</div>;
  if (!book) return <div style={{padding:'40px'}}>Book not found.</div>;

  return (
    <div style={{maxWidth:'900px',margin:'0 auto',padding:'32px 20px',fontFamily:'Arial,sans-serif'}}>

      {/* Top section: cover + info side by side */}
      <div style={{display:'flex',gap:'32px',marginBottom:'40px',flexWrap:'wrap'}}>

        {/* Cover Image */}
        <div style={{flexShrink:0}}>
          {book.cover_image_url ? (
            <img src={book.cover_image_url} alt={book.title}
              style={{width:'200px',borderRadius:'8px',boxShadow:'0 4px 12px rgba(0,0,0,0.15)'}}
              onError={e => { e.target.onerror=null; e.target.src=`https://covers.openlibrary.org/b/id/${book.goodbooks_id}-L.jpg`; }}
            />
          ) : (
            <div style={{width:'200px',height:'300px',backgroundColor:'#F1F5F9',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'64px'}}>📖</div>
          )}
        </div>

        {/* Book metadata */}
        <div style={{flex:1,minWidth:'250px'}}>
          <h1 style={{margin:'0 0 8px 0',fontSize:'28px',color:'#1E293B'}}>{book.title}</h1>
          <p style={{margin:'0 0 8px 0',fontSize:'18px',color:'#64748B'}}>
            by {(book.authors||[]).map(a=>a.name).join(', ')}
          </p>

          {/* Rating */}
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
            <span style={{fontSize:'22px',color:'#F59E0B'}}>
              {'★'.repeat(Math.round(book.communityRating?.average||0))}
              {'☆'.repeat(5-Math.round(book.communityRating?.average||0))}
            </span>
            <span style={{color:'#64748B'}}>
              {book.communityRating?.average?.toFixed(1) || 'No rating'} ({book.communityRating?.count || 0} ratings)
            </span>
          </div>

          {/* Genres */}
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'16px'}}>
            {(book.genres||[]).map(g => (
              <span key={g.id} style={{backgroundColor:'#EFF6FF',color:'#2563EB',padding:'4px 10px',borderRadius:'12px',fontSize:'13px'}}>{g.name}</span>
            ))}
          </div>

          {/* Metadata */}
          <div style={{color:'#64748B',fontSize:'14px',marginBottom:'20px'}}>
            {book.publication_year && <div>Published: {book.publication_year}</div>}
            {book.page_count && <div>{book.page_count} pages</div>}
          </div>

          {/* Add to Reading List Buttons */}
          {addSuccess && <div style={{color:'#15803D',fontWeight:'bold',marginBottom:'12px'}}>{addSuccess}</div>}
          <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
            {[
              {status:'to-read',label:'Want to Read',color:'#2563EB'},
              {status:'reading',label:'Currently Reading',color:'#0F766E'},
              {status:'finished',label:'Already Read',color:'#15803D'},
            ].map(({status,label,color}) => (
              <button key={status} onClick={() => addToList(status)}
                style={{padding:'10px 16px',backgroundColor:color,color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'14px',fontWeight:'bold'}}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Synopsis */}
      {book.synopsis && (
        <div style={{marginBottom:'40px'}}>
          <h2 style={{color:'#1E293B',marginBottom:'12px'}}>About this book</h2>
          <p style={{color:'#475569',lineHeight:'1.7',fontSize:'16px'}}>{book.synopsis}</p>
        </div>
      )}

      {/* Reviews */}
      <div>
        <h2 style={{color:'#1E293B',marginBottom:'16px'}}>Reader Reviews ({book.reviews?.length || 0})</h2>
        {book.reviews?.length === 0 && <p style={{color:'#94A3B8'}}>No reviews yet. Be the first to review!</p>}
        {(book.reviews||[]).map(review => (
          <div key={review.id} style={{borderBottom:'1px solid #F1F5F9',paddingBottom:'16px',marginBottom:'16px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
              <strong style={{color:'#2563EB'}}>{review.username}</strong>
              <span style={{color:'#94A3B8',fontSize:'13px'}}>{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
            {review.user_rating && <div style={{color:'#F59E0B',marginBottom:'4px'}}>{'★'.repeat(review.user_rating)}{'☆'.repeat(5-review.user_rating)}</div>}
            <p style={{margin:0,color:'#475569',lineHeight:'1.6'}}>{review.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
