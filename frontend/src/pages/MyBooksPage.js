import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/api';

export default function MyBooksPage() {
  const [books, setBooks] = useState({ 'to-read':[], 'reading':[], 'finished':[] });
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
      // Refresh the list
      const updated = await apiCall('GET', '/reading-list', null, token);
      setBooks(updated);
    } catch (err) {
      console.error(err);
    }
  }

  async function updateProgress(bookId, currentPage) {
    try {
      await apiCall('PATCH', `/reading-list/${bookId}`, { currentPage: parseInt(currentPage) }, token);
    } catch (err) { console.error(err); }
  }

  const tabs = [
    { key:'reading', label:'Currently Reading', emoji:'📖' },
    { key:'to-read', label:'Want to Read', emoji:'🔖' },
    { key:'finished', label:'Finished', emoji:'✅' },
  ];

  const currentBooks = books[activeTab] || [];

  if (loading) return <div style={{padding:'40px',textAlign:'center'}}>Loading your books...</div>;

  return (
    <div style={{maxWidth:'900px',margin:'0 auto',padding:'32px 20px',fontFamily:'Arial,sans-serif'}}>
      <h1 style={{color:'#2563EB',marginBottom:'8px'}}>My Books</h1>

      {/* Tab navigation */}
      <div style={{display:'flex',gap:'4px',borderBottom:'2px solid #E2E8F0',marginBottom:'28px'}}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              padding:'10px 20px',border:'none',
              backgroundColor: activeTab===tab.key ? 'white' : 'transparent',
              borderBottom: activeTab===tab.key ? '2px solid #2563EB' : '2px solid transparent',
              color: activeTab===tab.key ? '#2563EB' : '#64748B',
              fontWeight: activeTab===tab.key ? 'bold' : 'normal',
              cursor:'pointer',fontSize:'15px',
              marginBottom:'-2px',
            }}>
            {tab.emoji} {tab.label} ({books[tab.key]?.length || 0})
          </button>
        ))}
      </div>

      {/* Book list */}
      {currentBooks.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px',color:'#94A3B8'}}>
          <div style={{fontSize:'48px',marginBottom:'16px'}}>📚</div>
          <p>No books here yet!</p>
          <button onClick={() => navigate('/books')} style={{padding:'10px 20px',backgroundColor:'#2563EB',color:'white',border:'none',borderRadius:'8px',cursor:'pointer'}}>
            Browse Books
          </button>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          {currentBooks.map(item => (
            <div key={item.id} style={{display:'flex',gap:'16px',padding:'16px',backgroundColor:'white',borderRadius:'12px',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>

              {/* Cover */}
              <img
                src={item.cover_image_url}
                alt={item.title}
                onClick={() => navigate(`/books/${item.book_id}`)}
                style={{width:'60px',height:'90px',objectFit:'cover',borderRadius:'4px',cursor:'pointer',flexShrink:0}}
                onError={e => {e.target.style.display='none'}}
              />

              <div style={{flex:1}}>
                <h3 onClick={() => navigate(`/books/${item.book_id}`)}
                  style={{margin:'0 0 4px 0',cursor:'pointer',color:'#1E293B'}}>
                  {item.title}
                </h3>
                <p style={{margin:'0 0 10px 0',color:'#64748B',fontSize:'14px'}}>
                  {(item.authors||[]).join(', ')}
                </p>

                {/* Progress bar for currently reading */}
                {activeTab === 'reading' && item.page_count && (
                  <div style={{marginBottom:'10px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#64748B',marginBottom:'4px'}}>
                      <span>Progress</span>
                      <span>{item.current_page || 0} / {item.page_count} pages ({Math.round(((item.current_page||0)/item.page_count)*100)}%)</span>
                    </div>
                    {/* Progress bar background */}
                    <div style={{height:'6px',backgroundColor:'#E2E8F0',borderRadius:'3px'}}>
                      {/* Progress bar fill */}
                      <div style={{
                        height:'100%',borderRadius:'3px',backgroundColor:'#2563EB',
                        width: `${Math.min(100,Math.round(((item.current_page||0)/item.page_count)*100))}%`
                      }} />
                    </div>
                    <input
                      type='number'
                      placeholder='Current page'
                      defaultValue={item.current_page || ''}
                      min={0}
                      max={item.page_count}
                      onBlur={e => updateProgress(item.book_id, e.target.value)}
                      style={{marginTop:'6px',padding:'4px 8px',border:'1px solid #D1D5DB',borderRadius:'6px',width:'120px',fontSize:'13px'}}
                    />
                  </div>
                )}

                {/* Status change buttons */}
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  {activeTab !== 'reading' && (
                    <button onClick={() => updateStatus(item.book_id, 'reading')}
                      style={{padding:'6px 12px',backgroundColor:'#0F766E',color:'white',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'13px'}}>
                      Start Reading
                    </button>
                  )}
                  {activeTab !== 'finished' && (
                    <button onClick={() => updateStatus(item.book_id, 'finished')}
                      style={{padding:'6px 12px',backgroundColor:'#15803D',color:'white',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'13px'}}>
                      Mark Finished
                    </button>
                  )}
                  {activeTab !== 'to-read' && (
                    <button onClick={() => updateStatus(item.book_id, 'to-read')}
                      style={{padding:'6px 12px',backgroundColor:'#64748B',color:'white',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'13px'}}>
                      Move to Want to Read
                    </button>
                  )}
                </div>

                {/* Date info */}
                <div style={{fontSize:'12px',color:'#94A3B8',marginTop:'8px'}}>
                  {item.start_date && <span>Started: {new Date(item.start_date).toLocaleDateString()}  </span>}
                  {item.finish_date && <span>Finished: {new Date(item.finish_date).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
