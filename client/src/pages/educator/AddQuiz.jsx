import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import Loading from '../../components/student/Loading'

const AddQuiz = () => {
  const { backendUrl, getToken } = useContext(AppContext)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [numberOfQuestions, setNumberOfQuestions] = useState(5)
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    passingScore: 60,
    timeLimit: 30,
    maxAttempts: 1
  })
  const [questions, setQuestions] = useState([])

  // Fetch educator's courses
  const fetchEducatorCourses = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const { data } = await axios.get(backendUrl + '/api/quiz/educator-courses', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        setCourses(data.courses)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEducatorCourses()
  }, [])

  // Initialize questions when number of questions changes
  useEffect(() => {
    const newQuestions = Array.from({ length: numberOfQuestions }, (_, index) => ({
      questionText: '',
      options: [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false }
      ],
      points: 1
    }))
    setQuestions(newQuestions)
  }, [numberOfQuestions])

  // Handle course selection
  const handleCourseSelect = (courseId) => {
    setSelectedCourse(courseId)
    const selectedCourseData = courses.find(course => course._id === courseId)
    if (selectedCourseData) {
      setQuizData(prev => ({
        ...prev,
        title: `${selectedCourseData.courseTitle} Quiz`,
        description: `Quiz for ${selectedCourseData.courseTitle}`
      }))
    }
  }

  // Handle quiz data change
  const handleQuizDataChange = (field, value) => {
    setQuizData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle question text change
  const handleQuestionChange = (index, value) => {
    const newQuestions = [...questions]
    newQuestions[index].questionText = value
    setQuestions(newQuestions)
  }

  // Handle option text change
  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].options[optionIndex].optionText = value
    setQuestions(newQuestions)
  }

  // Handle correct answer selection
  const handleCorrectAnswerChange = (questionIndex, optionIndex) => {
    const newQuestions = [...questions]
    // Reset all options to false
    newQuestions[questionIndex].options.forEach(opt => opt.isCorrect = false)
    // Set selected option to true
    newQuestions[questionIndex].options[optionIndex].isCorrect = true
    setQuestions(newQuestions)
  }

  // Handle points change
  const handlePointsChange = (index, value) => {
    const newQuestions = [...questions]
    newQuestions[index].points = parseInt(value) || 1
    setQuestions(newQuestions)
  }

  // Validate form
  const validateForm = () => {
    if (!selectedCourse) {
      toast.error('Please select a course')
      return false
    }

    if (!quizData.title.trim()) {
      toast.error('Please enter quiz title')
      return false
    }

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      
      if (!question.questionText.trim()) {
        toast.error(`Please enter question ${i + 1}`)
        return false
      }

      for (let j = 0; j < question.options.length; j++) {
        if (!question.options[j].optionText.trim()) {
          toast.error(`Please enter all options for question ${i + 1}`)
          return false
        }
      }

      const correctOptions = question.options.filter(opt => opt.isCorrect)
      if (correctOptions.length !== 1) {
        toast.error(`Please select exactly one correct answer for question ${i + 1}`)
        return false
      }

      if (question.points < 1) {
        toast.error(`Points for question ${i + 1} must be at least 1`)
        return false
      }
    }

    return true
  }

  // Submit quiz
  // Submit quiz
const handleSubmit = async (e) => {
  e.preventDefault()
  
  if (!validateForm()) return

  try {
    setLoading(true)
    const token = await getToken()
    
    // Prepare the data to send
    const quizPayload = {
      courseId: selectedCourse,
      title: quizData.title,
      description: quizData.description,
      passingScore: quizData.passingScore,
      timeLimit: quizData.timeLimit,
      maxAttempts: quizData.maxAttempts,
      questions: questions
    }

    console.log('Sending quiz data:', quizPayload); // Debug log

    const { data } = await axios.post(
      backendUrl + '/api/quiz/create',
      quizPayload,
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    )

    console.log('Quiz creation response:', data); // Debug log

    if (data.success) {
      toast.success('Quiz created successfully!')
      // Reset form
      setSelectedCourse('')
      setNumberOfQuestions(5)
      setQuizData({
        title: '',
        description: '',
        passingScore: 60,
        timeLimit: 30,
        maxAttempts: 1
      })
      setQuestions([])
      // Refresh courses to update hasQuiz status
      fetchEducatorCourses()
    } else {
      toast.error(data.message)
    }
  } catch (error) {
    console.error('Quiz creation error:', error);
    console.error('Error response:', error.response);
    toast.error(error.response?.data?.message || error.message)
  } finally {
    setLoading(false)
  }
}

  if (loading && courses.length === 0) {
    return <Loading />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Quiz</h1>
          
          {/* Course Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Course *
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => handleCourseSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a course</option>
              {courses.map((course) => (
                <option 
                  key={course._id} 
                  value={course._id}
                  disabled={course.hasQuiz}
                >
                  {course.courseTitle} {course.hasQuiz && '(Quiz Already Created)'}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              You can only create one quiz per course
            </p>
          </div>

          {selectedCourse && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Quiz Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    value={quizData.title}
                    onChange={(e) => handleQuizDataChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions *
                  </label>
                  <select
                    value={numberOfQuestions}
                    onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={quizData.description}
                  onChange={(e) => handleQuizDataChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quiz Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quizData.passingScore}
                    onChange={(e) => handleQuizDataChange('passingScore', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quizData.timeLimit}
                    onChange={(e) => handleQuizDataChange('timeLimit', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quizData.maxAttempts}
                    onChange={(e) => handleQuizDataChange('maxAttempts', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Questions</h3>
                
                {questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-md font-medium text-gray-700">
                        Question {questionIndex + 1}
                      </h4>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-700">Points:</label>
                        <input
                          type="number"
                          min="1"
                          value={question.points}
                          onChange={(e) => handlePointsChange(questionIndex, e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>

                    {/* Question Text */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder={`Enter question ${questionIndex + 1}`}
                        value={question.questionText}
                        onChange={(e) => handleQuestionChange(questionIndex, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Options */}
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`question-${questionIndex}`}
                            checked={option.isCorrect}
                            onChange={() => handleCorrectAnswerChange(questionIndex, optionIndex)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            placeholder={`Option ${optionIndex + 1}`}
                            value={option.optionText}
                            onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          <span className={`px-2 py-1 text-xs rounded ${
                            option.isCorrect 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {option.isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Quiz...' : 'Create Quiz'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddQuiz