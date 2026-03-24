import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useInvoiceStore from '../store/invoiceStore';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { cn } from '../utils/cn';
import { getDefaultProductImage } from '../utils/productImageHelper';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function categoryIcon(cat) {
  const map = {
    electronics: 'laptop_mac',
    appliances: 'home_appliance',
    furniture: 'chair',
    tools: 'handyman',
    sports: 'fitness_center',
    clothing: 'checkroom',
  };
  return map[(cat || '').toLowerCase()] || 'inventory_2';
}

function categoryColor(cat) {
  const map = {
    electronics: 'from-blue-500 to-indigo-600',
    appliances: 'from-emerald-500 to-teal-600',
    furniture: 'from-amber-500 to-orange-500',
    tools: 'from-slate-500 to-slate-700',
    sports: 'from-rose-500 to-pink-600',
    clothing: 'from-purple-500 to-violet-600',
  };
  return map[(cat || '').toLowerCase()] || 'from-primary to-blue-600';
}

function warrantyLabel(status, daysRemaining) {
  if (status === 'active' && daysRemaining != null) {
    if (daysRemaining > 365) {
      const years = Math.floor(daysRemaining / 365);
      return `${years} yr${years > 1 ? 's' : ''} left`;
    }
    if (daysRemaining > 30) {
      const months = Math.floor(daysRemaining / 30);
      return `${months} mo left`;
    }
    return `${daysRemaining} days left`;
  }
  if (status === 'expiring_soon') return 'Expiring soon!';
  if (status === 'expired') return 'Expired';
  return 'Unknown';
}

function statusDot(status) {
  const colors = {
    active: 'bg-emerald-400',
    expiring_soon: 'bg-amber-400',
    expired: 'bg-rose-400',
  };
  return colors[status] || 'bg-slate-400';
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/* ── Sub-components ───────────────────────────────────────────────────────── */
function SummaryPill({ label, value, color }) {
  return (
    <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-1">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">{label}</span>
    </div>
  );
}

function WarrantyProgressBar({ invoice }) {
  const { purchase_date, expires_at, warranty_duration, warranty_status } = invoice;
  if (!purchase_date || !expires_at) return null;

  const start = new Date(purchase_date).getTime();
  const end = new Date(expires_at).getTime();
  const now = Date.now();
  const total = end - start;
  const elapsed = now - start;
  const pct = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;

  const barColor = {
    active: 'bg-emerald-400',
    expiring_soon: 'bg-amber-400',
    expired: 'bg-rose-400',
  }[warranty_status] || 'bg-primary';

  return (
    <div className="mt-2.5">
      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ProductCard({ invoice, onClick, onDelete }) {
  const { warranty_status, days_remaining } = invoice;

  const badgeStyles = {
    active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    expiring_soon: 'bg-amber-50 text-amber-600 border-amber-100',
    expired: 'bg-rose-50 text-rose-500 border-rose-100',
  };

  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      {/* Card image area */}
      <div
        className={`relative h-32 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={getDefaultProductImage(invoice.product_name, invoice.brand, invoice.product_image_url)}
          alt={invoice.product_name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onLoad={() => console.log('[Dashboard] Image loaded:', getDefaultProductImage(invoice.product_name, invoice.brand))}
          onError={(e) => console.error('[Dashboard] Image failed to load:', e, invoice.product_name)}
        />

        {/* Status badge top-right */}
        <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm backdrop-blur-md ${badgeStyles[warranty_status] || badgeStyles.active}`}>
          {warranty_status === 'active' ? '✓ Active' : warranty_status === 'expiring_soon' ? '⚠ Expiring' : '✕ Expired'}
        </span>

        {/* OCR Badge */}
        {invoice.ocr_status === 'processing' && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-[10px] font-black text-white bg-primary px-3 py-1 rounded-full animate-pulse">
              ANALYZING...
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight truncate">
          {invoice.product_name || 'Scanning…'}
        </h4>
        {invoice.brand && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{invoice.brand}</p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`inline-block size-2 rounded-full ${statusDot(warranty_status)}`} />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {warrantyLabel(warranty_status, days_remaining)}
            </span>
          </div>
          <span className="text-xs text-slate-400">{formatDate(invoice.expires_at)}</span>
        </div>

        <WarrantyProgressBar invoice={invoice} />
      </div>
    </button>
  );
}

function ExpiryCard({ item }) {
  const urgency = item.days_remaining <= 7
    ? 'border-l-rose-500 bg-rose-50 dark:bg-rose-900/10'
    : 'border-l-amber-400 bg-amber-50 dark:bg-amber-900/10';

  return (
    <div className={`border-l-4 ${urgency} rounded-r-xl p-3`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
            {item.product_name}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {item.component_display} · {item.warranty_months >= 12
              ? `${Math.round(item.warranty_months / 12)}yr`
              : `${item.warranty_months}mo`} warranty
          </p>
        </div>
        <span className="text-[11px] font-bold text-amber-600 whitespace-nowrap ml-2">
          {item.days_remaining}d left
        </span>
      </div>
    </div>
  );
}

/* ── Main Dashboard ───────────────────────────────────────────────────────── */
export function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setToken, login } = useAuthStore();
  const {
    stats, invoices, dashboard,
    fetchStats, fetchInvoices, fetchDashboard, loading,
  } = useInvoiceStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | active | expiring_soon | expired
  const { deleteInvoice } = useInvoiceStore();

  // Handle auto-login from verification email
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const verified = params.get('verified') === 'true';

    if (token && verified) {
      handleAutoLogin(token);
    }
  }, [location]);

  const handleAutoLogin = async (token) => {
    try {
      // Set token in localStorage
      setToken(token);

      // Verify token and get user data
      const response = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        login({ token, user: userData });

        // Clean URL to remove token parameters
        window.history.replaceState({}, document.title, '/dashboard');
      }
    } catch (error) {
      console.error('Auto-login failed:', error);
      navigate('/login');
    }
  };

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (user) {
      fetchStats();
      fetchInvoices({ per_page: 20 });
      fetchDashboard();
    }
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${searchQuery}`);
  };

  const handleDeleteProduct = async (invoiceId) => {
    const result = await deleteInvoice(invoiceId);
    if (result.success) {
      // Refresh stats and dashboard data
      fetchStats();
      fetchDashboard();
    }
  };

  const filtered = filter === 'all'
    ? invoices
    : invoices.filter((inv) => inv.warranty_status === filter);

  const upcomingExpirations = dashboard?.upcoming_expirations || [];

  return (
    <div className="min-h-screen bg-[#f6f8fb] dark:bg-[#0c1117] pb-28">
      <Header />

      <main className="max-w-lg mx-auto px-4">
        {/* ── Greeting ────────────────────────────────────────────────── */}
        <div className="pt-6 pb-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Hey {user?.first_name || user?.email?.split('@')[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {stats?.active || 0} active warranties tracked
          </p>
        </div>

        {/* ── Search ──────────────────────────────────────────────────── */}
        <form onSubmit={handleSearch} className="py-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 h-12 shadow-sm">
            <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
              placeholder="Search products, brands…"
            />
          </div>
        </form>

        {/* ── Summary Pills ────────────────────────────────────────────── */}
        <div className="flex gap-3 py-2">
          <SummaryPill label="Active" value={stats?.active || 0} color="text-emerald-500" />
          <SummaryPill label="Expiring" value={stats?.expiring_soon || 0} color="text-amber-500" />
          <SummaryPill label="Expired" value={stats?.expired || 0} color="text-rose-500" />
        </div>

        {/* ── Upcoming Expirations ─────────────────────────────────────── */}
        {upcomingExpirations.length > 0 && (
          <section className="mt-5">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-base">schedule</span>
              Expiring Soon
            </h3>
            <div className="space-y-2">
              {upcomingExpirations.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  onClick={() => item.invoice_id && navigate(`/invoice/${item.invoice_id}`)}
                  className="w-full text-left"
                  disabled={!item.invoice_id}
                >
                  <ExpiryCard item={item} />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Filter Tabs ──────────────────────────────────────────────── */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">My Products</h3>
            <button
              onClick={() => navigate('/upload')}
              className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: '✓ Active' },
              { key: 'expiring_soon', label: '⚠ Expiring' },
              { key: 'expired', label: '✕ Expired' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${filter === f.key
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* ── Product Grid ───────────────────────────────────────────── */}
          {loading && !invoices.length ? (
            <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-10 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-700 mb-3 block">
                inventory_2
              </span>
              <p className="text-sm text-slate-400 mb-4">No products yet</p>
              <button
                onClick={() => navigate('/upload')}
                className="btn-primary text-sm"
              >
                Upload First Invoice
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((invoice) => (
                <ProductCard
                  key={invoice.id}
                  invoice={invoice}
                  onClick={() => invoice.id && navigate(`/invoice/${invoice.id}`)}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
