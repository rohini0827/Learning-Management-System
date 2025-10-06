import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'

const MyCourses = () => {
  const { currency, backendUrl, isEducator, getToken } = useContext(AppContext)
  const [courses, setCourses] = useState(null)
  const [loading, setLoading] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState(null)

  const fetchEducatorCourses = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(backendUrl + '/api/educator/courses', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        setCourses(data.courses)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const deleteCourse = async (courseId) => {
    try {
      setLoading(true)
      const token = await getToken()
      const { data } = await axios.post(
        backendUrl + '/api/educator/delete-course',
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(data.message)
        // Remove course from local state
        setCourses(prevCourses => prevCourses.filter(course => course._id !== courseId))
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
      setCourseToDelete(null)
    }
  }

  const confirmDelete = (course) => {
    setCourseToDelete(course)
  }

  const cancelDelete = () => {
    setCourseToDelete(null)
  }

  useEffect(() => {
    if (isEducator) {
      fetchEducatorCourses()
    }
  }, [isEducator])

  return courses ? (
    <div className='min-h-screen flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      <div className='w-full'>
        <h2 className='pb-4 text-lg font-medium'>My Courses</h2>
        <div className='flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20'>
          <table className='md:table-auto table-fixed w-full overflow-hidden'>
            <thead className='text-gray-900 border-b border-gray-500/20 text-sm text-left'>
              <tr>
                <th className='px-4 py-3 font-semibold truncate'>All Courses</th>
                <th className='px-4 py-3 font-semibold truncate'>Earnings</th>
                <th className='px-4 py-3 font-semibold truncate'>Students</th>
                <th className='px-4 py-3 font-semibold truncate'>Published On</th>
                <th className='px-4 py-3 font-semibold truncate'>Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-500">
              {courses.map((course) => (
                <tr key={course._id} className='border-b border-gray-500/20'>
                  <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate">
                    <img src={course.courseThumbnail} alt="Course Image" className="w-16 h-10 object-cover rounded" />
                    <span className="truncate hidden md:block">{course.courseTitle}</span>
                  </td>
                  <td className='px-4 py-3'>
                    {currency} {Math.floor(course.enrolledStudents.length * (course.coursePrice - course.discount * course.coursePrice / 100))}
                  </td>
                  <td className='px-4 py-3'>{course.enrolledStudents.length}</td>
                  <td className='px-4 py-3'>{new Date(course.createdAt).toLocaleDateString()}</td>
                  <td className='px-4 py-3'>
                    <button
                      onClick={() => confirmDelete(course)}
                      disabled={loading}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1 disabled:opacity-50"
                    >
                      <img src={assets.delete_icon} alt="Delete" className="w-4 h-4" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {courses.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              No courses found. Create your first course!
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {courseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete the course "<strong>{courseToDelete.courseTitle}</strong>"?
            </p>
            <p className="text-sm text-red-600 mb-4">
              ⚠️ This action cannot be undone. All course data, student enrollments, and progress will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteCourse(courseToDelete._id)}
                disabled={loading}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Course'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : <Loading />
}

export default MyCourses