import { useNavigate } from 'react-router-dom';
export default function BookCard({ book }) {
  const navigate = useNavigate();

  // Convert decimal rating to star display
  function renderStars(rating) {
    const filled = Math.round(rating);
    return '★'.repeat(filled) + '☆'.repeat(5 - filled);
  }

  return (
    <div
      onClick={() => navigate(`/books/${book.id}`)}
      style={{
        cursor: 'pointer',
        borderRadius: '10px',
        overflow: 'hidden',
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        // Hover effect is done inline with onMouseEnter/Leave
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
    >
      {/* Book Cover */}
      <div style={{height:'200px',backgroundColor:'#F1F5F9',overflow:'hidden'}}>
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            style={{width:'100%',height:'100%',objectFit:'cover'}}
            // If image fails, try Open Library using goodbooks_id
            onError={e => {
              e.target.onerror = null; // prevent infinite loop
              e.target.src = `https://covers.openlibrary.org/b/id/${book.goodbooks_id}-M.jpg`;
            }}
          />
        ) : (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',fontSize:'48px'}}>📖</div>
        )}
      </div>

      {/* Book Info */}
      <div style={{padding:'12px'}}>
        <h3 style={{margin:'0 0 4px 0',fontSize:'14px',fontWeight:'bold',
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {book.title}
        </h3>
        <p style={{margin:'0 0 6px 0',fontSize:'13px',color:'#64748B',
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {(book.authors || []).join(', ') || 'Unknown Author'}
        </p>
        {book.average_rating && (
          <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
            <span style={{color:'#F59E0B',fontSize:'13px'}}>
              {renderStars(book.average_rating)}
            </span>
            <span style={{fontSize:'12px',color:'#94A3B8'}}>
              {parseFloat(book.average_rating).toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
