import { useState, useCallback } from 'react';
import api from '../api/axios';

export const useDocument = (documentId) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocument = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/documents/${documentId}`);
      setDocument(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  const updateDocument = useCallback(async (updates) => {
    try {
      const { data } = await api.put(`/documents/${documentId}`, updates);
      setDocument(data.doc);
      return data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to update document');
    }
  }, [documentId]);

  return {
    document,
    loading,
    error,
    fetchDocument,
    updateDocument
  };
};