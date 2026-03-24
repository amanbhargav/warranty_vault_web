import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { userAPI } from '../services/api';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export function Settings() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  });
  
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await userAPI.updateProfile(formData);
      updateUser(response.data.user);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
      <Header title="Settings" showBack />
      
      <main className="max-w-md mx-auto">
        {/* Profile Section */}
        <section className="p-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-4xl text-primary">person</span>
                )}
              </div>
              <button className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full border-2 border-white dark:border-slate-900">
                <span className="material-symbols-outlined text-xs">edit</span>
              </button>
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-3">
                  <input
                    value={formData.first_name}
                    onChange={(event) => setFormData((current) => ({ ...current, first_name: event.target.value }))}
                    className="input"
                    placeholder="First name"
                  />
                  <input
                    value={formData.last_name}
                    onChange={(event) => setFormData((current) => ({ ...current, last_name: event.target.value }))}
                    className="input"
                    placeholder="Last name"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {user?.full_name || user?.email}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{user?.email}</p>
                </>
              )}
              <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 capitalize">
                {user?.role || 'Member'}
              </span>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            {editing ? (
              <>
                <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setEditing(true)}>Edit profile</Button>
            )}
          </div>
        </section>
        
        {/* Storage Usage */}
        <section className="px-6 py-4 border-y border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Cloud Storage</h3>
            <span className="text-sm font-medium">0 MB of 5 GB</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
          </div>
        </section>
        
        {/* Integrations */}
        <section className="mt-4">
          <h3 className="px-6 py-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Integrations</h3>
          
          <button 
            onClick={() => navigate('/gmail-import')}
            className="w-full flex items-center gap-4 px-6 py-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="size-10 flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="material-symbols-outlined text-red-600">mail</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-slate-900 dark:text-slate-100">Gmail Connection</p>
              <p className="text-sm text-slate-500">Import receipts from inbox</p>
            </div>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </button>
        </section>
        
        {/* Notifications */}
        <section className="mt-4">
          <h3 className="px-6 py-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Notifications</h3>
          
          <div className="bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Warranty Expiry Alerts</p>
                <p className="text-sm text-slate-500">30 days before expiration</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Email Summaries</p>
                <p className="text-sm text-slate-500">Monthly vault status report</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </section>
        
        {/* Data & Privacy */}
        <section className="mt-4">
          <h3 className="px-6 py-2 text-sm font-semibold uppercase tracking-wider text-slate-500">Data & Privacy</h3>
          
          <button className="w-full flex items-center gap-4 px-6 py-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="size-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">download</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-slate-900 dark:text-slate-100">Export Data</p>
              <p className="text-sm text-slate-500">Download all receipts as ZIP</p>
            </div>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </button>
          
          <button 
            onClick={() => {
              if (confirm('Are you sure? This will permanently delete your account.')) {
                handleLogout();
              }
            }}
            className="w-full flex items-center gap-4 px-6 py-4 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <div className="size-10 flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="material-symbols-outlined text-red-600">delete_forever</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-red-600">Delete Account</p>
              <p className="text-sm text-slate-500">Permanently erase all your data</p>
            </div>
            <span className="material-symbols-outlined text-slate-400">chevron_right</span>
          </button>
        </section>
        
        {/* Logout */}
        <section className="mt-6 px-6 pb-6">
          <Button onClick={handleLogout} variant="outline" className="w-full">
            Log Out
          </Button>
        </section>
      </main>
      
      <BottomNav />
    </div>
  );
}
