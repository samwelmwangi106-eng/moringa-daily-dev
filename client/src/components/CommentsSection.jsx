import { useState, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

export default function CommentsSection({ contentId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`${API_BASE_URL}/content/${contentId}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data))
      .catch((err) => console.error('Failed to fetch comments', err));
  }, [contentId]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/content/${contentId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newComment })
      });

      if (res.ok) {
        const createdComment = await res.json();
        setComments([createdComment, ...comments]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  return (
    <div className="mt-8 bg-[#121620] border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-emerald-400" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          Discussion ({comments.length})
        </h3>
      </div>

      {token ? (
        <form onSubmit={handlePostComment} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="What are your thoughts?"
            rows="3"
            className="w-full bg-[#0b0e14] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition resize-none mb-3"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Post Comment
            </button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-slate-400 mb-6 bg-[#0b0e14] p-4 rounded-xl border border-slate-800">
          Please sign in to join the conversation.
        </p>
      )}

      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.comment_id} className="p-4 bg-[#0b0e14] border border-slate-800/80 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-400">
                  {comment.user?.username || 'Anonymous'}
                </span>
                <span className="text-[10px] text-slate-500">{comment.created_at}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{comment.text}</p>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-500 italic">No comments yet. Be the first to share your thoughts!</p>
        )}
      </div>
    </div>
  );
}