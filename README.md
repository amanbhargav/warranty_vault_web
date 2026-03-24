# Warranty Vault Frontend

A responsive frontend application built with React (web) and designed to be easily portable to React Native for mobile. It provides a clean UI for managing invoices, tracking warranties, and receiving notifications.

---

## 🚀 Features

* 🔐 Authentication (Email + Google Login)
* 📊 Dashboard with Warranty Overview
* 📄 Invoice Upload & Management
* 🧾 Product Details & Warranty Info
* 🔔 In-App Notifications
* 📱 Responsive Design (Mobile + Desktop)
* 🖼 Default Product Image System

---

## 🏗 Tech Stack

* React (Vite)
* Axios (API integration)
* Tailwind CSS (UI styling)
* React Router
* WebSocket (ActionCable integration)

---

## ⚙️ Setup Instructions

### 1. Clone Repository

```bash
git clone <repo-url>
cd warranty-vault-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env` file:

```
VITE_API_URL=http://localhost:3001/api/v1
```

### 4. Run Application

```bash
npm run dev
```

---

## 🔄 Application Flow

1. User logs in / signs up
2. Uploads invoice
3. Backend processes invoice
4. Product + warranty displayed
5. Notifications triggered

---

## 📂 Folder Structure

```
src/
  components/
  pages/
  services/
  api/
  assets/
```

---

## 🔐 Authentication

* JWT stored in localStorage / AsyncStorage
* Auto-login if token exists

---

## 🖼 Product Images

* Uses local default images (no external APIs)
* Category-based image mapping

---

## 📱 React Native Ready

This project is designed for easy migration to React Native:

* Shared API layer
* Same business logic
* UI adaptable to mobile components

---

## 📌 Future Enhancements

* React Native mobile app
* Push notifications
* Offline support
* Advanced UI animations

---

## 🤝 Contributing

Contributions are welcome.

---

## 📄 License

MIT License
