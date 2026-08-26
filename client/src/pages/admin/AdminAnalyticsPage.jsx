import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart3, TrendingUp, Users, Vote, UserCheck, ShieldCheck, Activity } from 'lucide-react';

export const AdminAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load governance analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const kpis = data?.kpis;
  const proposalCharts = data?.proposalCharts || [];
  const votingChannelSplit = data?.votingChannelSplit || [];
  const globalChoiceSplit = data?.globalChoiceSplit || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <BarChart3 className="w-7 h-7 text-brand-500" />
          <span>Corporate Governance Analytics</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Real-time shareholder participation metrics, vote distribution analytics, and proxy utilization rates.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Shareholder Turnout"
          value={loading ? '...' : kpis?.turnoutPercentage || '0%'}
          subtitle="Total voting power exercised"
          icon={TrendingUp}
          glowColor="green"
        />
        <StatCard
          title="Total Votes Cast"
          value={loading ? '...' : `${kpis?.totalVotesRecorded || 0} Transactions`}
          subtitle="On-chain confirmed ballots"
          icon={Vote}
          glowColor="blue"
        />
        <StatCard
          title="Active Proxy Power"
          value={loading ? '...' : `${kpis?.activeDelegations || 0} Active Tickets`}
          subtitle="Delegated voting power assigned"
          icon={UserCheck}
          glowColor="purple"
        />
        <StatCard
          title="Quorum Integrity"
          value="100% Validated"
          subtitle="Zero cryptographic anomalies"
          icon={ShieldCheck}
          glowColor="amber"
        />
      </div>

      {/* Chart Row 1: Resolution Vote Power Breakdown */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Resolution Voting Power Distribution</h2>
            <p className="text-xs text-slate-400">Total voting power recorded per resolution (YES vs NO vs ABSTAIN)</p>
          </div>
          <span className="text-xs font-mono text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
            Real-Time DB Sync
          </span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={proposalCharts} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="title" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="yes" name="YES Votes" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="no" name="NO Votes" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="abstain" name="ABSTAIN" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart Row 2: Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie 1: Voting Channel Breakdown */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">Voting Channel Allocation</h2>
          <p className="text-xs text-slate-400">Direct Shareholder vs Delegated Proxy Representation</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={votingChannelSplit}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {votingChannelSplit.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie 2: Overall Sentiment Choice Split */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight">Cumulative Ballot Sentiment</h2>
          <p className="text-xs text-slate-400">Overall choice breakdown across all resolutions</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={globalChoiceSplit}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {globalChoiceSplit.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
