import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoicesAPI } from '../services/api';
import { getDefaultProductImage } from '../utils/productImageHelper';
import useInvoiceStore from '../store/invoiceStore';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';
import { cn } from '../utils/cn';

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchInvoice, loading: storeLoading } = useInvoiceStore();

  const [invoice, setInvoice] = useState(null);
  const [enrichment, setEnrichment] = useState({ image_url: null, description: null, loading: false });
  const [activeTab, setActiveTab] = useState('overview'); // overview, warranty, invoice
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
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
        // Always pass through helper to resolve local assets even if URL is present in DB
        const resolvedImage = getDefaultProductImage(data.product_name, data.brand, data.product_image_url);

        setEnrichment({
          image_url: resolvedImage,
          description: data.description || '',
          loading: false
        });
      } else {
        // Invoice not found, redirect to dashboard
        console.error('Invoice not found for ID:', id);
        navigate('/dashboard');
      }
      setLoading(false);
    };
    loadData();
  }, [id, navigate]);


  const handleDownload = async () => {
    if (!invoice?.id) return;
    try {
      const response = await invoicesAPI.download(invoice.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', invoice.original_filename || `invoice-${invoice.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove this product and its warranty data? This cannot be undone.')) return;

    const result = await useInvoiceStore.getState().deleteInvoice(invoice.id);
    if (result.success) {
      navigate('/dashboard');
    } else {
      alert(result.error);
    }
  };

  if (loading || !invoice) {
    return <LoadingSpinner />;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'info' },
    { id: 'warranty', label: 'Warranty', icon: 'verified_user' },
    { id: 'invoice', label: 'Invoice', icon: 'description' },
  ];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-32">
      <Header title="Product Details" showBack />

      <main className="max-w-2xl mx-auto px-4 pt-6">
        {/* Product Hero */}
        <div className="relative group">
          <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg transition-all duration-500 group-hover:shadow-xl">
            {enrichment.image_url ? (
              <>
                <img
                  src={enrichment.image_url}
                  alt={invoice.product_name}
                  className="w-full h-full object-cover"
                  onLoad={() => console.log('[ProductDetail] Image loaded successfully:', enrichment.image_url)}
                  onError={(e) => console.error('[ProductDetail] Image failed to load:', e, enrichment.image_url)}
                />
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {enrichment.image_url}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                <span className="material-symbols-outlined text-8xl">shopping_bag</span>
                <p className="text-sm mt-2 font-medium">No image available</p>
              </div>
            )}
            {/* Action Overlay */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => navigate(`/invoice/${invoice.id}/edit`)}
                className="size-10 rounded-full bg-white/20 hover:bg-primary backdrop-blur-md text-white border border-white/30 flex items-center justify-center transition-all duration-300 z-20"
                title="Edit Product"
              >
                <span className="material-symbols-outlined text-xl">edit</span>
              </button>
              <button
                onClick={handleDelete}
                className="size-10 rounded-full bg-white/20 hover:bg-rose-500 backdrop-blur-md text-white border border-white/30 flex items-center justify-center transition-all duration-300 z-20"
                title="Delete Warranty"
              >
                <span className="material-symbols-outlined text-xl">delete</span>
              </button>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>

          <div className="absolute bottom-6 left-6 right-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
            <h2 className="text-2xl font-bold truncate">{invoice.product_name}</h2>
            <p className="text-sm opacity-90">{invoice.brand} {invoice.model_number ? ` • ${invoice.model_number}` : ''}</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-8 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
              {invoice.product_name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">{invoice.brand}</span>
              {invoice.model_number && (
                <>
                  <span className="size-1 rounded-full bg-slate-300"></span>
                  <span>{invoice.model_number}</span>
                </>
              )}
            </p>
          </div>
          <Badge status={invoice.warranty_status} />
        </div>

        {/* Custom Tabs */}
        <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl p-1 shadow-sm border border-slate-100 dark:border-slate-800 flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                activeTab === tab.id
                  ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              <span className="material-symbols-outlined text-xl">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {enrichment.description && (
                <Card className="p-6 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/20"></div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">About Product</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm italic">
                    "{enrichment.description}"
                  </p>
                </Card>
              )}

              <Card className="divide-y divide-slate-50 dark:divide-slate-800">
                <div className="p-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Retailer</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{invoice.seller || 'N/A'}</span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Price Paid</span>
                  <span className="text-sm font-bold text-primary">{invoice.formatted_amount || 'N/A'}</span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Purchase Date</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {invoice.purchase_date ? new Date(invoice.purchase_date).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}
                  </span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Category</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{invoice.category || 'General'}</span>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'warranty' && (
            <div className="space-y-4">
              {/* Warranty Overview Card */}
              <Card className="p-6 bg-gradient-to-br from-primary to-blue-700 text-white border-none">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-primary-foreground/70 text-xs font-bold uppercase tracking-widest">Main Expiry</p>
                    <h3 className="text-3xl font-black mt-1">
                      {invoice.expires_at ? new Date(invoice.expires_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'N/A'}
                    </h3>
                  </div>
                  <div className="size-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">verified</span>
                  </div>
                </div>
                <p className="mt-4 text-sm font-medium opacity-90">
                  {invoice.days_remaining} days remaining until coverage ends.
                </p>
              </Card>

              {/* Component Warranties List */}
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-6">
                <span className="material-symbols-outlined text-primary">layers</span>
                Coverage Breakdown
              </h3>

              <div className="space-y-3">
                {invoice.product_warranties?.length > 0 ? (
                  invoice.product_warranties.map((pw) => (
                    <Card key={pw.id} className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                      <div className={cn(
                        "size-12 rounded-2xl flex items-center justify-center shrink-0",
                        pw.status === 'active' ? "bg-emerald-50 text-emerald-600" :
                          pw.status === 'expired' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                      )}>
                        <span className="material-symbols-outlined text-2xl">
                          {pw.component_name === 'compressor' ? 'autostop' :
                            pw.component_name === 'battery' ? 'battery_charging_full' : 'settings_input_component'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">{pw.component_display}</h4>
                          <span className={cn(
                            "text-[10px] font-black uppercase px-2 py-0.5 rounded",
                            pw.status === 'active' ? "bg-emerald-100 text-emerald-700" :
                              pw.status === 'expired' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {pw.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-slate-500">{pw.formatted_duration} Coverage</p>
                          <span className="size-1 rounded-full bg-slate-200"></span>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Exp: {new Date(pw.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-8 text-center border-dashed">
                    <p className="text-slate-400 text-sm">No secondary warranties detected.</p>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="space-y-4">
              <Card className="p-0 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800 p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="size-14 bg-white dark:bg-slate-900 rounded-2xl shadow-sm flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-3xl">picture_as_pdf</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100">Original Invoice</h4>
                      <p className="text-xs text-slate-500 uppercase tracking-tighter mt-0.5">
                        {invoice.original_filename || 'receipt.pdf'}
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleDownload} className="shrink-0 p-3">
                    <span className="material-symbols-outlined">download</span>
                  </Button>
                </div>

                <div className="p-6">
                  <div className="w-full aspect-[4/5] rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center relative overflow-hidden group">
                    <span className="material-symbols-outlined text-6xl text-slate-300 group-hover:scale-110 transition-transform duration-500">visibility</span>
                    <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button onClick={() => window.open(invoice.file_url, '_blank')} variant="secondary">View Full Document</Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background-light via-background-light to-transparent dark:from-background-dark dark:via-background-dark z-30">
        <div className="max-w-2xl mx-auto flex gap-4">
          <Button
            className="flex-1 shadow-lg shadow-primary/20"
            onClick={() => window.location.href = `mailto:claims@support.com?subject=Warranty Claim: ${invoice.product_name}`}
          >
            <span className="material-symbols-outlined mr-2">medical_services</span>
            File Claim
          </Button>
          <Button variant="outline" className="shrink-0 aspect-square p-0 w-14">
            <span className="material-symbols-outlined">share</span>
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
