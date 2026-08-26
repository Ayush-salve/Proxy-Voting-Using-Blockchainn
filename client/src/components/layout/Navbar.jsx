import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/Badge';
import { ShieldCheck, LogOut, Wallet, User as UserIcon, Menu } from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const truncateAddress = (addr) => {
    if (!addr) return 'No Wallet Linked';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-navy-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Side: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1">
                Block<span className="text-brand-500">Proxy</span>
              </span>
              <span className="hidden sm:block text-[10px] uppercase font-mono tracking-widest text-slate-500">
                Corporate Governance
              </span>
            </div>
          </Link>
        </div>

        {/* Right Side: Wallet Status, Role & Profile Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* EVM Live Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400 font-mono text-[11px]">Hardhat Node (31337)</span>
          </div>

          {/* Wallet Address Chip */}
          {user?.walletAddress && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
              <Wallet className="w-3.5 h-3.5 text-brand-500" />
              <span>{truncateAddress(user.walletAddress)}</span>
            </div>
          )}

          {/* Role Badge */}
          {user && <RoleBadge role={user.role} />}

          {/* User Profile info */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-semibold text-white leading-tight">{user.fullName}</p>
                <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{user.email}</p>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                {user.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
