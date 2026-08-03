import React, { useState, useEffect } from 'react';
import { feeAPI } from '../services/api';

const FeeStructure = () => {
  const [feeStructure, setFeeStructure] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    standard: '',
    term: '',
    academic_year: '',
    tuition_fee: '',
    development_fee: '',
    activity_fee: '',
    uniform_fee: '',
    textbook_fee: '',
    other_fees: '',
    total_fees: ''
  });

  useEffect(() => {
    fetchFeeStructure();
  }, []);

  const fetchFeeStructure = async () => {
    try {
      setLoading(true);
      const response = await feeAPI.getFeeStructure();
      setFeeStructure(response.data.fee_structure || []);
    } catch (err) {
      setError('Failed to fetch fee structure');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotal = () => {
    const tuition = parseFloat(formData.tuition_fee) || 0;
    const development = parseFloat(formData.development_fee) || 0;
    const activity = parseFloat(formData.activity_fee) || 0;
    const uniform = parseFloat(formData.uniform_fee) || 0;
    const textbook = parseFloat(formData.textbook_fee) || 0;
    const other = parseFloat(formData.other_fees) || 0;
    
    const total = tuition + development + activity + uniform + textbook + other;
    setFormData(prev => ({
      ...prev,
      total_fees: total.toString()
    }));
  };

  useEffect(() => {
    calculateTotal();
  }, [
    formData.tuition_fee,
    formData.development_fee,
    formData.activity_fee,
    formData.uniform_fee,
    formData.textbook_fee,
    formData.other_fees
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const submitData = {
        ...formData,
        standard: parseInt(formData.standard),
        tuition_fee: parseFloat(formData.tuition_fee) || 0,
        development_fee: parseFloat(formData.development_fee) || 0,
        activity_fee: parseFloat(formData.activity_fee) || 0,
        uniform_fee: parseFloat(formData.uniform_fee) || 0,
        textbook_fee: parseFloat(formData.textbook_fee) || 0,
        other_fees: parseFloat(formData.other_fees) || 0,
        total_fees: parseFloat(formData.total_fees) || 0
      };

      if (editing) {
        await feeAPI.updateFeeStructure(editing, submitData);
        setSuccess('✅ Fee structure updated successfully!');
      } else {
        await feeAPI.create(submitData);
        setSuccess('✅ Fee structure created successfully!');
      }

      setEditing(null);
      setFormData({
        standard: '',
        term: '',
        academic_year: '',
        tuition_fee: '',
        development_fee: '',
        activity_fee: '',
        uniform_fee: '',
        textbook_fee: '',
        other_fees: '',
        total_fees: ''
      });
      
      fetchFeeStructure();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save fee structure');
    }
  };

  const handleEdit = (item) => {
    setEditing(item.id);
    setFormData({
      standard: item.standard,
      term: item.term,
      academic_year: item.academic_year,
      tuition_fee: item.tuition_fee,
      development_fee: item.development_fee || '',
      activity_fee: item.activity_fee || '',
      uniform_fee: item.uniform_fee || '',
      textbook_fee: item.textbook_fee || '',
      other_fees: item.other_fees || '',
      total_fees: item.total_fees
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fee structure?')) {
      try {
        await feeAPI.delete(id);
        fetchFeeStructure();
        setSuccess('✅ Fee structure deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete fee structure');
      }
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setFormData({
      standard: '',
      term: '',
      academic_year: '',
      tuition_fee: '',
      development_fee: '',
      activity_fee: '',
      uniform_fee: '',
      textbook_fee: '',
      other_fees: '',
      total_fees: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading fee structure...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#003C43]">Fee Structure</h1>
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

      {/* Add/Edit Form */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-[#003C43] mb-4">
          {editing ? 'Edit Fee Structure' : 'Add New Fee Structure'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Standard <span className="text-red-500">*</span>
            </label>
            <select
              name="standard"
              value={formData.standard}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
              required
            >
              <option value="">Select Standard</option>
              {[1,2,3,4,5,6,7,8].map(std => (
                <option key={std} value={std}>Standard {std}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Term <span className="text-red-500">*</span>
            </label>
            <select
              name="term"
              value={formData.term}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
              required
            >
              <option value="">Select Term</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="academic_year"
              value={formData.academic_year}
              onChange={handleChange}
              placeholder="e.g., 2024/2025"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tuition Fee (MK) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="tuition_fee"
              value={formData.tuition_fee}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Development Fee (MK)
            </label>
            <input
              type="number"
              name="development_fee"
              value={formData.development_fee}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activity Fee (MK)
            </label>
            <input
              type="number"
              name="activity_fee"
              value={formData.activity_fee}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Uniform Fee (MK)
            </label>
            <input
              type="number"
              name="uniform_fee"
              value={formData.uniform_fee}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Textbook Fee (MK)
            </label>
            <input
              type="number"
              name="textbook_fee"
              value={formData.textbook_fee}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Other Fees (MK)
            </label>
            <input
              type="number"
              name="other_fees"
              value={formData.other_fees}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#135D66] focus:border-[#135D66] transition"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Total Fees (MK)
            </label>
            <input
              type="text"
              name="total_fees"
              value={formData.total_fees}
              readOnly
              className="w-full px-3 py-2 bg-blue-100 border border-blue-300 rounded-lg text-blue-900 font-bold"
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3">
            {editing && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition font-medium text-sm"
            >
              {editing ? 'Update Fee Structure' : 'Add Fee Structure'}
            </button>
          </div>
        </form>
      </div>

      {/* Fee Structure List */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Standard</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Term</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Academic Year</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Tuition</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Total</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left p-3 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {feeStructure.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-6 text-gray-500">
                  No fee structure found
                </td>
              </tr>
            ) : (
              feeStructure.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3 font-medium">Standard {item.standard}</td>
                  <td className="p-3">{item.term}</td>
                  <td className="p-3">{item.academic_year}</td>
                  <td className="p-3">MK {parseFloat(item.tuition_fee).toFixed(2)}</td>
                  <td className="p-3 font-bold text-[#135D66]">MK {parseFloat(item.total_fees).toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeeStructure;