// components/TestEmail.jsx or add to your existing component
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const TestEmail = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const testEmail = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken(); // Your token function
      const { data } = await axios.post(
        `${backendUrl}/api/certificate/test-email`,
        { toEmail: email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success('Test email sent successfully!');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Test email error:', error);
      toast.error(error.response?.data?.message || 'Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg my-4">
      <h3 className="text-lg font-semibold mb-2">🧪 Test Email Configuration</h3>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email to test"
          className="flex-1 px-3 py-2 border border-gray-300 rounded"
        />
        <button
          onClick={testEmail}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Test Email'}
        </button>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        This will send a test email to verify your email configuration.
      </p>
    </div>
  );
};

export default TestEmail;