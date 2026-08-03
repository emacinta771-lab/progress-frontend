import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { paymentAPI } from '../services/api';

const ReceiptScanner = ({ studentId, onSuccess, onClose }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setExtractedData(null);
      setError('');
      setSuccess('');
    }
  };

  // Parse receipt text using regex patterns
  const parseReceiptText = (text) => {
    console.log('📄 Extracted text:', text);
    
    // Common patterns for receipt data
    const patterns = {
      // Amount patterns (supports various formats)
      amount: [
        /total\s*:?\s*[MK$]?\s*([\d,]+\.?[\d]{0,2})/i,
        /amount\s*:?\s*[MK$]?\s*([\d,]+\.?[\d]{0,2})/i,
        /paid\s*:?\s*[MK$]?\s*([\d,]+\.?[\d]{0,2})/i,
        /sum\s*:?\s*[MK$]?\s*([\d,]+\.?[\d]{0,2})/i,
        /due\s*:?\s*[MK$]?\s*([\d,]+\.?[\d]{0,2})/i,
        /([\d,]+\.?[\d]{0,2})\s*(?:mk|malawi|kwacha)/i,
        /mk\s*([\d,]+\.?[\d]{0,2})/i,
        /([\d,]+\.?[\d]{0,2})\s*total/i
      ],
      
      // Student name patterns
      studentName: [
        /student\s*:?\s*([a-zA-Z\s]+)/i,
        /name\s*:?\s*([a-zA-Z\s]+)/i,
        /payer\s*:?\s*([a-zA-Z\s]+)/i,
        /client\s*:?\s*([a-zA-Z\s]+)/i,
        /customer\s*:?\s*([a-zA-Z\s]+)/i
      ],
      
      // Receipt number patterns
      receiptNumber: [
        /receipt\s*#?\s*:?\s*([a-zA-Z0-9\-]+)/i,
        /receipt\s*no\s*:?\s*([a-zA-Z0-9\-]+)/i,
        /inv[a-z]*\s*#?\s*:?\s*([a-zA-Z0-9\-]+)/i,
        /order\s*#?\s*:?\s*([a-zA-Z0-9\-]+)/i,
        /transaction\s*id\s*:?\s*([a-zA-Z0-9\-]+)/i,
        /ref\s*:?\s*([a-zA-Z0-9\-]+)/i
      ],
      
      // Date patterns
      date: [
        /date\s*:?\s*([\d]{1,2}[\/\-][\d]{1,2}[\/\-][\d]{2,4})/i,
        /date\s*:?\s*([a-z]+\s[\d]{1,2},?\s[\d]{4})/i,
        /([\d]{1,2}[\/\-][\d]{1,2}[\/\-][\d]{2,4})/i
      ],
      
      // Payment method patterns
      paymentMethod: [
        /payment\s*method\s*:?\s*([a-zA-Z\s]+)/i,
        /method\s*:?\s*([a-zA-Z\s]+)/i,
        /cash|mobile\s*money|bank\s*transfer|credit|debit|mpesa|airtel/i
      ],
      
      // Student code patterns
      studentCode: [
        /code\s*:?\s*([a-zA-Z0-9\-]+)/i,
        /student\s*id\s*:?\s*([a-zA-Z0-9\-]+)/i,
        /id\s*:?\s*([a-zA-Z0-9\-]+)/i
      ]
    };

    // Extract data using patterns
    const extracted = {
      amount: null,
      student_name: null,
      receipt_number: null,
      date: null,
      payment_method: null,
      student_code: null,
      confidence: 0
    };

    // Try each pattern
    let matches = 0;
    const totalPatterns = Object.values(patterns).reduce((acc, arr) => acc + arr.length, 0);

    for (const [key, patternList] of Object.entries(patterns)) {
      for (const pattern of patternList) {
        const match = text.match(pattern);
        if (match) {
          const value = match[1]?.trim() || match[0]?.trim();
          if (value) {
            extracted[key] = value;
            matches++;
            break;
          }
        }
      }
    }

    // Calculate confidence based on matches found
    extracted.confidence = Math.round((matches / totalPatterns) * 100);
    
    // Clean up amount (remove commas and convert to number)
    if (extracted.amount) {
      extracted.amount = parseFloat(extracted.amount.replace(/,/g, ''));
    }

    console.log('📊 Extracted data:', extracted);
    return extracted;
  };

  // Scan receipt using Tesseract.js
  const handleScanReceipt = async () => {
    if (!image) {
      setError('Please select an image first');
      return;
    }

    setScanning(true);
    setProgress(0);
    setError('');
    setSuccess('');

    try {
      // Convert image to base64 for better OCR
      const reader = new FileReader();
      reader.readAsDataURL(image);
      
      reader.onload = async () => {
        try {
          const base64Image = reader.result;
          
          // Use Tesseract.js for OCR
          const result = await Tesseract.recognize(
            base64Image,
            'eng+fra', // Language: English + French (for common receipt terms)
            {
              logger: (m) => {
                if (m.status === 'recognizing text') {
                  setProgress(Math.round(m.progress * 100));
                }
                console.log(m);
              }
            }
          );

          console.log('✅ OCR Complete:', result);
          
          // Parse the extracted text
          const extractedData = parseReceiptText(result.data.text);
          setExtractedData(extractedData);

          // Auto-save if confidence is high enough
          if (extractedData.confidence > 70 && extractedData.amount) {
            setSuccess(`✅ Receipt scanned successfully! Confidence: ${extractedData.confidence}%`);
          } else {
            setError(`⚠️ Low confidence (${extractedData.confidence}%). Please verify the extracted data.`);
          }

        } catch (err) {
          console.error('OCR Error:', err);
          setError('Failed to scan receipt. Please try again or enter manually.');
        } finally {
          setScanning(false);
        }
      };

    } catch (err) {
      console.error('Scan error:', err);
      setError('Error processing image. Please try again.');
      setScanning(false);
    }
  };

  // Confirm and save payment
  const handleConfirmPayment = async () => {
    if (!extractedData || !extractedData.amount) {
      setError('No valid data extracted from receipt');
      return;
    }

    setScanning(true);
    try {
      const paymentData = {
        amount: extractedData.amount,
        payment_method: extractedData.payment_method || 'Cash',
        receipt_number: extractedData.receipt_number || `RCP-${Date.now()}`,
        payment_period: 'General',
        notes: `Auto-scanned from receipt. Confidence: ${extractedData.confidence}%`
      };

      await paymentAPI.recordPayment(studentId, paymentData);
      
      setSuccess('✅ Payment recorded successfully!');
      
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
      
      // Reset after success
      setTimeout(() => {
        setImage(null);
        setPreview(null);
        setExtractedData(null);
        if (onClose) onClose();
      }, 2000);

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setScanning(false);
    }
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setExtractedData(null);
      setError('');
      setSuccess('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
      <h2 className="text-xl font-bold text-[#003C43] mb-4 flex items-center gap-2">
        <span>📸</span> Scan Receipt
      </h2>

      {/* Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          preview ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-[#135D66]'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {preview ? (
          <div className="space-y-4">
            <img 
              src={preview} 
              alt="Receipt preview" 
              className="max-h-64 mx-auto rounded-lg shadow-md object-contain"
            />
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setImage(null);
                  setPreview(null);
                  setExtractedData(null);
                }}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 transition"
              >
                ✕ Remove
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm text-[#135D66] hover:text-[#003C43] transition"
              >
                📁 Change Image
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-6xl mb-3">📄</div>
            <p className="text-sm text-gray-600">Drag and drop or click to upload</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG, PDF up to 5MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ position: 'absolute' }}
            />
          </div>
        )}
      </div>

      {/* Progress */}
      {scanning && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Scanning receipt...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#135D66] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-3 rounded">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-3 rounded">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Extracted Data Display */}
      {extractedData && !error && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-800 text-sm mb-2">📋 Extracted Data</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {extractedData.student_name && (
              <div>
                <p className="text-gray-500">Student Name</p>
                <p className="font-medium text-gray-800">{extractedData.student_name}</p>
              </div>
            )}
            {extractedData.amount && (
              <div>
                <p className="text-gray-500">Amount</p>
                <p className="font-medium text-green-600">MK {extractedData.amount.toLocaleString()}</p>
              </div>
            )}
            {extractedData.receipt_number && (
              <div>
                <p className="text-gray-500">Receipt #</p>
                <p className="font-mono text-xs text-gray-800">{extractedData.receipt_number}</p>
              </div>
            )}
            {extractedData.payment_method && (
              <div>
                <p className="text-gray-500">Payment Method</p>
                <p className="font-medium text-gray-800">{extractedData.payment_method}</p>
              </div>
            )}
            {extractedData.date && (
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium text-gray-800">{extractedData.date}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500">Confidence</p>
              <p className={`font-medium ${extractedData.confidence > 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                {extractedData.confidence}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        {preview && !extractedData && (
          <button
            onClick={handleScanReceipt}
            disabled={scanning}
            className="flex-1 px-4 py-2 bg-[#135D66] text-white rounded-lg hover:bg-[#0e4a52] transition disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"
          >
            {scanning ? (
              <>
                <span className="animate-spin">⏳</span> Scanning...
              </>
            ) : (
              '🔍 Scan Receipt'
            )}
          </button>
        )}

        {extractedData && extractedData.amount && !error && (
          <button
            onClick={handleConfirmPayment}
            disabled={scanning}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"
          >
            {scanning ? (
              <>
                <span className="animate-spin">⏳</span> Processing...
              </>
            ) : (
              '✅ Confirm Payment'
            )}
          </button>
        )}

        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
        >
          Cancel
        </button>
      </div>

      {/* Manual Entry Option */}
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            // Open manual entry modal or form
            alert('Manual entry form would open here');
          }}
          className="text-xs text-gray-500 hover:text-[#135D66] transition"
        >
          ✏️ Enter payment manually instead
        </button>
      </div>
    </div>
  );
};

export default ReceiptScanner;