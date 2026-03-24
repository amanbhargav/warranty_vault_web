import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { cn } from '../utils/cn';

export function Header({ title, showBack = false }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const notificationDropdownRef = useRef(null);

  // Disable WebSocket by default - enable when backend supports it
  const WEBSOCKET_ENABLED = false;
  
  const { isConnected, lastNotification } = WEBSOCKET_ENABLED 
    ? useWebSocket(localStorage.getItem('authToken'))
    : { isConnected: false, lastNotification: null };

  // Fetch notifications on mount
  useEffect(() => {
    if (user) {
      fetchNotifications({ per_page: 10 });
    }
  }, [user]);

  // Handle new notifications via WebSocket
  useEffect(() => {
    if (lastNotification) {
      // Show toast
      setShowToast(lastNotification);
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowToast(null);
      }, 5000);

      // Refresh notifications list
      fetchNotifications({ per_page: 10 });
    }
  }, [lastNotification]);

  // Request browser notification permission (only if WebSocket enabled)
  useEffect(() => {
    if (!WEBSOCKET_ENABLED) return; // Skip if WebSocket disabled
    
    if ("Notification" in window && Notification.permission === "default") {
      // Show custom prompt
      const showPrompt = () => {
        const promptDiv = document.createElement('div');
        promptDiv.className = 'notification-permission-prompt';
        promptDiv.innerHTML = `
          <div style="position: fixed; top: 20px; right: 20px; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); z-index: 10001; min-width: 320px; animation: slideInRight 0.3s ease-out; border: 1px solid #e5e7eb;">
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 12px; color: white;">
                  <span class="material-symbols-outlined" style="font-size: 24px;">notifications</span>
                </div>
                <div>
                  <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">Enable Notifications</h3>
                  <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Get instant updates for your products</p>
                </div>
              </div>
              <div style="display: flex; gap: 12px;">
                <button id="enable-notifs" style="flex: 1; padding: 10px 20px; border-radius: 8px; border: none; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; font-size: 14px; font-weight: 500; cursor: pointer;">Enable</button>
                <button id="dismiss-notifs" style="padding: 10px 20px; border-radius: 8px; border: none; background: #f3f4f6; color: #6b7280; font-size: 14px; cursor: pointer;">Not now</button>
              </div>
            </div>
            <style>
              @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            </style>
          </div>
        `;
        document.body.appendChild(promptDiv);

        document.getElementById('enable-notifs').onclick = () => {
          Notification.requestPermission().then(permission => {
            if (permission === "granted") {
              showToastNotification('Success', 'Notifications enabled! You\'ll receive important updates.', 'success');
            }
          });
          document.body.removeChild(promptDiv);
        };

        document.getElementById('dismiss-notifs').onclick = () => {
          document.body.removeChild(promptDiv);
          localStorage.setItem('notificationPromptDismissed', Date.now().toString());
        };

        // Auto-dismiss after 10 seconds
        setTimeout(() => {
          if (document.body.contains(promptDiv)) {
            document.body.removeChild(promptDiv);
          }
        }, 10000);
      };

      const dismissedTime = localStorage.getItem('notificationPromptDismissed');
      if (!dismissedTime || (Date.now() - parseInt(dismissedTime)) > (24 * 60 * 60 * 1000)) {
        showPrompt();
      }
    }
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Show toast notification helper
  const showToastNotification = (title, message, type = 'info') => {
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

  // Handle notification click
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setShowNotifications(false);
    
    // Determine the correct URL based on notification type and metadata
    let targetUrl = notification.action_url;
    
    // Fallback logic for different notification types
    if (!targetUrl && notification.metadata) {
      switch (notification.notification_type) {
        case 'invoice_processed':
        case 'warranty_expiring':
        case 'warranty_expired':
        case 'success':
        case 'ocr_complete':
          if (notification.metadata.invoice_id) {
            targetUrl = `/invoice/${notification.metadata.invoice_id}`;
          } else if (notification.metadata.product_id) {
            targetUrl = `/invoice/${notification.metadata.product_id}`;
          }
          break;
        case 'error':
          if (notification.metadata.invoice_id) {
            targetUrl = `/invoice/${notification.metadata.invoice_id}/edit`;
          }
          break;
        case 'system_update':
        case 'info':
        default:
          targetUrl = '/dashboard';
          break;
      }
    }
    
    // Final fallback to dashboard if no URL determined
    if (!targetUrl) {
      targetUrl = '/dashboard';
    }
    
    console.log('Navigating to:', targetUrl, 'from notification:', notification);
    navigate(targetUrl);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      // Try the API endpoint
      const response = await fetch('/api/v1/notifications/mark_all_as_read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Handle 404 (endpoint doesn't exist) gracefully
      if (response.status === 404) {
        console.log('Mark all as read endpoint not available, using local fallback');
      } else if (response.ok) {
        // Refresh notifications
        fetchNotifications({ per_page: 10 });
        return;
      }
    } catch (error) {
      console.log('Mark all as read API not available, using local fallback');
    }
    
    // Fallback: mark all local notifications as read
    const { notifications } = useNotificationStore.getState();
    notifications.forEach(n => {
      if (!n.read) {
        markAsRead(n.id);
      }
    });
    
    // Refresh to show updated state
    fetchNotifications({ per_page: 10 });
  };

  // Show browser notification
  const showBrowserNotification = (notification) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-background-light dark:bg-background-dark border-b border-primary/10">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            )}

            {title ? (
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h1>
            ) : (
              <div className="flex items-center gap-2">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">verified_user</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100">Warranty Vault</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchNotifications({ per_page: 10 });
                setShowNotifications(!showNotifications);
              }}
              className="relative p-2 hover:bg-primary/10 rounded-lg transition-colors"
              title={WEBSOCKET_ENABLED ? (isConnected ? 'Notifications connected' : 'Connecting...') : 'Notifications (real-time disabled)'}
            >
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-4 bg-red-500 rounded-full text-white text-[10px] font-bold px-1 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              {WEBSOCKET_ENABLED && isConnected && (
                <span className="absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              )}
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="fixed top-16 right-4 w-80 max-h-[600px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2" ref={notificationDropdownRef}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[500px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">notifications_none</span>
                <p className="text-sm text-slate-500 mt-2">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 text-left border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${!notification.read ? 'bg-primary' : 'bg-transparent'}`}></div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{notification.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{notification.message}</p>
                      <p className="text-[10px] text-slate-400 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
