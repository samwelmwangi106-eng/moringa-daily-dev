import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Bookmark, Eye, MessageSquare, LogIn, X } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

export default function ContentCard({ post, onUpdate }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.is_liked || post.isLiked || false);
  const [bookmarked, setBookmarked] = useState(post.is_bookmarked || post.isBookmarked || false);
  const [likesCount, setLikesCount] = useState(Number(post.likes_count || post.LikesCount || 0));
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Sync state cleanly when parent post prop updates
  useEffect(() => {
    setLiked(post.is_liked || post.isLiked || false);
    setBookmarked(post.is_bookmarked || post.isBookmarked || false);
    setLikesCount(Number(post.likes_count || post.LikesCount || 0));
  }, [post]);

  const defaultThumbnail = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80";
  const [thumbnailSrc, setThumbnailSrc] = useState(
    post.thumbnail_url || post.thumbnail || (post.content_url && post.content_url.startsWith('http') && !post.content_url.includes('youtube') 
      ? post.content_url 
      : defaultThumbnail)
  );

  const postId = post.id || post.content_id || post.ContentID;

  const handleCardClick = () => {
    if (postId) {
      navigate(`/content/${postId}`);
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!postId) return;

    const nextLiked = !liked;

    try {
      const token = 
        localStorage.getItem('token') || 
        localStorage.getItem('access_token') || 
        localStorage.getItem('jwt') || 
        localStorage.getItem('accessToken');

      const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ liked: nextLiked })
      });

      if (response.status === 401) {
        setShowAuthModal(true);
        return;
      }

      if (!response.ok) throw new Error('Failed to update like');

      const updatedPostFromServer = await response.json();
      const newLiked = updatedPostFromServer.is_liked ?? updatedPostFromServer.isLiked ?? nextLiked;
      const newCount = Number(updatedPostFromServer.likes_count ?? updatedPostFromServer.likesCount ?? likesCount);

      setLiked(newLiked);
      setLikesCount(newCount);

      if (onUpdate) {
        onUpdate(updatedPostFromServer);
      }
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    setBookmarked(!bookmarked);
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="bg-[#121620] border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-300 shadow-lg cursor-pointer group relative"
      >
        <div>
          {/* Media / Image Container */}
          <div className="relative aspect-video bg-slate-900 overflow-hidden">
            <img
              src={thumbnailSrc}
              alt={post.title || post.Title}
              onError={() => setThumbnailSrc(defaultThumbnail)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="text-[10px] uppercase bg-slate-950/80 backdrop-blur-md text-emerald-400 px-2.5 py-1 rounded-md font-semibold tracking-wider border border-emerald-500/20">
                {post.content_type || post.category_name || 'Article'}
              </span>
            </div>
            {post.duration && (
              <span className="absolute bottom-3 right-3 bg-black/80 text-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm">
                {post.duration} min read
              </span>
            )}
          </div>

          {/* Card Body */}
          <div className="p-5">
            {post.categories && post.categories.length > 0 && (
              <div className="flex gap-1.5 mb-2.5 flex-wrap">
                {post.categories.map((cat) => (
                  <span key={cat.id} className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                    {cat.name}
                  </span>
                ))}
              </div>
            )}

            <h3 className="text-slate-100 font-bold text-sm mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors duration-200">
              {post.title || post.Title}
            </h3>

            <p className="text-slate-400 text-xs mb-4 line-clamp-2 leading-relaxed">
              {post.summary || post.description || post.Description}
            </p>

            {/* Author & Date */}
            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-3">
              <div className="flex items-center gap-2">
                {post.author?.profile_image ? (
                  <img 
                    src={post.author.profile_image} 
                    alt={post.author.username || 'Author'} 
                    className="w-6 h-6 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    {(post.author?.username || post.author_name || 'M')?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-slate-300 font-medium">{post.author?.username || post.author_name || 'Moringa Contributor'}</span>
              </div>
              <span>{post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}</span>
            </div>
          </div>
        </div>

        {/* Footer / Hashtags & Metrics */}
        <div className="px-5 py-3 bg-[#0e121b] border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span className="text-emerald-400 text-[11px] font-mono">
            {post.hashtags ? (post.hashtags.startsWith('#') ? post.hashtags : `#${post.hashtags}`) : '#moringahub'}
          </span>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1" title="Views">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>{post.views_count || 0}</span>
            </div>

            <div className="flex items-center gap-1" title="Comments">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>{post.comments_count || 0}</span>
            </div>

            <button 
              type="button"
              onClick={handleLike} 
              className={`flex items-center gap-1 hover:text-red-400 transition ${liked ? 'text-red-500' : ''}`}
              title="Like"
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-500' : ''}`} />
              <span>{likesCount}</span>
            </button>

            <button 
              type="button"
              onClick={handleBookmark} 
              className={`hover:text-emerald-400 transition ${bookmarked ? 'text-emerald-400' : ''}`}
              title="Bookmark"
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div 
          onClick={(e) => { e.stopPropagation(); setShowAuthModal(false); }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121620] border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative"
          >
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <LogIn className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-100 mb-2">Join Moringa Hub</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              You must have an account to like posts, comment, and save your favorite tech content with the community.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  window.location.href = '/login';
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Log In / Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}