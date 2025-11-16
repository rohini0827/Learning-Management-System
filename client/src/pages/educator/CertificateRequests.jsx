import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useParams } from 'react-router-dom'

const CertificateRequests = () => {
  const { backendUrl, getToken, navigate } = useContext(AppContext)
  const { courseId } = useParams()
  const [requests, setRequests] = useState([])
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState({})

  const fetchCertificateRequests = async () => {
    try {
      if (!courseId || courseId.length !== 24) {
        console.error('❌ Invalid courseId:', courseId)
        toast.error('Invalid course ID')
        setLoading(false)
        return
      }

      const token = await getToken()
      console.log('📤 Fetching certificate requests for course:', courseId)
      
      const { data } = await axios.get(
        `${backendUrl}/api/certificate/requests/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      console.log('📥 Certificate requests response:', data)

      if (data.success) {
        setRequests(data.requests)
        if (data.course) {
          setCourse(data.course)
        }
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('💥 Error fetching certificate requests:', error)
      if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('Failed to fetch certificate requests')
      }
    } finally {
      setLoading(false)
    }
  }

  const approveCertificate = async (requestId) => {
    try {
      setApproving(prev => ({ ...prev, [requestId]: true }))
      const token = await getToken()
      
      console.log('✅ Approving certificate request:', requestId)
      
      const { data } = await axios.post(
        `${backendUrl}/api/certificate/approve`,
        { requestId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        if (data.emailSent) {
          toast.success('Certificate approved and email sent successfully! 📧')
        } else {
          toast.warning('Certificate approved but email notification failed')
        }
        
        // Update the request status and disable the button
        setRequests(prev => prev.map(req => 
          req._id === requestId 
            ? { 
                ...req, 
                status: 'approved', 
                certificateUrl: data.certificate.certificateUrl,
                approvedAt: new Date(),
                emailSent: data.emailSent // Store email status
              }
            : req
        ))
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Error approving certificate:', error)
      toast.error(error.response?.data?.message || 'Error approving certificate')
    } finally {
      setApproving(prev => ({ ...prev, [requestId]: false }))
    }
  }

  // Get button text based on status
  const getApproveButtonText = (request) => {
    if (request.status === 'approved') {
      return request.emailSent ? '✅ Approved & Email Sent' : '✅ Approved';
    }
    return 'Approve Certificate';
  }

  // Check if approve button should be disabled
  const isApproveDisabled = (request) => {
    return request.status === 'approved' || approving[request._id];
  }

  useEffect(() => {
    if (courseId) {
      console.log('🔄 useEffect triggered with courseId:', courseId)
      fetchCertificateRequests()
    } else {
      console.error('❌ No courseId found in URL params')
      toast.error('No course ID provided')
      setLoading(false)
    }
  }, [courseId])

  // Simple inline loading component
  const InlineLoading = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span className="ml-3">Loading certificate requests...</span>
    </div>
  )

  if (loading) {
    return <InlineLoading />
  }

  return (
    <div className='min-h-screen p-8'>
      <div className='max-w-6xl mx-auto'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-2xl font-semibold'>Certificate Requests</h1>
            {course ? (
              <p className='text-gray-600 mt-1'>
                For course: <strong>{course.courseTitle}</strong>
              </p>
            ) : (
              <div className="mt-1">
                <p className='text-red-600'>
                  Course details not available
                </p>
                <p className="text-sm text-gray-500">
                  Course ID: {courseId} | Showing certificate requests anyway...
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/educator/my-courses')}
            className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700'
          >
            Back to Courses
          </button>
        </div>

        {requests.length === 0 ? (
          <div className='bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500'>
            <p className='text-lg mb-2'>No certificate requests found</p>
            <p className='text-sm'>Students who complete the course and pass the quiz will appear here.</p>
          </div>
        ) : (
          <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Student</th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Quiz Score</th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Applied On</th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Status</th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {requests.map((request) => (
                  <tr key={request._id}>
                    <td className='px-6 py-4'>
                      <div className='flex items-center'>
                        <img
                          src={request.userId?.profilePicture || '/default-avatar.png'}
                          alt={request.userId?.name}
                          className='w-10 h-10 rounded-full mr-3'
                        />
                        <div>
                          <p className='font-medium text-gray-900'>{request.userId?.name || 'Unknown User'}</p>
                          <p className='text-sm text-gray-500'>{request.userId?.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      {request.quizResultId ? (
                        <div>
                          <p className='font-medium'>
                            {request.quizResultId.score}/{request.quizResultId.totalPoints}
                          </p>
                          <p className='text-sm text-gray-500'>
                            {Math.round(request.quizResultId.percentage)}% - {request.quizResultId.passed ? 'Passed' : 'Failed'}
                          </p>
                        </div>
                      ) : (
                        <span className='text-gray-400'>N/A</span>
                      )}
                    </td>
                    <td className='px-6 py-4'>
                      {new Date(request.appliedAt).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4'>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status?.charAt(0).toUpperCase() + request.status?.slice(1) || 'Unknown'}
                      </span>
                    </td>

                    
                    
                    <td className='px-6 py-4'>
                      {request.status === 'pending' ? (
                        <button
                          onClick={() => approveCertificate(request._id)}
                          disabled={isApproveDisabled(request)}
                          className={`px-4 py-2 rounded flex items-center gap-2 ${
                            isApproveDisabled(request)
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {approving[request._id] ? (
                            <>
                              <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                              Approving...
                            </>
                          ) : (
                            getApproveButtonText(request)
                          )}
                        </button>
                      ) : request.status === 'approved' ? (
                        <div className="flex flex-col gap-2">
                          <span className="text-sm text-green-600 font-medium">
                            {getApproveButtonText(request)}
                          </span>
                          <a
                            href={`${backendUrl}/api/certificate/generate/${request._id}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm text-center'
                          >
                            View Certificate
                          </a>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className='mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <h3 className='text-sm font-medium text-blue-800 mb-2'>Certificate Approval Guidelines</h3>
          <ul className='text-sm text-blue-700 list-disc list-inside space-y-1'>
            <li>Verify that the student has completed all course lectures</li>
            <li>Confirm the student has passed the quiz with required score</li>
            <li>Certificate cannot be revoked once approved</li>
            <li>Student will receive certificate via email upon approval</li>
            <li>Email notification will be sent automatically after approval</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default CertificateRequests