import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import useInvoiceStore from '../store/invoiceStore';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Card } from '../components/Card';
import { cn } from '../utils/cn';

export function EditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchInvoice, updateInvoice, loading: storeLoading } = useInvoiceStore();

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm();

    useEffect(() => {
        const loadInvoice = async () => {
            // Only load if we have a valid ID
            if (!id || id === 'undefined') {
                console.error('Invalid invoice ID:', id);
                navigate('/dashboard');
                return;
            }

            setLoading(true);
            const data = await fetchInvoice(id);
            if (data) {
                setInvoice(data);
                // Pre-fill form
                Object.keys(data).forEach(key => {
                    if (key === 'purchase_date' && data[key]) {
                        setValue(key, data[key].split('T')[0]);
                    } else {
                        setValue(key, data[key]);
                    }
                });
            } else {
                // Invoice not found, redirect to dashboard
                console.error('Invoice not found for ID:', id);
                navigate('/dashboard');
            }
            setLoading(false);
        };
        loadInvoice();
    }, [id, setValue, navigate, fetchInvoice]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const url = window.URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const onSubmit = async (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });

        if (selectedFile) {
            formData.append('file', selectedFile);
        }

        const result = await updateInvoice(id, formData);
        if (result.success) {
            navigate(`/invoice/${id}`);
        } else {
            alert(result.error);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!invoice) return <div className="p-8 text-center text-slate-500">Product not found.</div>;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
            <Header title="Edit Product" showBack />

            <main className="max-w-xl mx-auto px-4 py-8">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-primary"></div>

                        <div className="mb-8">
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                                Update Information
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 font-medium italic">Feel free to refine the product details or replace the receipt.</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Receipt Replacement Section */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Receipt / Invoice</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        "relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden group",
                                        selectedFile ? "border-primary/40 bg-primary/5" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                                    )}
                                >
                                    {previewUrl || invoice.file_url ? (
                                        <div className="absolute inset-0 z-0 opacity-10">
                                            <img
                                                src={previewUrl || invoice.file_url}
                                                alt="Background"
                                                className="w-full h-full object-cover grayscale"
                                            />
                                        </div>
                                    ) : null}

                                    <div className="relative z-10 text-center">
                                        <span className="material-symbols-outlined text-3xl text-primary mb-2 block group-hover:scale-110 transition-transform">
                                            {selectedFile ? 'file_present' : 'receipt_long'}
                                        </span>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                            {selectedFile ? selectedFile.name : 'Replace Current Receipt?'}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-tighter">Click to browse</p>
                                    </div>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileSelect} className="hidden" />
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Product Name</label>
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
                            </div>

                            <div className="pt-8 flex flex-col gap-3">
                                <Button type="submit" className="w-full py-4 text-lg shadow-xl shadow-primary/20" disabled={storeLoading}>
                                    {storeLoading ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/invoice/${id}`)}
                                    className="text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors"
                                >
                                    Discard Changes
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            </main>
        </div>
    );
}
