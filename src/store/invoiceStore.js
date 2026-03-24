import { create } from 'zustand';
import { invoicesAPI } from '../services/api';
import notificationService from '../services/notificationService';

const useInvoiceStore = create((set, get) => ({
  invoices: [],
  stats: null,
  dashboard: null,
  loading: false,
  pagination: { currentPage: 1, totalPages: 1, totalCount: 0 },

  // ── Fetch invoices list ────────────────────────────────────────────────────
  fetchInvoices: async (params = {}) => {
    set({ loading: true });
    try {
      const response = await invoicesAPI.getAll(params);
      set({ invoices: response.data.invoices, loading: false });
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      set({ loading: false });
    }
  },

  // ── Fetch single invoice (with embedded product_warranties) ────────────────
  fetchInvoice: async (id) => {
    set({ loading: true });
    try {
      const response = await invoicesAPI.getById(id);
      set({ loading: false });
      return response.data.invoice;
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      set({ loading: false });
      return null;
    }
  },

  // ── Create invoice (upload or manual) ─────────────────────────────────────
  createInvoice: async (formData) => {
    set({ loading: true });
    try {
      const response = await invoicesAPI.create(formData);
      const invoice = response.data.invoice;
      
      set((state) => ({
        invoices: [invoice, ...state.invoices],
        loading: false,
      }));

      // Send in-app and email notification
      notificationService.sendProductSavedNotification(invoice).catch(err => {
        console.error('Failed to send product saved notification:', err);
      });

      return { success: true, invoice };
    } catch (error) {
      const message = error.response?.data?.error || 'Upload failed';
      set({ loading: false });
      return { success: false, error: message };
    }
  },

  // ── Update invoice ─────────────────────────────────────────────────────────
  updateInvoice: async (id, data) => {
    try {
      const response = await invoicesAPI.update(id, data);
      set((state) => ({
        invoices: state.invoices.map((i) =>
          i.id === id ? response.data.invoice : i
        ),
      }));
      return { success: true, invoice: response.data.invoice };
    } catch (error) {
      const message = error.response?.data?.error || 'Update failed';
      return { success: false, error: message };
    }
  },

  // ── Delete invoice ─────────────────────────────────────────────────────────
  deleteInvoice: async (id) => {
    try {
      await invoicesAPI.delete(id);
      set((state) => ({ invoices: state.invoices.filter((i) => i.id !== id) }));
      return { success: true };
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      return { success: false, error: 'Delete failed' };
    }
  },

  // ── Fetch stats ────────────────────────────────────────────────────────────
  fetchStats: async () => {
    try {
      const response = await invoicesAPI.getStats();
      set({ stats: response.data.stats });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  // ── Fetch full dashboard data ──────────────────────────────────────────────
  fetchDashboard: async () => {
    try {
      const response = await invoicesAPI.getDashboard();
      set({ dashboard: response.data.dashboard });
      // Also sync stats from dashboard summary
      const s = response.data.dashboard?.summary;
      if (s) {
        set({
          stats: {
            total: s.total_invoices,
            total_value: s.total_value,
            active: s.active_warranties,
            expiring_soon: s.expiring_soon,
            expired: s.expired,
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
  },

  // ── Poll OCR status until complete ────────────────────────────────────────
  pollOcrStatus: async (id, onUpdate, maxAttempts = 30) => {
    let attempts = 0;
    const poll = async () => {
      try {
        const response = await invoicesAPI.getOcrStatus(id);
        const { ocr_status, extracted_fields } = response.data;
        onUpdate?.({ ocr_status, extracted_fields });

        if (ocr_status === 'completed' || ocr_status === 'failed') {
          return;
        }
        if (attempts < maxAttempts) {
          attempts++;
          await new Promise((r) => setTimeout(r, 3000));
          await poll();
        }
      } catch (e) {
        console.error('[pollOcrStatus] error:', e);
      }
    };
    await poll();
  },

  // ── Search invoices ────────────────────────────────────────────────────────
  searchInvoices: async (query) => {
    set({ loading: true });
    try {
      const response = await invoicesAPI.getAll({ q: query });
      set({ invoices: response.data.invoices, loading: false });
    } catch (error) {
      console.error('Search failed:', error);
      set({ loading: false });
    }
  },
}));

export default useInvoiceStore;
