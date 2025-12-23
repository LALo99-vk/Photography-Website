import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface StatusUpdateFormProps {
  currentStatus: string;
  bookingId: number;
  onStatusUpdate: (status: string, reason?: string, notes?: string) => Promise<void>;
  onCancel: () => void;
}

const StatusUpdateForm: React.FC<StatusUpdateFormProps> = ({
  currentStatus,
  bookingId,
  onStatusUpdate,
  onCancel
}) => {
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (status === currentStatus && !notes) {
      toast.error('Please change the status or add notes');
      return;
    }

    setLoading(true);
    try {
      await onStatusUpdate(status, reason, notes);
      toast.success('Status updated successfully');
      onCancel();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 border border-gray-200"
    >
      <h3 className="font-playfair text-xl font-bold text-gray-900 mb-4">
        Update Booking Status
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status Selection */}
        <div>
          <label className="block font-inter text-sm font-medium text-gray-700 mb-2">
            New Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copper-500 focus:border-transparent font-inter"
            required
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="could_not_do">Could Not Do</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Reason (for Could Not Do) */}
        {status === 'could_not_do' && (
          <div>
            <label className="block font-inter text-sm font-medium text-gray-700 mb-2">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copper-500 focus:border-transparent font-inter"
              required
            >
              <option value="">Select a reason</option>
              <option value="availability">Availability</option>
              <option value="location">Location</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block font-inter text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Add any additional notes or comments..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copper-500 focus:border-transparent font-inter"
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors font-inter font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Updating...' : 'Update Status'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-inter font-medium"
          >
            <X className="h-4 w-4 mr-2 inline" />
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default StatusUpdateForm;

