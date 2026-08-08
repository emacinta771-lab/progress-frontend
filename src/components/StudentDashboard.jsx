import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentAPI, receiptAPI } from '../services/api';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Core Data States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myStudent, setMyStudent] = useState(null);
  const [feeSummary, setFeeSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [receipts, setReceipts] = useState([]);

  // Folder Toggle State (Closed by default)
  const [isFolderOpen, setIsFolderOpen] = useState(false);

  // Receipt Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [receiptText, setReceiptText] = useState('');
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' | 'text'

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  // Cleanup object URLs for memory optimization
  useEffect(() => {
    return () => {
      if (receiptPreview) {
        URL.revokeObjectURL(receiptPreview);
      }
    };
  }, [receiptPreview]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError('');

      const studentRes = await studentAPI.getByUserId(user.id);
      const studentData = studentRes.data.student;
      setMyStudent(studentData);

      const [feeRes, paymentRes, receiptRes] = await Promise.all([
        studentAPI.getFeeStatus(studentData.student_id),
        studentAPI.getPaymentHistory(studentData.student_id),
        receiptAPI.getAllReceipts({ student_id: studentData.student_id }),
      ]);

      setFeeSummary(feeRes.data.feeStatus);
      setPayments(paymentRes.data.payments || []);
      setReceipts(receiptRes.data?.receipts || []);
    } catch (err) {
      setError('Failed to load your data. Please try refreshing.');
      console.error('Fetch student error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
      setError('');
      setSuccess('');
    }
  };

  const triggerCameraPicker = () => {
    fileInputRef.current?.click();
  };

  const resetModalState = () => {
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setShowUploadModal(false);
    setReceiptFile(null);
    setReceiptPreview(null);
    setReceiptText('');
    setError('');
  };

  // Direct Upload Flow
  const handleUpload = async () => {
    if (uploadMethod === 'file' && !receiptFile) {
      setError('Please select a receipt image or file.');
      return;
    }

    if (uploadMethod === 'text' && !receiptText.trim()) {
      setError('Please enter receipt details.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      let response;

      if (uploadMethod === 'file') {
        response = await receiptAPI.uploadReceipt({
          receipt: receiptFile,
          student_id: myStudent.student_id,
          student_name: `${myStudent.first_name} ${myStudent.last_name}`,
          student_code: myStudent.student_code,
        });
      } else {
        const textBlob = new Blob([receiptText], { type: 'text/plain' });
        const textFile = new File([textBlob], `receipt-${Date.now()}.txt`, { type: 'text/plain' });

        response = await receiptAPI.uploadReceipt({
          receipt: textFile,
          student_id: myStudent.student_id,
          student_name: `${myStudent.first_name} ${myStudent.last_name}`,
          student_code: myStudent.student_code,
        });
      }

      if (response.data?.success) {
        setSuccess('✅ Receipt uploaded successfully to your receipt folder!');
        resetModalState();
        setIsFolderOpen(true); // Automatically open folder to show new upload
        await fetchStudentData();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload receipt. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const navItems = [
    { title: 'Dashboard', path: '/student-dashboard', icon: '📊' },
    { title: 'Upload Receipt', path: '#', icon: '📸', action: 'upload' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#f0f7ff]">
        <div className="w-10 h-10 border-4 border-[#003C43] border-t-transparent rounded-full animate-spin mb-3" />
        <div className="text-[#4a6fa5] font-medium text-sm">Loading dashboard...</div>
      </div>
    );
  }

  if (error && !myStudent) {
    return (
      <div className="min-h-screen bg-[#f0f7ff] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full border border-gray-100">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 text-sm font-medium">{error}</p>
            <button
              onClick={fetchStudentData}
              className="mt-3 px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition text-sm font-medium shadow-sm"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  const studentCodeVal = myStudent?.student_code || myStudent?.student_id || 'N/A';

  return (
    <div className="min-h-screen bg-[#f0f7ff] text-[#1a2a3a] pb-24 sm:pb-12">
      {/* Welcome Header */}
      <div className="bg-[#003C43] text-white px-4 sm:px-6 py-5 sm:py-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col gap-3 md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              👋 Welcome back, {user?.first_name || 'Student'}!
            </h1>
            <p className="text-white/70 text-sm mt-0.5">
              Student Dashboard — Track payments and submit receipts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-medium border border-white/20 text-white/90">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Academic Year 2026</span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-xs font-semibold bg-white/15 hover:bg-white/25 text-white px-4 py-1.5 rounded-full transition-colors border border-white/20"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-[#135D66] text-white border-b border-[#0e4a52] shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="hidden sm:flex items-center space-x-1">
              {navItems.map((item, index) =>
                item.action === 'upload' ? (
                  <button
                    key={index}
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    <span>{item.icon}</span>
                    <span>{item.title}</span>
                  </button>
                ) : (
                  <Link
                    key={index}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.title}</span>
                  </Link>
                )
              )}
            </div>

            <div className="flex sm:hidden items-center justify-between w-full">
              <Link
                to="/student-dashboard"
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  location.pathname === '/student-dashboard'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80'
                }`}
              >
                📊 Home
              </Link>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-white/15 text-white active:bg-white/25"
              >
                📸 Upload
              </button>
            </div>

            <div className="hidden md:flex items-center space-x-3">
              <span className="text-xs text-white/80">
                {user?.first_name} {user?.last_name}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        
        {/* Banner Alert Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded shadow-sm">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded shadow-sm">
            <p className="text-green-700 text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Student Info Card */}
        {myStudent && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Student Code
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#003C43] tracking-widest font-mono mt-0.5">
                  {studentCodeVal}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(studentCodeVal);
                    setSuccess('Copied student code to clipboard!');
                  }}
                  className="px-4 py-2 bg-[#135D66] text-white text-xs font-semibold rounded-lg hover:bg-[#0e4a52] transition shadow-sm"
                >
                  Copy Code
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium">Student Name</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">
                  {myStudent.first_name} {myStudent.last_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Class</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">
                  Standard {myStudent.current_standard} {myStudent.current_class}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Academic Year</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">
                  {myStudent.academic_year}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Fee Summary Cards */}
        {feeSummary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500">Total Fees</p>
              <p className="text-xl font-bold text-gray-800 mt-1">
                MK {feeSummary.total_fees?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-green-50 rounded-2xl shadow-sm border border-green-200 p-4">
              <p className="text-xs font-medium text-green-700">Amount Paid</p>
              <p className="text-xl font-bold text-green-700 mt-1">
                MK {feeSummary.amount_paid?.toLocaleString() || 0}
              </p>
            </div>
            <div
              className={`rounded-2xl shadow-sm border p-4 ${
                feeSummary.outstanding_balance > 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <p
                className={`text-xs font-medium ${
                  feeSummary.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                Balance
              </p>
              <p
                className={`text-xl font-bold mt-1 ${
                  feeSummary.outstanding_balance > 0 ? 'text-red-700' : 'text-green-700'
                }`}
              >
                MK {feeSummary.outstanding_balance?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        )}

        {/* COLLAPSIBLE RECEIPT FOLDER */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
          <div 
            onClick={() => setIsFolderOpen(!isFolderOpen)}
            className="px-5 py-4 bg-gray-50/80 hover:bg-gray-100/80 cursor-pointer flex items-center justify-between gap-3 transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{isFolderOpen ? '📂' : '📁'}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-800">My Receipt Folder</h2>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-gray-200 text-gray-700 rounded-full">
                    {receipts.length}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isFolderOpen ? 'Click to hide stored receipts' : 'Click to view stored receipts'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevents toggling folder state when clicking upload
                  setShowUploadModal(true);
                }}
                className="px-3.5 py-1.5 bg-[#135D66] text-white text-xs font-semibold rounded-lg hover:bg-[#0e4a52] transition shadow-sm hidden sm:block"
              >
                + Upload
              </button>
              <span className="text-gray-400 text-sm font-bold">
                {isFolderOpen ? '▲' : '▼'}
              </span>
            </div>
          </div>

          {/* Folder Content (Rendered only when open) */}
          {isFolderOpen && (
            <div className="p-4 sm:p-5 border-t border-gray-200 animate-fadeIn">
              {receipts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {receipts.slice(0, 12).map((item) => {
                    const amount = item.extracted_data?.amount || item.amount;
                    const method = item.extracted_data?.payment_method || item.payment_method || '—';
                    const date = item.uploaded_date || item.uploaded_at;
                    return (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-all"
                      >
                        {item.receipt_image_url ? (
                          <a href={item.receipt_image_url} target="_blank" rel="noreferrer">
                            <img
                              src={item.receipt_image_url}
                              alt="Receipt"
                              className="w-full h-32 object-cover bg-gray-100"
                            />
                          </a>
                        ) : (
                          <div className="w-full h-32 bg-[#f0f7ff] flex items-center justify-center text-4xl text-[#135D66]">
                            ✏️
                          </div>
                        )}
                        <div className="p-3.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-gray-800 truncate">
                              {amount ? `MK ${Number(amount).toLocaleString()}` : 'Receipt'}
                            </p>
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full
                              ${item.status === 'Verified' ? 'bg-green-50 text-green-700 border border-green-200'
                                : item.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200'
                                : item.status === 'Analyzed' ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'}`}
                            >
                              {item.status || 'Pending'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1.5">
                            {date ? new Date(date).toLocaleDateString() : '—'}
                            {method !== '—' ? ` · ${method}` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📂</div>
                  <p className="text-sm font-semibold text-gray-700">Receipt Folder is empty</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Upload image or text receipt submissions to keep them stored in this folder.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment History Log */}
        {payments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-sm font-semibold text-gray-800">Approved Payments</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs font-semibold border-b border-gray-200">
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Amount</th>
                    <th className="px-4 py-2.5">Method</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {payments.slice(0, 5).map((payment, index) => (
                    <tr key={index} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-2.5 text-gray-600">
                        {new Date(
                          payment.payment_date || payment.created_at
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-green-600">
                        MK {payment.amount?.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">
                        {payment.payment_method || 'Cash'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          {payment.status || 'Completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-4 right-4 z-40 sm:hidden">
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#135D66] text-white text-2xl shadow-lg hover:bg-[#0e4a52] transition active:scale-95"
          aria-label="Upload receipt"
        >
          +
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && myStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="sticky top-0 bg-[#135D66] text-white px-6 py-4 rounded-t-xl flex items-center justify-between z-10">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>📸</span> Upload Receipt
              </h2>
              <button
                onClick={resetModalState}
                className="text-white/80 hover:text-white transition-colors text-xl font-bold"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <p className="text-xs text-gray-600 mb-4">
                Submit your payment receipt to add it to your student receipt folder.
              </p>

              {/* Upload Method Tabs */}
              <div className="flex rounded-lg bg-gray-100 p-1 mb-4">
                <button
                  type="button"
                  onClick={() => setUploadMethod('file')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition ${
                    uploadMethod === 'file'
                      ? 'bg-[#135D66] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📄 File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('text')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition ${
                    uploadMethod === 'text'
                      ? 'bg-[#135D66] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ✏️ Manual Entry
                </button>
              </div>

              {uploadMethod === 'file' ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#135D66] transition-colors relative bg-gray-50/50">
                  {receiptPreview ? (
                    <div className="space-y-4">
                      <img
                        src={receiptPreview}
                        alt="Receipt preview"
                        className="max-h-64 mx-auto rounded-lg shadow-sm border border-gray-200"
                      />
                      <button
                        onClick={() => {
                          if (receiptPreview) URL.revokeObjectURL(receiptPreview);
                          setReceiptFile(null);
                          setReceiptPreview(null);
                        }}
                        className="px-4 py-1.5 text-xs font-semibold text-red-600 hover:text-red-800 transition rounded-lg hover:bg-red-50"
                      >
                        ✕ Remove Image
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-5xl mb-3">📄</div>
                      <p className="text-xs text-gray-600 font-medium">
                        Tap to take a photo or select a file
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        PNG, JPG, JPEG, or PDF up to 10MB
                      </p>
                      <button
                        type="button"
                        onClick={triggerCameraPicker}
                        className="mt-3 px-4 py-2 bg-[#135D66] text-white rounded-lg text-xs font-semibold hover:bg-[#0e4a52] transition shadow-sm"
                      >
                        📷 Select File
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={receiptText}
                    onChange={(e) => setReceiptText(e.target.value)}
                    placeholder="Enter or paste your receipt details here...&#10;&#10;Example:&#10;Amount: 25,000 MK&#10;Payment Date: 2026-08-08&#10;Receipt/Ref Number: RCP-00123"
                    rows="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition text-xs leading-relaxed"
                  />
                  <p className="text-[11px] text-gray-400">
                    Include key details like Amount, Date, and Reference/Receipt Number.
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="mt-5 flex gap-3">
                <button
                  onClick={resetModalState}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || (uploadMethod === 'file' ? !receiptFile : !receiptText.trim())}
                  className="flex-1 px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition disabled:opacity-50 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
                >
                  {uploading ? (
                    <>
                      <span className="animate-spin">⏳</span> Uploading...
                    </>
                  ) : (
                    '📤 Submit to Folder'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;