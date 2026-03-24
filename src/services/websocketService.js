// WebSocket service for real-time updates (Native WebSocket implementation)
class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.token = null;
    
    // Event callbacks
    this.onConnectionChange = null;
    this.onNewNotification = null;
    this.onUnreadCountUpdate = null;
    this.onWarrantyStatusUpdate = null;
    this.onError = null;
  }

  // Initialize WebSocket connection
  connect(token) {
    if (this.socket) {
      console.warn('[WebSocket] Already connected');
      return;
    }

    this.token = token;
    
    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/cable?token=${token}`;
    
    console.log('[WebSocket] Connecting to:', wsUrl);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('[WebSocket] Connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onConnectionChange?.(true);
      };

      this.socket.onclose = () => {
        console.log('[WebSocket] Disconnected');
        this.isConnected = false;
        this.onConnectionChange?.(false);
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.onError?.(error);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      this.onError?.(error);
    }
  }

  // Handle incoming messages
  handleMessage(data) {
    console.log('[WebSocket] Message received:', data);

    switch (data.type) {
      case 'notification':
        this.onNewNotification?.(data.notification);
        if (data.unread_count !== undefined) {
          this.onUnreadCountUpdate?.(data.unread_count);
        }
        break;

      case 'unread_count_update':
        this.onUnreadCountUpdate?.(data.unread_count);
        break;

      case 'warranty_status_update':
        this.onWarrantyStatusUpdate?.(data);
        break;

      case 'warranty_created':
        this.onNewNotification?.({
          id: `warranty_${Date.now()}`,
          type: 'warranty_created',
          title: 'Product Saved!',
          message: `${data.product_name || 'Your product'} has been added to your warranty vault.`,
          created_at: new Date().toISOString(),
        });
        break;

      default:
        console.log('[WebSocket] Unknown message type:', data.type);
    }
  }

  // Attempt to reconnect
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (!this.isConnected && this.token) {
        this.connect(this.token);
      }
    }, delay);
  }

  // Mark notification as read (via API call)
  async markNotificationAsRead(notificationId) {
    try {
      const response = await fetch(`/api/v1/notifications/${notificationId}/mark_as_read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('[WebSocket] Notification marked as read:', notificationId);
      }
    } catch (error) {
      console.error('[WebSocket] Failed to mark notification as read:', error);
    }
  }

  // Mark all notifications as read (via API call)
  async markAllNotificationsAsRead() {
    try {
      const response = await fetch('/api/v1/notifications/mark_all_as_read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Handle 404 gracefully
      if (response.status === 404) {
        console.log('[WebSocket] mark_all_as_read endpoint not available');
      } else if (response.ok) {
        console.log('[WebSocket] All notifications marked as read');
      }
      
      // Always update local count as fallback
      this.onUnreadCountUpdate?.(0);
    } catch (error) {
      console.log('[WebSocket] mark_all_as_read API not available, using local fallback');
      // Fallback: just update the local count
      this.onUnreadCountUpdate?.(0);
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      console.log('[WebSocket] Disconnected');
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
