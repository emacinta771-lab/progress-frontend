import React, { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';

const FeeManagement = ({ studentId, onClose }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'Cash',
    receipt_number: '',
    payment_period: 'Term 1',
    notes: ''
  });

  useEffect(() => {
    fetchStudent();
  }, [studentId]);

  const fetchStudent = async () => {
    try {
      const response = await studentAPI.getFees(studentId);
      setStudent(response.data.feeStatus);
    } catch (err) {
      setError('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await studentAPI.recordPayment(studentId, {
        amount: parseFloat(paymentData.amount),
        method: paymentData.payment_method,
        receipt_number: paymentData.receipt_number || `RCP-${Date.now()}`,
        payment_period: paymentData.payment_period,
        notes: paymentData.notes
      });
      setSuccess('✅ Payment recorded successfully!');
      fetchStudent();
      setPaymentData({
        amount: '',
        payment_method: 'Cash',
        receipt_number: '',
        payment_period: 'Term 1',
        notes: ''
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !student) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">💰 Fee Management</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {student && (
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Student</p>
            <p className="font-semibold">{student.first_name} {student.last_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Fees</p>
            <p className="font-semibold">MK {parseFloat(student.total_fees).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Amount Paid</p>
            <p className="font-semibold text-green-600">MK {parseFloat(student.amount_paid).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Outstanding Balance</p>
            <p className={`font-semibold ${student.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              MK {parseFloat(student.outstanding_balance).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleRecordPayment} className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Record Payment</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (MK) *</label>
            <input
              type="number"
              name="amount"
              value={paymentData.amount}
              onChange={handlePaymentChange}
              required
              min="0.01"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              name="payment_method"
              value={paymentData.payment_method}
              onChange={handlePaymentChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number</label>
            <input
              type="text"
              name="receipt_number"
              value={paymentData.receipt_number}
              onChange={handlePaymentChange}
              placeholder="Auto-generated if empty"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Period</label>
            <select
              name="payment_period"
              value={paymentData.payment_period}
              onChange={handlePaymentChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
              <option value="Full Year">Full Year</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            value={paymentData.notes}
            onChange={handlePaymentChange}
            rows="2"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Any additional notes..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ✅ ADD THIS DEFAULT EXPORT
export default FeeManagement;