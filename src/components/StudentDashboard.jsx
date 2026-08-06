import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentAPI, receiptAPI } from '../services/api';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myStudent, setMyStudent] = useState(null);
  const [feeSummary, setFeeSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  
  // Receipt Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [receiptText, setReceiptText] = useState('');
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'text'
  
  // AI Analysis States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiExtractedData, setAiExtractedData] = useState(null);
  const [showAIConfirmation, setShowAIConfirmation] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const studentRes = await studentAPI.getByUserId(user.id);
      const studentData = studentRes.data.student;
      setMyStudent(studentData);
      
      const feeRes = await studentAPI.getFeeStatus(studentData.student_id);
      setFeeSummary(feeRes.data.feeStatus);
      
      const paymentRes = await studentAPI.getPaymentHistory(studentData.student_id);
      setPayments(paymentRes.data.payments || []);
      
    } catch (err) {
      setError('Failed to load your data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ADD THIS MISSING FUNCTION
  // ==========================================
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
      setError('');
      setSuccess('');
    }
  };

  const triggerCameraPicker = () => {
    fileInputRef.current?.click();
  };

  // Handle AI analysis using server-side API
  const handleAIAnalysis = async () => {
    if (!receiptFile) {
      setError('Please upload a receipt image first.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // First upload the receipt to get an ID
      const uploadResponse = await receiptAPI.uploadReceipt({
        receipt: receiptFile,
        student_id: myStudent.student_id,
        student_name: `${myStudent.first_name} ${myStudent.last_name}`,
        student_code: myStudent.student_code
      });

      if (uploadResponse.data.success) {
        const receiptId = uploadResponse.data.receipt.id;
        
        // Then analyze it with AI on the server
        const analyzeResponse = await receiptAPI.aiAnalyzeReceipt(receiptId);
        
        if (analyzeResponse.data.success) {
          setAiExtractedData(analyzeResponse.data.ai_analysis);
          setConfidenceScore(analyzeResponse.data.ai_analysis.confidence || 0);
          setShowAIConfirmation(true);
          setSuccess('✅ Analysis complete! Review the extracted data.');
        }
      }
    } catch (err) {
      console.error('AI Analysis Error:', err);
      setError('Failed to analyze receipt. Please try again or enter details manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Confirm and upload AI-extracted data
  const handleConfirmAIData = async () => {
    if (!aiExtractedData) return;
    
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare receipt data with AI-extracted info
      const receiptData = {
        receipt: receiptFile,
        student_id: myStudent.student_id,
        student_name: `${myStudent.first_name} ${myStudent.last_name}`,
        student_code: myStudent.student_code,
        amount: aiExtractedData.amount,
        payment_date: aiExtractedData.payment_date,
        receipt_number: aiExtractedData.receipt_number,
        payment_method: aiExtractedData.payment_method,
        confidence: aiExtractedData.confidence
      };

      const response = await receiptAPI.uploadReceiptWithAI(receiptData);
      
      if (response.data.success) {
        setSuccess('✅ Receipt uploaded successfully with AI-extracted data!');
        setReceiptFile(null);
        setReceiptPreview(null);
        setAiExtractedData(null);
        setShowAIConfirmation(false);
        setShowUploadModal(false);
        await fetchStudentData();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  // Manual upload (without AI)
  const handleManualUpload = async () => {
    if (uploadMethod === 'file' && !receiptFile) {
      setError('Please select a receipt image');
      return;
    }

    if (uploadMethod === 'text' && !receiptText.trim()) {
      setError('Please enter receipt details');
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
          student_code: myStudent.student_code
        });
      } else {
        const textBlob = new Blob([receiptText], { type: 'text/plain' });
        const textFile = new File([textBlob], `receipt-${Date.now()}.txt`, { type: 'text/plain' });
        
        response = await receiptAPI.uploadReceipt({
          receipt: textFile,
          student_id: myStudent.student_id,
          student_name: `${myStudent.first_name} ${myStudent.last_name}`,
          student_code: myStudent.student_code
        });
      }

      if (response.data.success) {
        setSuccess('✅ Receipt uploaded successfully! It will be reviewed by the accountant.');
        setReceiptFile(null);
        setReceiptPreview(null);
        setReceiptText('');
        setShowUploadModal(false);
        await fetchStudentData();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  const navItems = [
    { title: 'Dashboard', path: '/student-dashboard', icon: '📊' },
    { title: 'Upload Receipt', path: '#', icon: '📸', action: 'upload' }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#f0f7ff]">
        <div className="w-10 h-10 border-4 border-[#003C43] border-t-transparent rounded-full animate-spin mb-3"></div>
        <div className="text-[#4a6fa5] font-medium text-sm">Loading dashboard...</div>
      </div>
    );
  }

  if (error && !myStudent) {
    return (
      <div className="min-h-screen bg-[#f0f7ff] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 text-sm">{error}</p>
            <button 
              onClick={fetchStudentData}
              className="mt-3 px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f7ff] text-[#1a2a3a] pb-24 sm:pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-[#003C43] text-white px-4 sm:px-6 py-5 sm:py-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col gap-3 md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              👋 Welcome back, {user?.first_name || 'Student'}!
            </h1>
            <p className="text-white/70 text-sm mt-0.5">
              Student Dashboard — Track your payments and upload receipts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-medium border border-white/20 text-white/90">
              <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse"></span>
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
      <nav className="bg-[#135D66] text-white border-b border-[#0e4a52] shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="hidden sm:flex items-center space-x-1 overflow-x-auto">
              {navItems.map((item, index) => (
                item.action === 'upload' ? (
                  <button
                    key={index}
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <span>{item.icon}</span>
                    <span>{item.title}</span>
                  </button>
                ) : (
                  <Link
                    key={index}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap
                      ${location.pathname === item.path 
                        ? 'bg-white/20 text-white' 
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.title}</span>
                  </Link>
                )
              ))}
            </div>

            <div className="flex sm:hidden items-center justify-between w-full">
              <Link
                to="/student-dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${location.pathname === '/student-dashboard' ? 'bg-white/20 text-white' : 'text-white/70'}`}
              >
                📊 Home
              </Link>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-3 py-2 rounded-lg text-sm font-semibold bg-white/15 text-white"
              >
                📸 Upload
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs text-white/70 hidden md:inline">
                {user?.first_name || 'Student'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Prominent Student Code Bar */}
        {myStudent && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 sm:p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#003C43] tracking-widest font-mono">{myStudent.student_code || myStudent.student_id}</div>
              <div className="text-sm text-gray-600">Student Code</div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { navigator.clipboard.writeText(myStudent.student_code || myStudent.student_id); setSuccess('Copied student code'); }} className="px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52]">Copy</button>
              <button onClick={() => { navigator.clipboard.writeText(`${myStudent.student_code || myStudent.student_id}`); alert('Student code copied'); }} className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg">Share</button>
            </div>
          </div>
        )}

        {/* Student Info */}
        {myStudent && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-gray-500">Student Name</p>
                <p className="text-sm font-medium text-gray-800">
                  {myStudent.first_name} {myStudent.last_name}
                </p>
              </div>
              <div className="rounded-xl border border-[#003C43]/10 bg-[#f5fbfc] px-3 py-2.5">
                <p className="text-xs text-gray-500">Student Code</p>
                <p className="text-lg sm:text-xl font-black text-[#003C43] tracking-wide leading-tight">
                  {myStudent.student_code || myStudent.student_id}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Class</p>
                <p className="text-sm font-medium text-gray-800">
                  Standard {myStudent.current_standard} {myStudent.current_class}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Academic Year</p>
                <p className="text-sm font-medium text-gray-800">
                  {myStudent.academic_year}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Fee Summary */}
        {feeSummary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Total Fees</p>
              <p className="text-xl font-bold text-gray-800">
                MK {feeSummary.total_fees?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-4">
              <p className="text-xs text-green-600">Amount Paid</p>
              <p className="text-xl font-bold text-green-700">
                MK {feeSummary.amount_paid?.toLocaleString() || 0}
              </p>
            </div>
            <div className={`rounded-lg shadow-sm border p-4 ${feeSummary.outstanding_balance > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <p className={`text-xs ${feeSummary.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>Balance</p>
              <p className={`text-xl font-bold ${feeSummary.outstanding_balance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                MK {feeSummary.outstanding_balance?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        )}

        {/* Payment Status */}
        {feeSummary && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Payment Status</p>
                <p className={`text-lg font-bold ${feeSummary.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {feeSummary.outstanding_balance > 0 ? '🔴 Pending' : '✅ Completed'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Payment Plan</p>
                <p className="text-sm font-medium text-gray-800">{feeSummary.fee_payment_plan || 'Full'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Upload Receipt */}
        {myStudent && (
          <div className="bg-gradient-to-r from-[#003C43] to-[#135D66] rounded-2xl shadow-sm p-4 sm:p-5 text-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  Receipt Upload
                </h3>
                <p className="text-white/70 text-xs mt-0.5">
                  Upload a receipt
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-white text-[#003C43] rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg text-sm whitespace-nowrap"
              >
                Upload Receipt
              </button>
            </div>
          </div>
        )}

        {/* Recent Payments */}
        {payments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-800">Recent Payments</h2>
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
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-600">
                        {new Date(payment.payment_date || payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-green-600">
                        MK {payment.amount.toLocaleString()}
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

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

      </div>

      <div className="fixed bottom-4 right-4 z-40 sm:hidden">
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#135D66] text-white text-2xl shadow-lg hover:bg-[#0e4a52] transition"
          aria-label="Upload receipt"
        >
          +
        </button>
      </div>

      {/* Receipt Upload Modal with AI */}
      {showUploadModal && myStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#135D66] text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>📸</span> Receipt Upload
              </h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setReceiptFile(null);
                  setReceiptPreview(null);
                  setReceiptText('');
                  setAiExtractedData(null);
                  setShowAIConfirmation(false);
                  setError('');
                  setSuccess('');
                }}
                className="text-white/70 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Take a photo or upload a receipt and analyze it for payment details.
              </p>

              {/* Upload Method Toggle */}
              <div className="flex rounded-lg bg-gray-100 p-1 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMethod('file');
                    setAiExtractedData(null);
                    setShowAIConfirmation(false);
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                    uploadMethod === 'file' 
                      ? 'bg-[#135D66] text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📄 File Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMethod('text');
                    setAiExtractedData(null);
                    setShowAIConfirmation(false);
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                    uploadMethod === 'text' 
                      ? 'bg-[#135D66] text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  ✏️ Manual Entry
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              
              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded">
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              )}

              {uploadMethod === 'file' ? (
                <>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#135D66] transition-colors relative">
                    {receiptPreview ? (
                      <div className="space-y-4">
                        <img 
                          src={receiptPreview} 
                          alt="Receipt preview" 
                          className="max-h-64 mx-auto rounded-lg shadow-md"
                        />
                        <button
                          onClick={() => {
                            setReceiptFile(null);
                            setReceiptPreview(null);
                            setAiExtractedData(null);
                            setShowAIConfirmation(false);
                          }}
                          className="px-4 py-2 text-sm text-red-600 hover:text-red-800 transition"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="text-6xl mb-3">📄</div>
                        <p className="text-sm text-gray-600">Tap to take a photo or choose a receipt</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG, PDF up to 10MB</p>
                        <button
                          type="button"
                          onClick={triggerCameraPicker}
                          className="mt-3 px-4 py-2 bg-[#135D66] text-white rounded-lg text-sm font-medium hover:bg-[#0e4a52] transition"
                        >
                          📷 Take Photo / Choose File
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          capture="environment"
                          onChange={handleFileSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {receiptFile && !aiExtractedData && (
                    <button
                      onClick={handleAIAnalysis}
                      disabled={isAnalyzing}
                      className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <span className="animate-spin">⏳</span> Analyzing...
                        </>
                      ) : (
                        'Analyze'
                      )}
                    </button>
                  )}

                  {/* AI Extracted Data Confirmation */}
                  {aiExtractedData && showAIConfirmation && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-green-800 text-sm mb-2">✅ Extracted Details</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {aiExtractedData.amount && (
                          <div>
                            <p className="text-gray-500">Amount</p>
                            <p className="font-medium text-green-600">MK {aiExtractedData.amount.toLocaleString()}</p>
                          </div>
                        )}
                        {aiExtractedData.payment_date && (
                          <div>
                            <p className="text-gray-500">Date</p>
                            <p className="font-medium">{aiExtractedData.payment_date}</p>
                          </div>
                        )}
                        {aiExtractedData.receipt_number && (
                          <div>
                            <p className="text-gray-500">Receipt #</p>
                            <p className="font-medium font-mono text-xs">{aiExtractedData.receipt_number}</p>
                          </div>
                        )}
                        {aiExtractedData.payment_method && (
                          <div>
                            <p className="text-gray-500">Payment Method</p>
                            <p className="font-medium">{aiExtractedData.payment_method}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-500">Confidence</p>
                          <p className={`font-medium ${confidenceScore > 70 ? 'text-green-600' : confidenceScore > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {confidenceScore}%
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            setAiExtractedData(null);
                            setShowAIConfirmation(false);
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                        >
                          ✖ Cancel
                        </button>
                        <button
                          onClick={handleConfirmAIData}
                          disabled={uploading}
                          className="flex-1 px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                        >
                          {uploading ? (
                            <>
                              <span className="animate-spin">⏳</span> Uploading...
                            </>
                          ) : (
                            '✅ Confirm & Upload'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={receiptText}
                    onChange={(e) => setReceiptText(e.target.value)}
                    placeholder="Paste your payment details here...&#10;&#10;Example:&#10;Amount: 25,000 MK&#10;Payment Date: 2024-01-15&#10;Receipt Number: RCP-001"
                    rows="6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
                  />
                  <p className="text-xs text-gray-400">
                    Include: Amount, Date, Receipt Number (if available)
                  </p>
                </div>
              )}

              {uploadMethod === 'text' && receiptText && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setReceiptFile(null);
                      setReceiptPreview(null);
                      setReceiptText('');
                      setError('');
                      setSuccess('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleManualUpload}
                    disabled={uploading || !receiptText.trim()}
                    className="flex-1 px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <span className="animate-spin">⏳</span> Uploading...
                      </>
                    ) : (
                      '📤 Upload Receipt'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;