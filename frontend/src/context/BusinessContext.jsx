import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const BusinessContext = createContext();

export const BusinessProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBusinesses = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/businesses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBusinesses(res.data);
      if (res.data.length > 0 && !selectedBusiness) {
        setSelectedBusiness(res.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [token]);

  return (
    <BusinessContext.Provider value={{ 
      businesses, 
      selectedBusiness, 
      setSelectedBusiness, 
      fetchBusinesses, 
      loading 
    }}>
      {children}
    </BusinessContext.Provider>
  );
};
