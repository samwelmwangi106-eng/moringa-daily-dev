import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Bell, ShieldCheck, LogOut, User, Bookmark, Plus } from "lucide-react";
import { getCurrentUser } from "../services/authApi";
import { API_BASE_URL } from "../services/api";

export default function Navbar({ searchQuery, setSearchQuery }) {
  const navigate = useNavigate();
  // Support both "token" and "access_token" from local storage
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");

  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    name: "",
    email: "",
    role: "",
    profileImage: null
  });

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notificationRef = useRef(null);
  const profileMenuRef = useRef(null);

  const unreadCount = notifications.length;

  // Modern chime sound using Web Audio API when new notifications arrive
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); 
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.log("Audio play prevented:", e);
    }
  };

  // Fetch notifications from the backend API
  const fetchNotifications = async (isPolling = false) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (isPolling && Array.isArray(data) && data.length > notifications.length) {
          playNotificationSound();
        }
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Fetch current user details & admin status on mount
  useEffect(() => {
    if (!token) return;

    getCurrentUser(token)
      .then(data => {
        if (data) {
          const isUserAdmin = data.is_admin || (data.role && data.role.toLowerCase() === 'admin');
          setIsAdmin(isUserAdmin);
          setCurrentUser({
            name: data.username || data.name || "",
            email: data.email || "",
            role: data.role || (isUserAdmin ? "Admin" : "User"),
            profileImage: data.profile_image || data.profileImage || null
          });
        }
      })
      .catch(err => console.error("Error fetching user info:", err));

    fetchNotifications(false);
    const interval = setInterval(() => fetchNotifications(true), 15000);
    return () => clearInterval(interval);
  }, [token]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setIsAdmin(false);
    setCurrentUser({ name: "", email: "", role: "", profileImage: null });
    navigate("/login");
  };

  return (
    <header className="h-16 bg-[#0b0e14] border-b border-slate-800 px-6 grid grid-cols-3 items-center sticky top-0 z-30 select-none">
      {/* Left Column: Logo / Brand & Admin Badge */}
      <div className="flex items-center gap-3">
        <Link to="/" className="font-bold text-slate-100 text-sm tracking-wide hover:text-emerald-400 transition">
          Moringa Daily<span className="text-emerald-500">.dev</span>
        </Link>
        
        {token && isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-emerald-500/20 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin Dashboard
          </Link>
        )}
      </div>

      {/* Center Column: Search Bar */}
      <div className="w-full max-w-md justify-self-center">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search articles, videos, topics..."
            value={searchQuery || ""}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition shadow-inner"
          />
        </div>
      </div>

      {/* Right Column: Write Button, Notifications & Profile Dropdown Menu */}
      <div className="flex items-center justify-end gap-3">
        {token && (
          <>
            <Link
              to="/create"
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Write
            </Link>

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="relative p-2 text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800 rounded-xl transition cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#121620] border border-slate-800 rounded-2xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Notifications</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                      {notifications.length} total
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/50">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id || n.NotificationID} className="p-3 text-xs hover:bg-slate-800/40 transition cursor-pointer">
                          <p className="text-slate-200 leading-relaxed mb-1">{n.message || n.Message}</p>
                          <span className="text-[10px] text-slate-500 font-mono">{n.created_at || n.CreatedAt}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Dropdown Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center focus:outline-none group"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-700 group-hover:border-emerald-500 transition">
                  {currentUser.profileImage ? (
                    <img src={currentUser.profileImage} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-emerald-400 font-bold text-xs">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[#121620] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                  {/* User Info Header */}
                  <div className="px-4 py-3.5 border-b border-slate-800">
                    <p className="text-sm font-bold text-white truncate">{currentUser.name || "User"}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                    {currentUser.role && (
                      <span className="inline-block text-[11px] font-mono text-emerald-400 mt-1 uppercase tracking-wide">
                        {currentUser.role}
                      </span>
                    )}
                  </div>

                  {/* Navigation Links */}
                  <div className="py-1 border-b border-slate-800">
                    <Link 
                      to="/profile" 
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                    >
                      <User className="w-4 h-4 mr-2.5 text-slate-400" />
                      My Profile
                    </Link>
                    <Link 
                      to="/saved" 
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                    >
                      <Bookmark className="w-4 h-4 mr-2.5 text-slate-400" />
                      Saved Content
                    </Link>
                  </div>

                  {/* Sign Out Action */}
                  <div className="py-1">
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition font-medium cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2.5" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {!token && (
          <button
            onClick={() => navigate("/login")}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-500/10 cursor-pointer"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}