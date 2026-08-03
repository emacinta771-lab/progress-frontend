import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentAPI, paymentAPI, attendanceAPI, reportAPI } from '../services/api';

const Reports = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [reportType, setReportType] = useState('students');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedStandard, setSelectedStandard] = useState('');

  const navItems = [
    { title: 'Dashboard', path: '/accountant-dashboard', icon: '📊' },
    { title: 'Payments', path: '/payments', icon: '💰' },
    { title: 'Students', path: '/students', icon: '👨‍🎓' },
    { title: 'Reports', path: '/reports', icon: '📈' },
    { title: 'Fee Structure', path: '/fee-structure', icon: '📋' }
  ];

  const reportOptions = [
    { id: 'students', label: 'Student Reports', icon: '👨‍🎓', description: 'View all students and their details' },
    { id: 'financial', label: 'Financial Reports', icon: '💰', description: 'Payment and fee summaries' },
    { id: 'attendance', label: 'Attendance Reports', icon: '📋', description: 'Student attendance records' },
    { id: 'academic', label: 'Academic Reports', icon: '📊', description: 'Student performance and grades' }
  ];

  useEffect(() => {
    // Fetch initial data based on default report type
    if (reportType) {
      generateReport();
    }
  }, [reportType]);

  const generateReport = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      let data = null;
      
      switch(reportType) {
        case 'students':
          const studentsRes = await studentAPI.getAll();
          data = {
            title: 'Student Report',
            headers: ['Code', 'Name', 'Class', 'Parent', 'Status', 'Balance'],
            rows: studentsRes.data.students?.map(s => ({
              code: s.student_code || s.student_id,
              name: `${s.first_name} ${s.last_name}`,
              class: `Standard ${s.current_standard}`,
              parent: s.parent_name || 'N/A',
              status: s.enrollment_status || 'Active',
              balance: `MK ${parseFloat(s.outstanding_balance || 0).toFixed(2)}`
            })) || [],
            summary: {
              total: studentsRes.data.students?.length || 0,
              active: studentsRes.data.students?.filter(s => s.enrollment_status === 'Active').length || 0
            }
          };
          break;
          
        case 'financial':
          const paymentsRes = await paymentAPI.getAllPayments(100);
          const summaryRes = await paymentAPI.getPaymentSummary('month');
          data = {
            title: 'Financial Report',
            headers: ['Student', 'Amount', 'Method', 'Receipt', 'Date', 'Status'],
            rows: paymentsRes.data.payments?.slice(0, 50).map(p => ({
              student: p.student_name || 'N/A',
              amount: `MK ${parseFloat(p.amount || 0).toFixed(2)}`,
              method: p.payment_method || 'Cash',
              receipt: p.receipt_number || 'N/A',
              date: new Date(p.payment_date).toLocaleDateString(),
              status: p.status || 'Pending'
            })) || [],
            summary: {
              totalAmount: `MK ${summaryRes.data.summary?.total_amount?.toFixed(2) || '0.00'}`,
              totalPayments: summaryRes.data.summary?.total_payments || 0,
              completed: summaryRes.data.summary?.completed || 0,
              pending: summaryRes.data.summary?.pending || 0
            }
          };
          break;
          
        case 'attendance':
          const attendanceRes = await attendanceAPI.getAll();
          data = {
            title: 'Attendance Report',
            headers: ['Student', 'Date', 'Status', 'Check In', 'Check Out'],
            rows: attendanceRes.data.attendance?.slice(0, 50).map(a => ({
              student: `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'N/A',
              date: new Date(a.date).toLocaleDateString(),
              status: a.status || 'N/A',
              checkIn: a.check_in_time || '--:--',
              checkOut: a.check_out_time || '--:--'
            })) || [],
            summary: {
              present: attendanceRes.data.attendance?.filter(a => a.status === 'Present').length || 0,
              absent: attendanceRes.data.attendance?.filter(a => a.status === 'Absent').length || 0,
              late: attendanceRes.data.attendance?.filter(a => a.status === 'Late').length || 0
            }
          };
          break;
          
        case 'academic':
          data = {
            title: 'Academic Report',
            headers: ['Student', 'Subject', 'Score', 'Grade', 'Term', 'Year'],
            rows: [
              { student: 'John Doe', subject: 'Mathematics', score: 85, grade: 'A', term: 'Term 1', year: '2024/2025' },
              { student: 'Jane Smith', subject: 'English', score: 78, grade: 'B', term: 'Term 1', year: '2024/2025' },
              { student: 'Mike Johnson', subject: 'Science', score: 92, grade: 'A', term: 'Term 1', year: '2024/2025' }
            ],
            summary: {
              totalStudents: 3,
              averageScore: 85,
              topPerformer: 'Mike Johnson'
            }
          };
          break;
          
        default:
          data = {
            title: 'Report',
            headers: [],
            rows: [],
            summary: {}
          };
      }
      
      setReportData(data);
      setSuccess(`✅ ${data.title} generated successfully!`);
      
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData || !reportData.rows.length) {
      setError('No data to export');
      return;
    }

    // Create CSV content
    const headers = reportData.headers.join(',');
    const rows = reportData.rows.map(row => 
      Object.values(row).map(val => `"${val}"`).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.title.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setSuccess('✅ Report exported successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const exportToPDF = () => {
    // For PDF export, you can use libraries like jsPDF or html2pdf
    // For now, we'll just show a message
    setSuccess('📄 PDF export feature coming soon!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#f0f7ff]">
        <div className="w-10 h-10 border-4 border-[#003C43] border-t-transparent rounded-full animate-spin mb-3"></div>
        <div className="text-[#4a6fa5] font-medium text-sm">Generating report...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f7ff] text-[#1a2a3a] pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-[#003C43] text-white px-6 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              👋 Welcome back, {user?.first_name || 'Accountant'}!
            </h1>
            <p className="text-white/70 text-sm mt-0.5">
              Reports Dashboard — Generate and export comprehensive reports.
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
            <div className="flex items-center space-x-1 overflow-x-auto">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap
                    ${window.location.pathname === item.path 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-white/70 hidden md:inline">
                {user?.first_name || 'Accountant'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Reports Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#003C43]">📊 Reports</h1>
              <p className="text-sm text-gray-500 mt-1">Generate and export comprehensive reports</p>
            </div>
            <button
              onClick={generateReport}
              className="px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition font-medium text-sm flex items-center gap-2"
            >
              🔄 Refresh Report
            </button>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
              <p className="text-red-700 text-sm flex items-center gap-2">
                <span>❌</span> {error}
              </p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded">
              <p className="text-green-700 text-sm flex items-center gap-2">
                <span>✅</span> {success}
              </p>
            </div>
          )}

          {/* Report Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {reportOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setReportType(option.id)}
                className={`p-4 rounded-lg border text-center transition ${
                  reportType === option.id
                    ? 'border-[#135D66] bg-[#135D66]/10 text-[#135D66] shadow-sm'
                    : 'border-gray-200 hover:border-[#135D66] hover:bg-gray-50'
                }`}
              >
                <div className="text-3xl mb-2">{option.icon}</div>
                <div className="text-sm font-medium">{option.label}</div>
                <div className="text-xs text-gray-500 mt-1">{option.description}</div>
              </button>
            ))}
          </div>

          {/* Date Range Filter */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standard (Optional)</label>
              <select
                value={selectedStandard}
                onChange={(e) => setSelectedStandard(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
              >
                <option value="">All Standards</option>
                {[1,2,3,4,5,6,7,8].map(std => (
                  <option key={std} value={std}>Standard {std}</option>
                ))}
              </select>
            </div>
            <button
              onClick={generateReport}
              className="px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition font-medium text-sm"
            >
              Apply Filters
            </button>
          </div>

          {/* Report Data */}
          {reportData && (
            <div className="space-y-4">
              {/* Summary Cards */}
              {reportData.summary && Object.keys(reportData.summary).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.entries(reportData.summary).map(([key, value]) => (
                    <div key={key} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-lg font-bold text-[#003C43]">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Report Table */}
              {reportData.rows && reportData.rows.length > 0 ? (
                <div className="overflow-x-auto">
                  <h3 className="text-lg font-semibold text-[#003C43] mb-3">{reportData.title}</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {reportData.headers.map((header, index) => (
                          <th key={index} className="text-left p-3 text-sm font-semibold text-gray-600">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b hover:bg-gray-50 transition">
                          {Object.values(row).map((value, colIndex) => (
                            <td key={colIndex} className="p-3 text-sm">
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-2 text-sm text-gray-500">
                    Total: {reportData.rows.length} records
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No data available for this report
                </div>
              )}

              {/* Export Buttons */}
              {reportData.rows && reportData.rows.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm flex items-center gap-2"
                  >
                    📊 Export CSV
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm flex items-center gap-2"
                  >
                    📄 Export PDF
                  </button>
                  <button
                    onClick={printReport}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium text-sm flex items-center gap-2"
                  >
                    🖨️ Print
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;