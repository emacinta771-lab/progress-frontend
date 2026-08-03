import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../services/api';

const StudentForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    student_code: '',
    student_id: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    date_of_birth: '',
    gender: 'Male',
    phone: '',
    village: '',
    traditional_authority: '',
    district: '',
    division: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    parent_occupation: '',
    parent_relationship: 'Father',
    parent_village: '',
    current_standard: 1,
    current_class: 'A',
    academic_year: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    total_fees: 0,
    fee_payment_plan: 'Full',
    scholarship_type: 'None',
    has_uniform: false,
    has_textbooks: false,
    meals_program: 'None',
    notes: ''
  });

  const totalSteps = 5;

  const steps = [
    { number: 1, title: 'Personal Info' },
    { number: 2, title: 'Parent/Guardian' },
    { number: 3, title: 'Academic' },
    { number: 4, title: 'Emergency & Finance' },
    { number: 5, title: 'Additional' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Generate student_id if not provided
      const studentId = formData.student_id || `STD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Prepare the data to match exactly what the database expects
      const submitData = {
        student_code: formData.student_code || studentId,
        student_id: studentId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name || null,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        phone: formData.phone || null,
        village: formData.village || null,
        traditional_authority: formData.traditional_authority || null,
        district: formData.district,
        division: formData.division || null,
        parent_name: formData.parent_name,
        parent_phone: formData.parent_phone,
        parent_email: formData.parent_email || null,
        parent_occupation: formData.parent_occupation || null,
        parent_relationship: formData.parent_relationship,
        parent_village: formData.parent_village || null,
        current_standard: parseInt(formData.current_standard),
        current_class: formData.current_class || null,
        enrollment_date: new Date().toISOString().split('T')[0],
        academic_year: formData.academic_year,
        enrollment_status: 'Active',
        previous_grade_promoted: true,
        performance_level: 'Satisfactory',
        blood_type: null,
        allergies: null,
        medical_conditions: null,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        emergency_contact_relationship: formData.emergency_contact_relationship || null,
        total_fees: parseFloat(formData.total_fees) || 0,
        amount_paid: 0,
        outstanding_balance: parseFloat(formData.total_fees) || 0,
        fee_payment_plan: formData.fee_payment_plan,
        scholarship_type: formData.scholarship_type,
        financial_hold: false,
        has_uniform: formData.has_uniform,
        has_textbooks: formData.has_textbooks,
        meals_program: formData.meals_program,
        notes: formData.notes || null
      };

      console.log('Submitting data:', submitData);

      const response = await studentAPI.create(submitData);
      console.log('Response:', response);
      
      setSuccess('Student registered successfully!');
      
      // Reset form
      setFormData({
        student_code: '',
        student_id: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        date_of_birth: '',
        gender: 'Male',
        phone: '',
        village: '',
        traditional_authority: '',
        district: '',
        division: '',
        parent_name: '',
        parent_phone: '',
        parent_email: '',
        parent_occupation: '',
        parent_relationship: 'Father',
        parent_village: '',
        current_standard: 1,
        current_class: 'A',
        academic_year: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relationship: '',
        total_fees: 0,
        fee_payment_plan: 'Full',
        scholarship_type: 'None',
        has_uniform: false,
        has_textbooks: false,
        meals_program: 'None',
        notes: ''
      });
      setCurrentStep(1);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Failed to register student');
    } finally {
      setLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Student Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="student_code"
                value={formData.student_code}
                onChange={handleChange}
                placeholder="e.g., ST-001"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Student ID
              </label>
              <input
                type="text"
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                placeholder="Auto-generated if left blank"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Middle Name</label>
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+265 888 123 456"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Village</label>
              <input
                type="text"
                name="village"
                value={formData.village}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Traditional Authority</label>
              <input
                type="text"
                name="traditional_authority"
                value={formData.traditional_authority}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                District <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Division</label>
              <input
                type="text"
                name="division"
                value={formData.division}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Parent/Guardian Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="parent_name"
                value={formData.parent_name}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Parent Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="parent_phone"
                value={formData.parent_phone}
                onChange={handleChange}
                placeholder="+265 888 123 456"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Parent Email</label>
              <input
                type="email"
                name="parent_email"
                value={formData.parent_email}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Parent Occupation</label>
              <input
                type="text"
                name="parent_occupation"
                value={formData.parent_occupation}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Relationship <span className="text-red-500">*</span>
              </label>
              <select
                name="parent_relationship"
                value={formData.parent_relationship}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
                required
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Parent Village</label>
              <input
                type="text"
                name="parent_village"
                value={formData.parent_village}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Current Standard <span className="text-red-500">*</span>
              </label>
              <select
                name="current_standard"
                value={formData.current_standard}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
                required
              >
                {[1,2,3,4,5,6,7,8].map(std => (
                  <option key={std} value={std}>Standard {std}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Class</label>
              <select
                name="current_class"
                value={formData.current_class}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="academic_year"
                value={formData.academic_year}
                onChange={handleChange}
                placeholder="e.g., 2024/2025"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
                required
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Emergency Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Emergency Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
                placeholder="+265 888 123 456"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Relationship</label>
              <input
                type="text"
                name="emergency_contact_relationship"
                value={formData.emergency_contact_relationship}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Total Fees (MK)</label>
              <input
                type="number"
                name="total_fees"
                value={formData.total_fees}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Plan</label>
              <select
                name="fee_payment_plan"
                value={formData.fee_payment_plan}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
              >
                <option value="Full">Full</option>
                <option value="Termly">Termly</option>
                <option value="Monthly">Monthly</option>
                <option value="Installment">Installment</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Scholarship</label>
              <select
                name="scholarship_type"
                value={formData.scholarship_type}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
              >
                <option value="None">None</option>
                <option value="Government">Government</option>
                <option value="NGO">NGO</option>
                <option value="Church">Church</option>
                <option value="Corporate">Corporate</option>
                <option value="Individual">Individual</option>
                <option value="Merit">Merit</option>
              </select>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              <input
                type="checkbox"
                name="has_uniform"
                checked={formData.has_uniform}
                onChange={handleChange}
                className="w-4 h-4 text-[#77B0AA] focus:ring-[#77B0AA] rounded"
              />
              <label className="text-sm text-gray-700">Has Uniform</label>
            </div>
            
            <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              <input
                type="checkbox"
                name="has_textbooks"
                checked={formData.has_textbooks}
                onChange={handleChange}
                className="w-4 h-4 text-[#77B0AA] focus:ring-[#77B0AA] rounded"
              />
              <label className="text-sm text-gray-700">Has Textbooks</label>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Meals Program</label>
              <select
                name="meals_program"
                value={formData.meals_program}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
              >
                <option value="None">None</option>
                <option value="Full">Full</option>
                <option value="Partial">Partial</option>
              </select>
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#77B0AA] focus:border-[#77B0AA] transition"
                placeholder="Any additional notes..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-6xl mx-auto">
      {/* Navigation Pane - Back to Dashboard */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <button
          onClick={() => navigate('/teacher-dashboard')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#77B0AA] transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
        <div className="text-xs text-gray-400">
          {currentStep} of {totalSteps} steps
        </div>
      </div>

      {/* Header */}
      <div className="bg-[#77B0AA] text-white px-6 py-4 rounded-t-lg -mt-6 -mx-6 mb-6">
        <h2 className="text-2xl font-bold">
          Register New Student
        </h2>
        <p className="text-white/80 text-sm mt-1">
          Step {currentStep} of {totalSteps} - {steps[currentStep - 1].title}
        </p>
      </div>
      
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 -translate-y-1/2"></div>
          
          <div 
            className="absolute left-0 top-1/2 h-1 bg-[#77B0AA] -translate-y-1/2 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          ></div>
          
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center relative z-10">
              <button
                onClick={() => setCurrentStep(step.number)}
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300
                  ${currentStep >= step.number 
                    ? 'bg-[#77B0AA] text-white shadow-md' 
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                  }
                  ${currentStep === step.number ? 'ring-3 ring-[#77B0AA]/30 scale-105' : ''}
                `}
              >
                {currentStep > step.number ? '✓' : step.number}
              </button>
              <span className={`text-[10px] mt-1.5 font-medium ${currentStep >= step.number ? 'text-[#77B0AA]' : 'text-gray-400'}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Error & Success Messages */}
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

      <form onSubmit={handleSubmit}>
        {/* Step Content */}
        <div className="mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-200">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition font-medium text-sm"
              >
                Previous
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-5 py-2 bg-[#77B0AA] text-white rounded hover:bg-[#5c9a94] transition font-medium text-sm"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#77B0AA] text-white rounded hover:bg-[#5c9a94] transition disabled:opacity-50 font-medium text-sm"
              >
                {loading ? 'Registering...' : 'Register Student'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default StudentForm;