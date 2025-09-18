import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter as Router } from "react-router-dom";
import AdminContextProvider from './components/context/AdminContext.jsx';

createRoot(document.getElementById('root')).render(
  <Router>
    <AdminContextProvider>
    <App />
    </AdminContextProvider>
  </Router>
)
// akash 