import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useInvoiceStore from '../store/invoiceStore';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function Timeline() {
  const navigate = useNavigate();
  const { invoices, fetchInvoices, loading } = useInvoiceStore();

  useEffect(() => {
    fetchInvoices();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const sortedInvoices = [...invoices].sort((a, b) => {
    if (!a.expires_at) return 1;
    if (!b.expires_at) return -1;
    return new Date(a.expires_at) - new Date(b.expires_at);
  });

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
      <Header title="Warranty Timeline" />

      <main className="max-w-md mx-auto px-4">
        {/* Summary Card */}
        <Card className="mt-4 p-4 bg-primary/5 border-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Coverage Value
              </p>
              <p className="text-2xl font-bold text-primary mt-1">
                ₨. {invoices.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-primary text-white p-3 rounded-lg">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
          </div>
        </Card>

        {/* Timeline */}
        <div className="mt-8 space-y-0 relative">
          {sortedInvoices.length > 0 ? (
            sortedInvoices.map((invoice, index) => (
              <div key={invoice.id} className="flex flex-col">
                {/* Main Invoice Warranty */}
                <div
                  className="grid grid-cols-[48px_1fr] gap-x-3 cursor-pointer group"
                  onClick={() => navigate(`/invoice/${invoice.id}`)}
                >
                  <div className="flex flex-col items-center">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full border-4 border-white dark:border-background-dark shadow-sm z-10 transition-transform group-hover:scale-110 ${invoice.warranty_status === 'active' ? 'bg-green-100 dark:bg-green-900/40 text-green-600' :
                        invoice.warranty_status === 'expiring_soon' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' :
                          'bg-red-100 dark:bg-red-900/40 text-red-600'
                      }`}>
                      <span className="material-symbols-outlined text-2xl font-black">
                        {invoice.warranty_status === 'active' ? 'verified' :
                          invoice.warranty_status === 'expiring_soon' ? 'priority_high' :
                            'cancel'}
                      </span>
                    </div>
                    {(index < sortedInvoices.length - 1 || (invoice.product_warranties && invoice.product_warranties.length > 0)) && (
                      <div className="w-0.5 bg-slate-200 dark:bg-slate-700 h-full -mt-2"></div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col pb-8 pt-1">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-2">
                        <p className="text-[15px] font-black leading-tight text-slate-900 dark:text-slate-100 mb-1">
                          {invoice.product_name}
                        </p>
                        <div className="flex flex-col">
                          <p className={`text-xs font-bold leading-none mb-1 ${invoice.warranty_status === 'expiring_soon'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-500 dark:text-slate-400'
                            }`}>
                            {invoice.warranty_status === 'expired'
                              ? `Expired ${invoice.days_remaining} days ago`
                              : `${invoice.days_remaining} days remaining`
                            }
                          </p>
                          <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                            Exp: {formatDate(invoice.expires_at)}
                          </p>
                        </div>
                      </div>
                      <Badge status={invoice.warranty_status} className="shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Sub-warranties (Compressor, Battery, etc.) */}
                {invoice.product_warranties && invoice.product_warranties.filter(pw => pw.component_name !== 'product').map((pw, pwIndex) => (
                  <div key={pw.id} className="grid grid-cols-[48px_1fr] gap-x-3">
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 bg-slate-200 dark:bg-slate-700 h-full -mt-2"></div>
                      <div className="bg-slate-100 dark:bg-slate-800 size-3 rounded-full border-2 border-white dark:border-background-dark z-10 -mb-2"></div>
                      {(index < sortedInvoices.length - 1 || pwIndex < invoice.product_warranties.length - 1) && (
                        <div className="w-0.5 bg-slate-200 dark:bg-slate-700 h-full"></div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col pb-6 pt-0">
                      <div className="bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm ml-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                            {pw.component_display} Coverage
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            Exp: {formatDate(pw.expires_at)}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {pw.days_remaining} days left
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-slate-200">inventory_2</span>
              <p className="text-slate-400 mt-4 font-bold">No active warranties found</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
