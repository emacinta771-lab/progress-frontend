import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { receiptAPI, paymentAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

// ── Helpers ──────────────────────────────────────────────────────────────────

const initials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase();
};

const avatarColor = (name) => {
  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-teal-500',
    'bg-orange-500', 'bg-rose-500', 'bg-indigo-500',
    'bg-emerald-500', 'bg-amber-500',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const formatDate = (raw) => {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isThisYear = d.getFullYear() === now.getFullYear();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isThisYear) return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};

const statusPill = (status) => {
  switch (status) {
    case 'Verified':  return 'bg-green-100 text-green-700 border border-green-200';
    case 'Analyzed':  return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'Pending':   return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    case 'Rejected':  return 'bg-red-100 text-red-700 border border-red-200';
    default:          return 'bg-gray-100 text-gray-600 border border-gray-200';
  }
};

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);


// ── Component ─────────────────────────────────────────────────────────────────

const ReceiptRepository = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [receipts, setReceipts]               = useState([]);
  const [stats, setStats]                     = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [filter, setFilter]                   = useState('all');
  const [search, setSearch]                   = useState('');
  const [selected, setSelected]               = useState(null);
  const [readIds, setReadIds]                 = useState(new Set());
  const [processingId, setProcessingId]       = useState(null);
  const [toast, setToast]                     = useState(null); // { type, msg }
  const [aiResult, setAiResult]               = useState(null); // last AI analysis result
  const [aiLoading, setAiLoading]             = useState(false);
  const [aiReceiptId, setAiReceiptId]         = useState(null); // which receipt the aiResult belongs to

  // ── Data ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchData(); }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const [rRes, sRes] = await Promise.all([
        receiptAPI.getAllReceipts(params),
        receiptAPI.getReceiptStats(),
      ]);
      setReceipts(rRes.data.receipts || []);
      setStats(sRes.data.stats || null);
    } catch {
      showToast('error', 'Failed to load receipts.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Filtered / searched list ───────────────────────────────────────────────
  const visible = useMemo(() => {
    if (!search.trim()) return receipts;
    const q = search.toLowerCase();
    return receipts.filter(r =>
      (r.student_name || '').toLowerCase().includes(q) ||
      (r.student_code || '').toLowerCase().includes(q)
    );
  }, [receipts, search]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const markRead = (receipt) => {
    setSelected(receipt);
    setReadIds(prev => new Set([...prev, receipt.id]));
    // Clear AI result when switching to a different receipt
    if (receipt.id !== aiReceiptId) {
      setAiResult(null);
      setAiReceiptId(null);
    }
  };

  const isUnread = (r) => r.status === 'Pending' && !readIds.has(r.id);

  const act = async (label, fn) => {
    setProcessingId(selected?.id);
    try {
      await fn();
      showToast('success', label);
      await fetchData();
      setSelected(null);
    } catch (err) {
      showToast('error', err.response?.data?.error || `Failed: ${label}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAnalyze = () =>
    act('Receipt analyzed.', () => receiptAPI.analyzeReceipt(selected.id, { extracted_data: {} }));

  const handleAiAnalyze = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await receiptAPI.aiAnalyzeReceipt(selected.id);
      setAiResult(res.data.ai_analysis);
      setAiReceiptId(selected.id);
      // Refresh list so status + extracted_data reflect the AI update
      await fetchData();
      // Re-select with fresh data
      setSelected(prev => ({ ...prev, ...res.data.receipt }));
      showToast('success', 'Analysis complete.');
    } catch (err) {
      const msg = err.response?.data?.error || 'Analysis failed.';
      showToast('error', msg);
    } finally {
      setAiLoading(false);
    }
  };

  const handleVerify = () =>
    act('Receipt verified.', () => receiptAPI.verifyReceipt(selected.id, { verified_by: user?.id, notes: 'Verified by accountant' }));

  const handleReject = () => {
    if (!window.confirm('Reject this receipt?')) return;
    act('Receipt rejected.', () => receiptAPI.rejectReceipt(selected.id, { notes: 'Rejected by accountant' }));
  };

  const handleUpdateFees = () => {
    const amount = selected.extracted_data?.amount || selected.amount;
    if (!amount) { showToast('error', 'No amount found. Analyze first.'); return; }
    act(`Fee balance updated — MK ${Number(amount).toLocaleString()} recorded.`, () =>
      paymentAPI.recordPayment(selected.student_id, {
        student_id: selected.student_id,
        amount,
        payment_method: selected.extracted_data?.payment_method || 'Cash',
        receipt_number: `RCP-${selected.id}`,
        payment_period: 'General',
        status: 'Completed',
        notes: `Recorded from receipt ${selected.id} by accountant`,
      })
    );
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this receipt permanently?')) return;
    act('Receipt deleted.', () => receiptAPI.deleteReceipt(selected.id));
  };


  // ── Nav items ──────────────────────────────────────────────────────────────
  const navItems = [
    { title: 'Dashboard', path: '/accountant-dashboard', icon: '📊' },
    { title: 'Receipts',  path: '/receipt-repository',   icon: '📥' },
    { title: 'Payments',  path: '/payments',              icon: '💰' },
    { title: 'Students',  path: '/students',              icon: '👨‍🎓' },
    { title: 'Reports',   path: '/reports',               icon: '📈' },
    { title: 'Fees',      path: '/fee-structure',         icon: '📋' },
  ];

  const filterTabs = [
    { key: 'all',      label: 'All',      count: stats?.total_receipts },
    { key: 'Pending',  label: 'Pending',  count: stats?.pending,  dot: 'bg-yellow-400' },
    { key: 'Analyzed', label: 'Analyzed', count: stats?.analyzed, dot: 'bg-blue-400' },
    { key: 'Verified', label: 'Verified', count: stats?.verified, dot: 'bg-green-400' },
    { key: 'Rejected', label: 'Rejected', count: stats?.rejected, dot: 'bg-red-400' },
  ];

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white text-[#1a2a3a]">
        <div className="bg-[#003C43] px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-7 w-56 bg-white/20 mb-2" />
            <Skeleton className="h-4 w-80 bg-white/10" />
          </div>
        </div>
        <div className="bg-[#135D66] h-14" />
        <div className="max-w-7xl mx-auto flex h-[calc(100vh-8.5rem)]">
          {/* list pane skeleton */}
          <div className="w-80 border-r border-gray-200 flex-shrink-0">
            <div className="h-12 border-b border-gray-200 px-4 flex items-center gap-2">
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="h-10 border-b border-gray-200 px-3 flex items-center gap-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-6 w-16 rounded-full" />)}
            </div>
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-48" />
                </div>
                <Skeleton className="h-2.5 w-10 shrink-0" />
              </div>
            ))}
          </div>
          {/* reading pane skeleton */}
          <div className="flex-1 p-6 space-y-4">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-48 w-full" />
            <div className="grid grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }


  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white text-[#1a2a3a] flex flex-col">

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 transition-all
          ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-[#003C43] text-white px-6 py-5 shadow-lg shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">📥 Receipt Repository</h1>
            <p className="text-white/60 text-xs mt-0.5">Review and process incoming student payment receipts</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs border border-white/20 text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
              Academic Year 2026
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full border border-white/20 transition"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="bg-[#135D66] text-white border-b border-[#0e4a52] shadow-md shrink-0 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-12">
          <div className="flex items-center space-x-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition
                  ${window.location.pathname === item.path ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                <span>{item.icon}</span><span>{item.title}</span>
                {item.title === 'Receipts' && stats?.pending > 0 && (
                  <span className="ml-1 bg-yellow-400 text-black px-1.5 py-0.5 rounded-full text-[10px]">{stats.pending}</span>
                )}
              </Link>
            ))}
          </div>
          <span className="text-xs text-white/60 hidden md:block">{user?.first_name}</span>
        </div>
      </nav>

      {/* Body: two-column layout filling remaining height */}
      <div className="flex flex-1 overflow-hidden max-w-7xl w-full mx-auto border-x border-gray-200">

        {/* ── LEFT: List pane ──────────────────────────────────────────── */}
        <div className="w-[340px] xl:w-[380px] shrink-0 flex flex-col border-r border-gray-200 bg-white">

          {/* Search */}
          <div className="px-3 py-2.5 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Search receipts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50 overflow-x-auto">
            {filterTabs.map(tab => (
              <button key={tab.key} onClick={() => { setFilter(tab.key); setSelected(null); }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition
                  ${filter === tab.key
                    ? 'bg-[#135D66] text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-300 hover:border-[#135D66] hover:text-[#135D66]'}`}
              >
                {tab.dot && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />}
                {tab.label}
                {tab.count != null && (
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] leading-none
                    ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Receipt rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <span className="text-4xl mb-3">📭</span>
                <p className="text-sm">No receipts here</p>
              </div>
            ) : visible.map(r => {
              const unread = isUnread(r);
              const isActive = selected?.id === r.id;
              const amount = r.extracted_data?.amount || r.amount;
              return (
                <button key={r.id} onClick={() => markRead(r)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition group
                    ${isActive ? 'bg-[#e8f4f8] border-l-4 border-[#135D66]' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold ${avatarColor(r.student_name)}`}>
                    {initials(r.student_name)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`text-sm truncate ${unread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {r.student_name || 'Unknown Student'}
                      </span>
                      <span className="text-[11px] text-gray-400 shrink-0 tabular-nums">
                        {formatDate(r.uploaded_date || r.uploaded_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-500 truncate">
                        {r.student_code && <span className="font-mono text-gray-400 mr-1">{r.student_code}</span>}
                        {amount ? `MK ${Number(amount).toLocaleString()}` : 'Awaiting analysis'}
                      </span>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusPill(r.status)}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                      {r.extracted_data?.payment_method
                        ? `Via ${r.extracted_data.payment_method}`
                        : 'Payment receipt submitted for review'}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {unread && <span className="w-2 h-2 rounded-full bg-[#135D66] shrink-0 mt-1.5" />}
                </button>
              );
            })}
          </div>

          {/* Footer count */}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-[11px] text-gray-400 flex justify-between">
            <span>{visible.length} receipt{visible.length !== 1 ? 's' : ''}</span>
            <button onClick={fetchData} className="hover:text-[#135D66] transition">↻ Refresh</button>
          </div>
        </div>


        {/* ── RIGHT: Reading pane ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          {selected ? (
            <>
              {/* Reading pane header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${avatarColor(selected.student_name)}`}>
                      {initials(selected.student_name)}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">{selected.student_name || 'Unknown Student'}</h2>
                      <p className="text-xs text-gray-500">
                        {selected.student_code && <span className="font-mono mr-2">{selected.student_code}</span>}
                        <span>{formatDate(selected.uploaded_date || selected.uploaded_at)}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${statusPill(selected.status)}`}>
                    {selected.status}
                  </span>
                </div>

                {/* Action toolbar */}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {selected.status === 'Pending' && (
                    <button onClick={handleAnalyze} disabled={!!processingId || aiLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
                      {processingId ? 'Analyzing…' : 'Analyze'}
                    </button>
                  )}
                  {/* AI Analyse — available for any receipt with an image */}
                  {(selected.receipt_image_url || selected.receipt_image_path) && (
                    <button onClick={handleAiAnalyze} disabled={aiLoading || !!processingId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition shadow-sm">
                      {aiLoading ? (
                        <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Thinking…</>
                      ) : (
                        <>Analyze</>
                      )}
                    </button>
                  )}
                  {(selected.status === 'Pending' || selected.status === 'Analyzed') && (
                    <>
                      <button onClick={handleVerify} disabled={!!processingId || aiLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
                        ✅ {processingId ? 'Verifying…' : 'Verify'}
                      </button>
                      <button onClick={handleUpdateFees} disabled={!!processingId || aiLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#135D66] text-white text-xs font-medium rounded-lg hover:bg-[#0e4a52] disabled:opacity-50 transition">
                        💳 {processingId ? 'Updating…' : 'Update Fees'}
                      </button>
                      <button onClick={handleReject} disabled={!!processingId || aiLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-600 border border-red-300 text-xs font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition">
                        ✕ Reject
                      </button>
                    </>
                  )}
                  <button onClick={handleDelete} disabled={!!processingId || aiLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-600 border border-gray-300 text-xs font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 transition ml-auto">
                    🗑 Delete
                  </button>
                </div>
              </div>

              {/* Reading pane body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {/* Key details row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Amount', value: selected.extracted_data?.amount
                        ? `MK ${Number(selected.extracted_data.amount).toLocaleString()}`
                        : selected.amount ? `MK ${Number(selected.amount).toLocaleString()}` : '—',
                      bold: true, green: true },
                    { label: 'Payment Method', value: selected.extracted_data?.payment_method || '—' },
                    { label: 'Confidence', value: selected.confidence_score ? `${selected.confidence_score}%` : '—' },
                    { label: 'Uploaded', value: formatDate(selected.uploaded_date || selected.uploaded_at) },
                  ].map((item, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                      <p className={`text-sm font-semibold ${item.green ? 'text-green-600' : 'text-gray-800'}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* ── AI Analysis loading shimmer ── */}
                {aiLoading && (
                  <div className="bg-teal-50 rounded-xl border border-teal-200 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-4 h-4 border-2 border-teal-400/40 border-t-teal-600 rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Analyzing the receipt…</span>
                    </div>
                    <div className="space-y-2.5">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-3 bg-teal-200/60 rounded animate-pulse" style={{ width: `${75 - i * 10}%` }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── AI Analysis result panel ── */}
                {!aiLoading && aiResult && aiReceiptId === selected.id && (
                  <div className="bg-teal-50 rounded-xl border border-teal-200 overflow-hidden">
                    {/* Panel header */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-teal-600">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-xs font-bold uppercase tracking-wider">Analysis</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Validity badge */}
                        {aiResult.is_valid_receipt !== undefined && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            aiResult.is_valid_receipt
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : 'bg-red-100 text-red-700 border-red-300'
                          }`}>
                            {aiResult.is_valid_receipt ? '✓ Valid Receipt' : '✕ Suspicious'}
                          </span>
                        )}
                        {/* Confidence badge */}
                        {aiResult.confidence != null && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            aiResult.confidence >= 80
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : aiResult.confidence >= 50
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                              : 'bg-red-100 text-red-700 border-red-300'
                          }`}>
                            {aiResult.confidence}% confidence
                          </span>
                        )}
                        <button onClick={() => { setAiResult(null); setAiReceiptId(null); }}
                          className="text-white/60 hover:text-white text-sm leading-none transition">✕</button>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">

                      {/* AI Summary */}
                      {aiResult.summary && (
                        <div className="bg-white/70 rounded-lg border border-teal-100 px-3 py-2.5">
                          <p className="text-[10px] text-teal-600 uppercase tracking-wider font-semibold mb-1">Summary</p>
                          <p className="text-sm text-gray-800 leading-relaxed">{aiResult.summary}</p>
                        </div>
                      )}

                      {/* Key fields grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { label: 'Amount', value: aiResult.amount != null ? `${aiResult.currency || 'MK'} ${Number(aiResult.amount).toLocaleString()}` : '—', highlight: true },
                          { label: 'Payment Method', value: aiResult.payment_method || '—' },
                          { label: 'Payment Date', value: aiResult.payment_date || '—' },
                          { label: 'Payer Name', value: aiResult.payer_name || '—' },
                          { label: 'Receipt No.', value: aiResult.receipt_number || '—' },
                          { label: 'Bank / Reference', value: aiResult.bank_name || aiResult.reference || '—' },
                        ].map((f, i) => (
                          <div key={i} className="bg-white/70 rounded-lg border border-teal-100 p-2.5">
                            <p className="text-[10px] text-teal-500 uppercase tracking-wider">{f.label}</p>
                            <p className={`text-sm font-semibold mt-0.5 ${f.highlight ? 'text-green-600' : 'text-gray-800'}`}>
                              {f.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Anomalies */}
                      {aiResult.anomalies && aiResult.anomalies.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                          <p className="text-[10px] text-red-500 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
                            <span>⚠️</span> Anomalies Detected
                          </p>
                          <ul className="space-y-1">
                            {aiResult.anomalies.map((a, i) => (
                              <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                                <span className="mt-0.5 shrink-0">•</span>
                                <span>{a}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* No anomalies */}
                      {aiResult.anomalies && aiResult.anomalies.length === 0 && (
                        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                          <span>✓</span>
                          <span>No anomalies detected</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Receipt image */}
                {selected.receipt_image_url ? (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-600">
                      Receipt Image
                    </div>
                    <div className="p-4">
                      <img
                        src={selected.receipt_image_url}
                        alt="Receipt"
                        className="max-h-80 mx-auto rounded-lg shadow-sm border border-gray-200 object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">
                    <p className="text-3xl mb-2">🖼</p>
                    <p className="text-sm">No receipt image available</p>
                  </div>
                )}

                {/* Extracted data */}
                {selected.extracted_data && Object.keys(selected.extracted_data).length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-600">
                      Extracted Data
                    </div>
                    <div className="grid sm:grid-cols-2 gap-px bg-gray-100">
                      {Object.entries(selected.extracted_data).map(([k, v]) => (
                        <div key={k} className="bg-white px-4 py-2.5">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">{k.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-gray-800 font-medium mt-0.5">{String(v) || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes / history placeholder */}
                {selected.notes && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{selected.notes}</p>
                  </div>
                )}

              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl">📩</div>
              <p className="text-sm font-medium">Select a receipt to review</p>
              <p className="text-xs text-gray-300">
                {visible.length > 0 ? `${visible.length} receipt${visible.length !== 1 ? 's' : ''} in view` : 'Inbox is empty'}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ReceiptRepository;