import React, { useContext, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { Line } from 'rc-progress'
import Footer from '../../components/student/Footer'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useEffect } from 'react'

const MyEnrollments = () => {
  const { enrolledCourses, calculateCourseDuration, navigate, userData, fetchUserEnrolledCourses, backendUrl, getToken, calculateNoOfLectures } = useContext(AppContext)

  const [progressArray, setProgressArray] = useState([])
  const [quizResults, setQuizResults] = useState({})
  const [certificateStatus, setCertificateStatus] = useState({})
  const [loading, setLoading] = useState(false)
  const [certificateLoading, setCertificateLoading] = useState({})

  const getCourseProgress = async () => {
    try {
      const token = await getToken();
      const tempProgressArray = await Promise.all(enrolledCourses.map(async (course) => {
        console.log(`Fetching progress for course: ${course.courseTitle}`);
        
        const { data } = await axios.post(
          `${backendUrl}/api/user/get-course-progress`,
          { courseId: course._id },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        console.log(`Progress data for ${course.courseTitle}:`, data);

        let totalLectures = calculateNoOfLectures(course);
        const completedLecturesCount = data.progressData
          ? data.progressData.lectureCompleted.length
          : 0;

        console.log(`Course: ${course.courseTitle}, Total: ${totalLectures}, Completed: ${completedLecturesCount}`);

        return {
          totalLectures,
          lectureCompleted: completedLecturesCount,
          courseId: course._id
        }
      }))
      setProgressArray(tempProgressArray);

    } catch (error) {
      console.error('Error fetching course progress:', error);
      toast.error(error.message);
    }
  }

  const getQuizResults = async () => {
    try {
      const token = await getToken();
      const results = {};

      await Promise.all(enrolledCourses.map(async (course) => {
        try {
          const { data } = await axios.get(
            `${backendUrl}/api/quiz/results/${course._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (data.success && data.results.length > 0) {
            // Get the latest result
            const latestResult = data.results[data.results.length - 1];
            results[course._id] = latestResult;
          }
        } catch (error) {
          // Course might not have a quiz, so ignore errors
          console.log(`No quiz results for course ${course._id}`);
        }
      }));

      setQuizResults(results);
    } catch (error) {
      console.error('Error fetching quiz results:', error);
    }
  }

  // Get certificate status for all courses
  const getCertificateStatus = async () => {
    try {
      const token = await getToken();
      const status = {};

      await Promise.all(enrolledCourses.map(async (course) => {
        try {
          const { data } = await axios.get(
            `${backendUrl}/api/certificate/status/${course._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (data.success && data.certificateRequest) {
            status[course._id] = data.certificateRequest;
          }
        } catch (error) {
          console.log(`No certificate status for course ${course._id}`);
        }
      }));

      setCertificateStatus(status);
    } catch (error) {
      console.error('Error fetching certificate status:', error);
    }
  }

  // Apply for certificate
  const applyForCertificate = async (courseId) => {
    try {
      setCertificateLoading(prev => ({ ...prev, [courseId]: true }));
      const token = await getToken();
      
      const { data } = await axios.post(
        `${backendUrl}/api/certificate/apply`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success('Certificate application submitted successfully!');
        // Update certificate status
        setCertificateStatus(prev => ({
          ...prev,
          [courseId]: data.request
        }));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error applying for certificate:', error);
      toast.error(error.response?.data?.message || 'Error applying for certificate');
    } finally {
      setCertificateLoading(prev => ({ ...prev, [courseId]: false }));
    }
  }

  // Check if quiz exists for the course
  const checkQuizExists = async (courseId) => {
    try {
      const token = await getToken();
      console.log(`🔍 Checking quiz for course: ${courseId}`);
      
      const { data } = await axios.get(
        `${backendUrl}/api/quiz/student/${courseId}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );

      console.log('📊 Quiz check response:', data);

      if (data.success) {
        console.log('✅ Quiz found and accessible');
        return { exists: true, quiz: data.quiz };
      } else {
        console.log('❌ Quiz check failed:', data.message);
        toast.error(data.message || 'No quiz available for this course');
        return { exists: false, message: data.message };
      }
    } catch (error) {
      console.error('💥 Error checking quiz:', error);
      
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Server error when checking quiz');
        }
      } else if (error.request) {
        toast.error('No response from server. Please check your connection.');
      } else {
        toast.error('Error checking quiz: ' + error.message);
      }
      
      return { exists: false, message: error.message };
    }
  }

  const handleQuizButtonClick = async (course) => {
    console.log('🎯 Quiz button clicked for:', course.courseTitle, 'Course ID:', course._id);
    
    const isCourseCompleted = isCourseCompletedFrontend(course._id);
    
    if (!isCourseCompleted) {
      const courseProgress = progressArray.find(p => p.courseId === course._id);
      const completed = courseProgress ? courseProgress.lectureCompleted : 0;
      const total = courseProgress ? courseProgress.totalLectures : 0;
      
      toast.warning(
        `Please complete all lectures of "${course.courseTitle}" before taking the quiz. (Progress: ${completed}/${total} lectures)`
      );
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Starting quiz existence check...');
      const result = await checkQuizExists(course._id);
      
      if (result.exists) {
        console.log('✅ Course completed and quiz exists, navigating to quiz');
        navigate(`/quiz/${course._id}`);
      } else {
        console.log('❌ Quiz not available:', result.message);
      }
    } catch (error) {
      console.error('💥 Error in handleQuizButtonClick:', error);
      toast.error('Unexpected error accessing quiz');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userData && enrolledCourses.length === 0) {
      fetchUserEnrolledCourses();
    }
  }, [userData]);

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      console.log('📚 Enrolled courses loaded, fetching progress and quiz results');
      getCourseProgress();
      getQuizResults();
      getCertificateStatus();
    }
  }, [enrolledCourses])

  const getQuizButtonText = (course) => {
    const result = quizResults[course._id];
    if (result) {
      return `Quiz: ${result.score}/${result.totalPoints} (${Math.round(result.percentage)}%)`;
    }
    return 'Take Quiz';
  }

  const getQuizButtonColor = (course) => {
    const result = quizResults[course._id];
    if (result) {
      return result.passed ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';
    }
    return 'bg-purple-600 hover:bg-purple-700';
  }

  // Frontend-only course completion check
  const isCourseCompletedFrontend = (courseId) => {
    const progress = progressArray.find(p => p.courseId === courseId);
    const isCompleted = progress && progress.totalLectures > 0 && 
           progress.lectureCompleted === progress.totalLectures;
    
    console.log(`📊 Course ${courseId} completion check:`, {
      hasProgress: !!progress,
      totalLectures: progress?.totalLectures,
      completedLectures: progress?.lectureCompleted,
      isCompleted
    });
    
    return isCompleted;
  }

  // Check if user can apply for certificate
  const canApplyForCertificate = (course) => {
    const progress = progressArray.find(p => p.courseId === course._id);
    const quizResult = quizResults[course._id];
    const certStatus = certificateStatus[course._id];

    // If already applied or approved, cannot apply again
    if (certStatus) {
      return false;
    }

    // Check if course completed and quiz passed
    const courseCompleted = progress && progress.totalLectures > 0 && 
                           progress.lectureCompleted === progress.totalLectures;
    const quizPassed = quizResult && quizResult.passed;

    return courseCompleted && quizPassed;
  }

  // Get certificate button text and style
  const getCertificateButtonInfo = (course) => {
    const certStatus = certificateStatus[course._id];
    
    if (!certStatus) {
      const canApply = canApplyForCertificate(course);
      return {
        text: 'Apply for Certificate',
        color: canApply ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400',
        disabled: !canApply,
        loading: certificateLoading[course._id]
      };
    }

    switch (certStatus.status) {
      case 'pending':
        return {
          text: 'Pending Approval',
          color: 'bg-yellow-500',
          disabled: true,
          loading: false
        };
      case 'approved':
        return {
          text: 'Download Certificate',
          color: 'bg-blue-600 hover:bg-blue-700',
          disabled: false,
          loading: false
        };
      case 'rejected':
        return {
          text: 'Application Rejected',
          color: 'bg-red-500',
          disabled: true,
          loading: false
        };
      default:
        return {
          text: 'Apply for Certificate',
          color: 'bg-gray-400',
          disabled: true,
          loading: false
        };
    }
  }

  const handleCertificateButtonClick = (course) => {
    const certStatus = certificateStatus[course._id];
    
    if (!certStatus) {
      // Apply for certificate
      applyForCertificate(course._id);
    } else if (certStatus.status === 'approved') {
      // Download certificate
      window.open(certStatus.certificateUrl, '_blank');
    }
  }

  return (
    <>
      <div className='md:px-36 px-8 pt-10'>
        <h1 className='text-2xl font-semibold'>My Enrollments</h1>

        {/* Debug Info - You can remove this in production */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="text-sm font-medium text-blue-800">Debug Information:</h3>
          <div className="text-xs text-blue-700 space-y-1">
            <p>Enrolled Courses: {enrolledCourses.length}</p>
            <p>Progress Data: {progressArray.length}</p>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            {enrolledCourses.map(course => {
              const progress = progressArray.find(p => p.courseId === course._id);
              const quizResult = quizResults[course._id];
              const certStatus = certificateStatus[course._id];
              
              return (
                <p key={course._id}>
                  {course.courseTitle}: {progress ? `${progress.lectureCompleted}/${progress.totalLectures}` : 'Loading...'} | 
                  Quiz: {quizResult ? (quizResult.passed ? 'Passed' : 'Failed') : 'Not taken'} | 
                  Certificate: {certStatus ? certStatus.status : 'Not applied'}
                </p>
              );
            })}
          </div>
        </div>

        <table className='md:table-auto table-fixed w-full overflow-hidden border mt-4'>
          <thead className='text-gray-900 border-b border-gray-500/20 text-sm text-left max-sm:hidden'>
            <tr>
              <th className='px-4 py-3 font-semibold truncate'>Course</th>
              <th className='px-4 py-3 font-semibold truncate'>Duration</th>
              <th className='px-4 py-3 font-semibold truncate'>Completed</th>
              <th className='px-4 py-3 font-semibold truncate'>Status</th>
              <th className='px-4 py-3 font-semibold truncate'>Quiz</th>
              <th className='px-4 py-3 font-semibold truncate'>Certificate</th>
            </tr>
          </thead>
          <tbody className='text-gray-700'>
            {enrolledCourses.map((course, index) => {
              const progress = progressArray[index];
              const courseCompleted = isCourseCompletedFrontend(course._id);
              const quizResult = quizResults[course._id];
              const certificateInfo = getCertificateButtonInfo(course);
              
              return (
                <tr key={index} className='border-b border-gray-500/20'>
                  <td className='md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3'>
                    <img src={course.courseThumbnail} alt="" className='w-14 sm:w-24 md:w-28 rounded' />
                    <div className='flex-1'>
                      <p className='mb-1 max-sm:text-sm font-medium'>{course.courseTitle}</p>
                      <Line 
                        strokeWidth={2} 
                        percent={progress ? (progress.lectureCompleted * 100) / progress.totalLectures : 0} 
                        className='bg-gray-300 rounded-full' 
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {progress ? `${progress.lectureCompleted}/${progress.totalLectures} lectures` : 'Loading...'}
                      </div>
                    </div>
                  </td>
                  <td className='px-4 py-3 max-sm:hidden'>
                    {calculateCourseDuration(course)}
                  </td>
                  <td className='px-4 py-3 max-sm:hidden'>
                    {progress && `${progress.lectureCompleted} / ${progress.totalLectures} `}
                    <span>Lectures</span>
                  </td>
                  <td className='px-4 py-3 max-sm:text-right'>
                    <button 
                      className={`px-3 sm:px-5 py-1.5 sm:py-2 max-sm:text-xs text-white rounded font-medium ${
                        progress && progress.lectureCompleted === progress.totalLectures 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                      onClick={() => navigate('/player/' + course._id)}
                    >
                      {progress && progress.lectureCompleted === progress.totalLectures ? 'Completed' : 'On Going'}
                    </button>
                  </td>
                  <td className='px-4 py-3 max-sm:text-right'>
                    <button
                      className={`px-3 sm:px-5 py-1.5 sm:py-2 max-sm:text-xs text-white rounded font-medium ${getQuizButtonColor(course)} ${
                        !courseCompleted ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 transition-transform duration-200'
                      }`}
                      onClick={() => handleQuizButtonClick(course)}
                      disabled={!courseCompleted || loading}
                      title={!courseCompleted ? 
                        `Complete all lectures to unlock quiz (${progress ? progress.lectureCompleted + '/' + progress.totalLectures : '0/0'})` : 
                        'Take quiz'
                      }
                    >
                      {loading ? 'Loading...' : getQuizButtonText(course)}
                    </button>
                  </td>
                  <td className='px-4 py-3 max-sm:text-right'>
                    <button
                      className={`px-3 sm:px-5 py-1.5 sm:py-2 max-sm:text-xs text-white rounded font-medium ${certificateInfo.color} ${
                        certificateInfo.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 transition-transform duration-200'
                      }`}
                      onClick={() => handleCertificateButtonClick(course)}
                      disabled={certificateInfo.disabled || certificateInfo.loading}
                      title={
                        !certificateStatus[course._id] && !canApplyForCertificate(course) 
                          ? 'Complete course and pass quiz to apply for certificate' 
                          : certificateInfo.text
                      }
                    >
                      {certificateInfo.loading ? 'Applying...' : certificateInfo.text}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {enrolledCourses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No enrolled courses found.</p>
            <button 
              onClick={() => navigate('/course-list')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Browse Courses
            </button>
          </div>
        )}
      </div>

      <Footer />
    </>
  )
}

export default MyEnrollments