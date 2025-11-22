// hooks/useAppwrite.js
import { useState, useEffect } from 'react';

/**
 * Custom hook for fetching data from Appwrite/Supabase
 * @param {Function} fetchFunction - The async function to fetch data
 * @returns {Object} - { data, isLoading, error, refetch }
 */
export const useAppwrite = (fetchFunction) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError(err);
      console.log('useAppwrite error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Refetch function for manual refresh
  const refetch = async () => {
    await fetchData();
  };

  return { data, isLoading, error, refetch };
};

export default useAppwrite;
