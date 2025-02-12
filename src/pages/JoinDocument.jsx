import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';

const JoinDocument = () => {
  const { documentId, token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const joinDocument = async () => {
      try {
        if (!user) {
          // Store the join URL to redirect back after login
          localStorage.setItem('joinRedirect', location.pathname);
          navigate('/signin');
          return;
        }

        // Try to join the document
        await api.post(`/documents/${documentId}/join`, { token });
        
        // Clear any stored redirect
        localStorage.removeItem('joinRedirect');
        
        // Navigate to document
        navigate(`/document/${documentId}`);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to join document');
        setLoading(false);
      }
    };

    joinDocument();
  }, [documentId, token, navigate, location.pathname, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Joining document...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        {error && (
          <div className="text-red-500 mb-4 text-center">{error}</div>
        )}
        <button
          onClick={() => navigate('/')}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Go to Documents
        </button>
      </div>
    </div>
  );
};

export default JoinDocument;