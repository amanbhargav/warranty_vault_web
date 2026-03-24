import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { workflowAPI } from '../services/api';

const InvoiceWorkflow = () => {
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'manual'
  const [processingStatus, setProcessingStatus] = useState(null);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [manualForm, setManualForm] = useState({
    product_name: '',
    brand: '',
    model_number: '',
    seller: '',
    purchase_date: '',
    amount: '',
    warranty_duration: '',
    category: ''
  });
  const [warranties, setWarranties] = useState([]);

  const { getRootProps, getInputProps, isDragActive, isUploading } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: false,
    onDrop: handleFileUpload
  });

  async function handleFileUpload(files) {
    const file = files[0];
    if (!file) return;

    try {
      setProcessingStatus('uploading');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('seller', manualForm.seller);
      formData.append('category', manualForm.category);

      const result = await workflowAPI.uploadAndProcess(formData);

      if (result.success) {
        setCurrentInvoice(result);
        setProcessingStatus('processing');
        pollProcessingStatus(result.invoice_id);
      } else {
        setProcessingStatus('error');
        alert(result.error);
      }
    } catch (error) {
      setProcessingStatus('error');
      alert('Upload failed: ' + error.message);
    }
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    
    try {
      setProcessingStatus('processing');

      const result = await workflowAPI.manualEntry({
        ...manualForm,
        warranties: warranties
      });

      if (result.success) {
        setCurrentInvoice(result);
        setProcessingStatus('completed');
      } else {
        setProcessingStatus('error');
        alert(result.error);
      }
    } catch (error) {
      setProcessingStatus('error');
      alert('Manual entry failed: ' + error.message);
    }
  }

  async function pollProcessingStatus(invoiceId) {
    const poll = async () => {
      try {
        const result = await workflowAPI.getStatus(invoiceId);

        if (result.success) {
          setCurrentInvoice(prev => ({
            ...prev,
            invoice: result.invoice
          }));

          if (result.status.processing_complete) {
            setProcessingStatus('completed');
          } else {
            setTimeout(poll, 2000); // Poll every 2 seconds
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        setTimeout(poll, 5000); // Retry in 5 seconds
      }
    };

    poll();
  }

  function addWarranty() {
    setWarranties([...warranties, {
      component_name: '',
      warranty_months: ''
    }]);
  }

  function updateWarranty(index, field, value) {
    const updated = [...warranties];
    updated[index][field] = value;
    setWarranties(updated);
  }

  function removeWarranty(index) {
    setWarranties(warranties.filter((_, i) => i !== index));
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Add Product or Invoice</h1>

      {/* Mode Toggle */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setUploadMode('file')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            uploadMode === 'file'
              ? 'bg-white shadow-sm text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Upload className="inline-block w-4 h-4 mr-2" />
          Upload Invoice
        </button>
        <button
          onClick={() => setUploadMode('manual')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            uploadMode === 'manual'
              ? 'bg-white shadow-sm text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <FileText className="inline-block w-4 h-4 mr-2" />
          Manual Entry
        </button>
      </div>

      {/* File Upload Mode */}
      {uploadMode === 'file' && (
        <div className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-lg">Drop the invoice here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Drag & drop invoice here, or click to select</p>
                <p className="text-sm text-gray-500">Supports PDF, JPG, PNG</p>
              </div>
            )}
          </div>

          {/* Optional seller/category info */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Seller (optional)"
              value={manualForm.seller}
              onChange={(e) => setManualForm({...manualForm, seller: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={manualForm.category}
              onChange={(e) => setManualForm({...manualForm, category: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category (optional)</option>
              <option value="electronics">Electronics</option>
              <option value="appliances">Appliances</option>
              <option value="furniture">Furniture</option>
              <option value="tools">Tools</option>
              <option value="sports">Sports</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>
      )}

      {/* Manual Entry Mode */}
      {uploadMode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Product Name *"
              value={manualForm.product_name}
              onChange={(e) => setManualForm({...manualForm, product_name: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Brand *"
              value={manualForm.brand}
              onChange={(e) => setManualForm({...manualForm, brand: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Model Number"
              value={manualForm.model_number}
              onChange={(e) => setManualForm({...manualForm, model_number: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Seller"
              value={manualForm.seller}
              onChange={(e) => setManualForm({...manualForm, seller: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              placeholder="Purchase Date *"
              value={manualForm.purchase_date}
              onChange={(e) => setManualForm({...manualForm, purchase_date: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Amount ($)"
              value={manualForm.amount}
              onChange={(e) => setManualForm({...manualForm, amount: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Warranty Duration (months)"
              value={manualForm.warranty_duration}
              onChange={(e) => setManualForm({...manualForm, warranty_duration: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={manualForm.category}
              onChange={(e) => setManualForm({...manualForm, category: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              <option value="electronics">Electronics</option>
              <option value="appliances">Appliances</option>
              <option value="furniture">Furniture</option>
              <option value="tools">Tools</option>
              <option value="sports">Sports</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Component Warranties */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Component Warranties (Optional)</h3>
              <button
                type="button"
                onClick={addWarranty}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add Component Warranty
              </button>
            </div>

            {warranties.map((warranty, index) => (
              <div key={index} className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Component Name (e.g., compressor, battery)"
                  value={warranty.component_name}
                  onChange={(e) => updateWarranty(index, 'component_name', e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Warranty (months)"
                  value={warranty.warranty_months}
                  onChange={(e) => updateWarranty(index, 'warranty_months', e.target.value)}
                  className="w-32 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeWarranty(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={processingStatus === 'processing'}
            className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Add Product
          </button>
        </form>
      )}

      {/* Processing Status */}
      {processingStatus && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Processing Status</h3>
          
          {processingStatus === 'uploading' && (
            <div className="flex items-center text-blue-600">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Uploading file...
            </div>
          )}

          {processingStatus === 'processing' && currentInvoice && (
            <div>
              <div className="flex items-center text-blue-600 mb-4">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing invoice...
              </div>
              
              <div className="space-y-2">
                {currentInvoice.next_steps?.map((step, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-gray-400" />
                    {step}
                  </div>
                ))}
              </div>

              {currentInvoice.invoice && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Extracted Information:</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Product:</strong> {currentInvoice.invoice.product_name || 'Processing...'}</p>
                    <p><strong>Brand:</strong> {currentInvoice.invoice.brand || 'Processing...'}</p>
                    <p><strong>Purchase Date:</strong> {currentInvoice.invoice.purchase_date || 'Processing...'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {processingStatus === 'completed' && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              Product added successfully! View it on your dashboard.
            </div>
          )}

          {processingStatus === 'error' && (
            <div className="flex items-center text-red-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              Processing failed. Please try again or contact support.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoiceWorkflow;
