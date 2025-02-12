import { useState } from 'react';
import api from '../../api/axios';

const InviteModal = ({ documentId, onClose }) => {
  const [email, setEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState('write'); // Default to write access
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post(`/documents/${documentId}/invite`, { 
        email,
        accessLevel // Send access level to backend
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-96">
        <h2 className="text-xl text-white mb-4">Invite Collaborator</h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleInvite}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
            required
          />

          <div className="mb-4">
            <label className="block text-white mb-2">Access Level</label>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded"
            >
              <option value="write">Can Edit</option>
              <option value="read">Can View</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;