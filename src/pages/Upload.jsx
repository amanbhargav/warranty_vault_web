import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import useInvoiceStore from '../store/invoiceStore';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Card } from '../components/Card';
import { cn } from '../utils/cn';

export function Upload() {
  const navigate = useNavigate();
  const { createInvoice, pollOcrStatus, updateInvoice, loading: storeLoading } = useInvoiceStore();

  const [step, setStep] = useState('upload'); // upload, scanning, review, manual
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const [ocrError, setOcrError] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);

  const fileInputRef = useRef(null);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = window.URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleStartOcr = async () => {
    if (!selectedFile) return;

    setStep('scanning');
    const formData = new FormData();
    formData.append('file', selectedFile);

    const result = await createInvoice(formData);

    if (result.success) {
      setInvoiceId(result.invoice.id);
      // Start polling
      pollOcrStatus(result.invoice.id, (data) => {
        if (data.ocr_status === 'completed') {
          setOcrData(data.extracted_fields);
          // Pre-fill form for review
          Object.keys(data.extracted_fields).forEach(key => {
            setValue(key, data.extracted_fields[key]);
          });
          setStep('review');
        } else if (data.ocr_status === 'failed') {
          setOcrError("We couldn't extract data automatically. Please enter details manually.");
          setStep('manual');
        } else {
          // Update live preview during scanning if available
          setOcrData(prev => ({ ...prev, ...data.extracted_fields }));
        }
      });
    } else {
      alert(result.error);
      setStep('upload');
    }
  };

  const handleFinalSubmit = async (data) => {
    if (invoiceId) {
      const result = await updateInvoice(invoiceId, data);
      if (result.success) {
        // Show success toast
        showToast('Product Updated!', `${data.product_name} has been saved successfully.`, 'success');
        navigate(`/invoice/${invoiceId}`);
      }
    } else {
      // Direct manual entry
      const formData = new FormData();
      Object.keys(data).forEach(key => formData.append(key, data[key]));
      const result = await createInvoice(formData);
      if (result.success) {
        // Show success toast
        showToast('Product Saved!', `${data.product_name} has been added to your warranty vault.`, 'success');
        navigate(`/invoice/${result.invoice.id}`);
      }
    }
  };

  // Toast notification helper
  const showToast = (title, message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      z-index: 10002;
      min-width: 320px;
      max-width: 400px;
      animation: slideInRight 0.3s ease-out;
      border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    `;
    toast.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; gap: 12px;">
        <div style="flex: 1;">
          <strong style="display: block; margin-bottom: 4px; color: #1f2937; font-size: 14px;">${title}</strong>
          <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.4;">${message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #9ca3af;">&times;</button>
      </div>
      <style>
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.remove();
      }
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
      <Header title="Add Document" showBack />

      <main className="max-w-xl mx-auto px-4 py-8">
        {step === 'upload' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 italic tracking-tight">
                SMART <span className="text-primary NOT-italic">SCAN</span>
              </h1>
              <p className="text-slate-500 text-sm mt-2 font-medium">Capture any receipt to automatically extract warranty info.</p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "group relative border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all duration-500 cursor-pointer overflow-hidden",
                selectedFile
                  ? "border-primary/40 bg-primary/5"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              )}
            >
              {previewUrl ? (
                <div className="absolute inset-0 z-0">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-20 grayscale" />
                </div>
              ) : null}

              <div className="relative z-10 text-center">
                <div className="size-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <span className="material-symbols-outlined text-4xl">add_a_photo</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {selectedFile ? selectedFile.name : 'Select Invoice or Photo'}
                </h3>
                <p className="text-xs text-slate-400 mt-2 font-semibold uppercase tracking-widest">PDF, JPG or PNG</p>
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileSelect} className="hidden" />

            <div className="mt-10 space-y-4">
              {selectedFile ? (
                <Button onClick={handleStartOcr} className="w-full py-4 text-lg shadow-xl shadow-primary/20">
                  Magic Scan ✨
                </Button>
              ) : (
                <Button onClick={() => setStep('manual')} variant="outline" className="w-full">
                  Enter Details Manually
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 'scanning' && (
          <div className="text-center py-10 animate-in zoom-in-95 duration-700">
            {previewUrl && (
              <div className="max-w-[200px] mx-auto mb-8 rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 animate-scanning relative">
                <img src={previewUrl} alt="Scanning" className="w-full h-auto opacity-60 grayscale" />
              </div>
            )}

            <div className="relative inline-block mt-4">
              <div className="size-32 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-4 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-4xl animate-pulse">document_scanner</span>
              </div>
            </div>

            <h2 className="text-2xl font-black mt-8 text-slate-900 dark:text-slate-100">Analyzing Invoice...</h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">Extracting product name, brand and warranty terms.</p>

            <div className="mt-12 max-w-xs mx-auto space-y-3">
              {[
                { label: 'Merchant Detection', done: true },
                { label: 'Product Recognition', done: !!ocrData?.product_name },
                { label: 'Warranty Math', done: !!ocrData?.warranty_duration },
              ].map((task, i) => (
                <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-50 dark:border-slate-800 text-left">
                  <span className={cn(
                    "material-symbols-outlined text-sm rounded-full p-1",
                    task.done ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-300"
                  )}>
                    {task.done ? 'check' : 'hourglass_bottom'}
                  </span>
                  <span className={cn("text-xs font-bold", task.done ? "text-slate-700 dark:text-slate-200" : "text-slate-400")}>
                    {task.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review & Manual forms */}
        {(step === 'review' || step === 'manual') && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <Card className="p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-primary"></div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {step === 'review' ? 'Verify Details' : 'Manual Entry'}
                </h3>
                <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
                  Step 2 of 2
                </span>
              </div>

              <form onSubmit={handleSubmit(handleFinalSubmit)} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Product Identity</label>
                  <Input placeholder="What did you buy?" {...register('product_name', { required: true })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Brand</label>
                    <Input placeholder="Apple, Sony..." {...register('brand')} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Model #</label>
                    <Input placeholder="Optional" {...register('model_number')} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Purchase Context</label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input type="date" {...register('purchase_date', { required: true })} />
                    <Input type="number" placeholder="Price" step="0.01" {...register('amount')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Warranty (Months)</label>
                    <Input type="number" {...register('warranty_duration')} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Category</label>
                    <select {...register('category')} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold text-sm">
                      <option value="Electronics">Electronics</option>
                      <option value="Appliances">Appliances</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Tools">Tools</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Retailer</label>
                  <Input placeholder="Where was it bought?" {...register('seller')} />
                </div>

                <div className="pt-8 flex flex-col gap-3">
                  <Button type="submit" className="w-full py-4 text-lg">
                    Finish & Save
                  </Button>
                  <button type="button" onClick={() => setStep('upload')} className="text-slate-400 text-xs font-bold hover:text-slate-600">
                    Go Back
                  </button>
                </div>
              </form>
            </Card>

            {ocrError && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-500">warning</span>
                <p className="text-xs text-amber-700 font-medium">{ocrError}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
