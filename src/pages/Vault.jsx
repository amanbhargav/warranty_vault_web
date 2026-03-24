import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useInvoiceStore from '../store/invoiceStore';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function Vault() {
  const navigate = useNavigate();
  const { invoices, fetchInvoices, loading } = useInvoiceStore();
  const [filterStatus, setFilterStatus] = useState('all');
  
  useEffect(() => {
    fetchInvoices();
  }, []);

  function filteredInvoices() {
    let filtered = invoices;

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(invoice => {
        if (filterStatus === 'active') return invoice.warranty_status === 'active';
        if (filterStatus === 'expiring') return invoice.warranty_status === 'expiring_soon';
        if (filterStatus === 'expired') return invoice.warranty_status === 'expired';
        return true;
      });
    }

    return filtered;
  }
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
      <Header title="My Vault" />
      
      <main className="max-w-md mx-auto px-4 py-4">
        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
          <button 
            onClick={() => setFilterStatus('all')}
            className={`h-9 px-5 rounded-full text-sm font-semibold whitespace-nowrap ${
              filterStatus === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All Items
          </button>
          <button 
            onClick={() => setFilterStatus('active')}
            className={`h-9 px-5 rounded-full text-sm font-medium whitespace-nowrap ${
              filterStatus === 'active' 
                ? 'bg-primary text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Active
          </button>
          <button 
            onClick={() => setFilterStatus('expiring')}
            className={`h-9 px-5 rounded-full text-sm font-medium whitespace-nowrap ${
              filterStatus === 'expiring' 
                ? 'bg-primary text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Expiring
          </button>
          <button 
            onClick={() => setFilterStatus('expired')}
            className={`h-9 px-5 rounded-full text-sm font-medium whitespace-nowrap ${
              filterStatus === 'expired' 
                ? 'bg-primary text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Expired
          </button>
        </div>
        
        {/* Invoices List */}
        <div className="space-y-3">
          {filteredInvoices().length === 0 ? (
            <Card className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inventory_2</span>
              <p className="text-slate-500 dark:text-slate-400">
                {filterStatus !== 'all' ? 'No invoices found for this filter' : 'No invoices found'}
              </p>
              {filterStatus === 'all' && (
                <button 
                  onClick={() => navigate('/upload')}
                  className="text-primary font-medium mt-2"
                >
                  Upload your first receipt
                </button>
              )}
            </Card>
          ) : (
            filteredInvoices().map((invoice) => (
              <Card
                key={invoice.id}
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => navigate(`/invoice/${invoice.id}`)}
              >
                <div className="size-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    {invoice.category === 'Electronics' ? 'laptop_mac' : 
                     invoice.category === 'Appliances' ? 'home_appliance' : 
                     invoice.category === 'Furniture' ? 'chair' : 'shopping_bag'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {invoice.product_name}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {invoice.brand} • {invoice.formatted_amount}
                  </p>
                  <div className="flex items-center text-xs text-slate-400 mt-1">
                    <span className="material-symbols-outlined text-xs mr-1">history</span>
                    {invoice.days_remaining} days remaining
                  </div>
                </div>
                <Badge status={invoice.warranty_status} />
              </Card>
            ))
          )}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
