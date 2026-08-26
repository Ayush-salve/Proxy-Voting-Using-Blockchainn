import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Vote,
  UserCheck,
  History,
  ShieldAlert,
  Search,
  Activity,
  BarChart3,
  Layers,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role;

  const getNavLinks = () => {
    switch (role) {
      case 'COMPANY_ADMIN':
        return [
          { name: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Shareholders & Shares', path: '/admin/shareholders', icon: Users },
          { name: 'Meetings & AGMs', path: '/admin/meetings', icon: Calendar },
          { name: 'Proposals & Resolutions', path: '/admin/proposals', icon: FileText },
          { name: 'Governance Analytics', path: '/admin/analytics', icon: BarChart3 },
          { name: 'Fraud & Anomalies', path: '/admin/anomalies', icon: ShieldAlert },
          { name: 'System Audit Trail', path: '/admin/audit', icon: Activity },
        ];

      case 'SHAREHOLDER':
        return [
          { name: 'My Portfolio & Shares', path: '/shareholder/dashboard', icon: LayoutDashboard },
          { name: 'Active Proposals', path: '/shareholder/proposals', icon: FileText },
          { name: 'Direct Voting', path: '/shareholder/voting', icon: Vote },
          { name: 'Proxy Delegation', path: '/shareholder/proxies', icon: UserCheck },
          { name: 'Voting History & Receipts', path: '/shareholder/history', icon: History },
          { name: 'Verify My Vote', path: '/blockchain/verify', icon: Search },
        ];

      case 'PROXY_REPRESENTATIVE':
        return [
          { name: 'Proxy Dashboard', path: '/proxy/dashboard', icon: LayoutDashboard },
          { name: 'Delegated Power', path: '/proxy/delegations', icon: UserCheck },
          { name: 'Cast Proxy Vote', path: '/proxy/voting', icon: Vote },
          { name: 'Proxy Vote History', path: '/proxy/history', icon: History },
          { name: 'Verify Vote', path: '/blockchain/verify', icon: Search },
        ];

      case 'AUDITOR':
        return [
          { name: 'Auditor Dashboard', path: '/auditor/dashboard', icon: LayoutDashboard },
          { name: 'Blockchain Explorer', path: '/auditor/blockchain', icon: Layers },
          { name: 'Audit Trail Inspector', path: '/auditor/audit', icon: Activity },
          { name: 'Verify Vote Integrity', path: '/blockchain/verify', icon: Search },
        ];

      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-800/80 bg-navy-950/95 backdrop-blur-lg transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full justify-between p-4">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {role ? role.replace('_', ' ') : 'Navigation'}
            </div>

            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30 shadow-sm shadow-brand-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </div>
                </NavLink>
              );
            })}
          </div>

          {/* Bottom Security Assurance Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-white font-semibold mb-1">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span>
              <span>Zero-PII On-Chain</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Personal identities are kept in PostgreSQL; immutable proofs are recorded on-chain.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
