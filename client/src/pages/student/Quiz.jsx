import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import Loading from '../../components/student/Loading'

const Quiz = () => {
  const { backendUrl, getToken } = useContext(AppContext)
  const { courseId } = useParams()
  const navigate = useNavigate()
  
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    fetchQuiz()
  }, [courseId])

  useEffect(() => {
    let timer
    if (quizStarted && timeLeft > 0 && !quizCompleted) {
      timer = setInterval(() => {
        setTimeLeft(time => time - 1)
      }, 1000)
    } else if (timeLeft === 0 && quizStarted && !quizCompleted) {
      handleAutoSubmit()
    }
    return () => clearInterval(timer)
  }, [quizStarted, timeLeft, quizCompleted])

  const fetchQuiz = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const { data } = await axios.get(
        `${backendUrl}/api/quiz/student/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        setQuiz(data.quiz)
        setTimeLeft(data.quiz.timeLimit * 60) // Convert to seconds
        setAnswers(Array(data.quiz.questions.length).fill(null))
      } else {
        toast.error(data.message)
        navigate('/my-enrollments')
      }
    } catch (error) {
      toast.error(error.message)
      navigate('/my-enrollments')
    } finally {
      setLoading(false)
    }
  }

  const startQuiz = () => {
    setQuizStarted(true)
  }

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    const newAnswers = [...answers]
    newAnswers[questionIndex] = optionIndex
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleAutoSubmit = async () => {
    await submitQuiz()
  }

  const submitQuiz = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      
      const formattedAnswers = answers.map((selectedOption, index) => ({
        questionIndex: index,
        selectedOptionIndex: selectedOption !== null ? selectedOption : -1
      })).filter(answer => answer.selectedOptionIndex !== -1)

      const timeSpent = (quiz.timeLimit * 60) - timeLeft

      const { data } = await axios.post(
        `${backendUrl}/api/quiz/submit`,
        {
          quizId: quiz._id,
          answers: formattedAnswers,
          timeSpent
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        setResult(data.result)
        setQuizCompleted(true)
        toast.success(`Quiz completed! Score: ${data.result.score}/${data.result.totalPoints}`)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  if (loading) return <Loading />
  if (!quiz) return <div>No quiz found</div>

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{quiz.title}</h1>
          <p className="text-gray-600 mb-6">{quiz.description}</p>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-700">Time Limit:</span>
              <span className="font-medium">{quiz.timeLimit} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Total Questions:</span>
              <span className="font-medium">{quiz.questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Total Points:</span>
              <span className="font-medium">{quiz.totalPoints}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Passing Score:</span>
              <span className="font-medium">{quiz.passingScore}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Attempt:</span>
              <span className="font-medium">{quiz.currentAttempt} of {quiz.maxAttempts}</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Instructions:</h3>
            <ul className="list-disc list-inside text-yellow-700 space-y-1">
              <li>You have {quiz.timeLimit} minutes to complete the quiz</li>
              <li>Once started, the timer cannot be paused</li>
              <li>Answer all questions before submitting</li>
              <li>You cannot go back after submitting</li>
            </ul>
          </div>

          <button
            onClick={startQuiz}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            Start Quiz
          </button>
        </div>
      </div>
    )
  }

  if (quizCompleted && result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className={`text-center p-6 rounded-lg ${result.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h1 className={`text-2xl font-bold ${result.passed ? 'text-green-900' : 'text-red-900'} mb-2`}>
              {result.passed ? 'Quiz Passed! 🎉' : 'Quiz Failed 😔'}
            </h1>
            <p className={`text-lg ${result.passed ? 'text-green-700' : 'text-red-700'} mb-4`}>
              Your Score: {result.score}/{result.totalPoints} ({result.percentage}%)
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Time Spent: {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}</p>
              <p>Attempt: {result.attemptNumber}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={() => navigate('/my-enrollments')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Back to My Enrollments
            </button>
            {!result.passed && result.attemptNumber < quiz.maxAttempts && (
              <button
                onClick={() => window.location.reload()}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const currentQ = quiz.questions[currentQuestion]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Quiz Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
            <div className={`text-lg font-semibold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-700'}`}>
              Time Left: {formatTime(timeLeft)}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </div>
            <div className="text-sm text-gray-600">
              Points: {currentQ.points}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {currentQ.questionText}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  answers[currentQuestion] === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => handleAnswerSelect(currentQuestion, index)}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 ${
                    answers[currentQuestion] === index
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-400'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-gray-700">{option.optionText}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentQuestion === quiz.questions.length - 1 ? (
            <button
              onClick={submitQuiz}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next
            </button>
          )}
        </div>

        {/* Question Navigation Dots */}
        <div className="flex flex-wrap gap-2 mt-6 justify-center">
          {quiz.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`w-8 h-8 rounded-full text-sm ${
                currentQuestion === index
                  ? 'bg-blue-600 text-white'
                  : answers[index] !== null
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Quiz