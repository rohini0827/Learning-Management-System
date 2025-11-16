import { Quiz } from '../models/Quiz.js';
import Course from '../models/Course.js';
import { QuizResult } from '../models/QuizResult.js';
import User from '../models/User.js';

// Create a new quiz
export const createQuiz = async (req, res) => {
    try {
        console.log('Request Body:', req.body); // Debug log
        console.log('Request Headers:', req.headers); // Debug log

        // Check if req.body exists
        if (!req.body) {
            return res.json({ 
                success: false, 
                message: 'Request body is missing' 
            });
        }

        const educatorId = req.auth.userId;
        const { courseId, title, description, questions, passingScore, timeLimit, maxAttempts } = req.body;

        // Validate required fields
        if (!courseId) {
            return res.json({ 
                success: false, 
                message: 'Course ID is required' 
            });
        }

        if (!questions || !Array.isArray(questions)) {
            return res.json({ 
                success: false, 
                message: 'Questions array is required' 
            });
        }

        // Check if course exists and belongs to the educator
        const course = await Course.findOne({ _id: courseId, educator: educatorId });
        if (!course) {
            return res.json({ 
                success: false, 
                message: 'Course not found or you are not authorized to add quiz to this course' 
            });
        }

        // Check if quiz already exists for this course
        const existingQuiz = await Quiz.findOne({ courseId });
        if (existingQuiz) {
            return res.json({ 
                success: false, 
                message: 'Quiz already exists for this course. You can only create one quiz per course.' 
            });
        }

        // Validate questions structure
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            if (!question.questionText || !question.options || !Array.isArray(question.options) || question.options.length !== 4) {
                return res.json({ 
                    success: false, 
                    message: `Question ${i + 1} must have question text and exactly 4 options` 
                });
            }

            // Validate that exactly one option is correct
            const correctOptions = question.options.filter(opt => opt.isCorrect);
            if (correctOptions.length !== 1) {
                return res.json({ 
                    success: false, 
                    message: `Question ${i + 1} must have exactly one correct option` 
                });
            }
        }

        // Create new quiz
        const newQuiz = new Quiz({
            courseId,
            educatorId,
            title: title || "Course Quiz",
            description: description || "Test your knowledge with this quiz",
            questions,
            passingScore: passingScore || 60,
            timeLimit: timeLimit || 30,
            maxAttempts: maxAttempts || 1
        });

        await newQuiz.save();

        console.log('Quiz created successfully:', newQuiz._id); // Debug log

        res.json({ 
            success: true, 
            message: 'Quiz created successfully', 
            quiz: newQuiz 
        });

    } catch (error) {
        console.error('[createQuiz] Error:', error);
        res.json({ success: false, message: error.message });
    }
};

// ... rest of your quiz controller functions
// Create a new quiz
// export const createQuiz = async (req, res) => {
//     try {
//         const educatorId = req.auth.userId;
//         const { courseId, title, description, questions, passingScore, timeLimit, maxAttempts } = req.body;

//         // Validate required fields
//         if (!courseId || !questions || !Array.isArray(questions)) {
//             return res.json({ 
//                 success: false, 
//                 message: 'Course ID and questions array are required' 
//             });
//         }

//         // Check if course exists and belongs to the educator
//         const course = await Course.findOne({ _id: courseId, educator: educatorId });
//         if (!course) {
//             return res.json({ 
//                 success: false, 
//                 message: 'Course not found or you are not authorized to add quiz to this course' 
//             });
//         }

//         // Check if quiz already exists for this course
//         const existingQuiz = await Quiz.findOne({ courseId });
//         if (existingQuiz) {
//             return res.json({ 
//                 success: false, 
//                 message: 'Quiz already exists for this course. You can only create one quiz per course.' 
//             });
//         }

//         // Validate questions structure
//         for (let i = 0; i < questions.length; i++) {
//             const question = questions[i];
//             if (!question.questionText || !question.options || !Array.isArray(question.options) || question.options.length !== 4) {
//                 return res.json({ 
//                     success: false, 
//                     message: `Question ${i + 1} must have question text and exactly 4 options` 
//                 });
//             }

//             // Validate that exactly one option is correct
//             const correctOptions = question.options.filter(opt => opt.isCorrect);
//             if (correctOptions.length !== 1) {
//                 return res.json({ 
//                     success: false, 
//                     message: `Question ${i + 1} must have exactly one correct option` 
//                 });
//             }
//         }

//         // Create new quiz
//         const newQuiz = new Quiz({
//             courseId,
//             educatorId,
//             title: title || "Course Quiz",
//             description: description || "Test your knowledge with this quiz",
//             questions,
//             passingScore: passingScore || 60,
//             timeLimit: timeLimit || 30,
//             maxAttempts: maxAttempts || 1
//         });

//         await newQuiz.save();

//         res.json({ 
//             success: true, 
//             message: 'Quiz created successfully', 
//             quiz: newQuiz 
//         });

//     } catch (error) {
//         console.error('[createQuiz] Error:', error);
//         res.json({ success: false, message: error.message });
//     }
// };

// Get quiz by course ID
export const getQuizByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const educatorId = req.auth.userId;

        // Check if educator owns the course
        const course = await Course.findOne({ _id: courseId, educator: educatorId });
        if (!course) {
            return res.json({ 
                success: false, 
                message: 'Course not found or unauthorized access' 
            });
        }

        const quiz = await Quiz.findOne({ courseId });
        
        if (!quiz) {
            return res.json({ 
                success: false, 
                message: 'No quiz found for this course' 
            });
        }

        res.json({ success: true, quiz });

    } catch (error) {
        console.error('[getQuizByCourse] Error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Update quiz
export const updateQuiz = async (req, res) => {
    try {
        const educatorId = req.auth.userId;
        const { quizId, title, description, questions, passingScore, timeLimit, maxAttempts } = req.body;

        const quiz = await Quiz.findOne({ _id: quizId, educatorId });
        if (!quiz) {
            return res.json({ 
                success: false, 
                message: 'Quiz not found or unauthorized access' 
            });
        }

        // Validate questions if provided
        if (questions && Array.isArray(questions)) {
            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                if (!question.questionText || !question.options || !Array.isArray(question.options) || question.options.length !== 4) {
                    return res.json({ 
                        success: false, 
                        message: `Question ${i + 1} must have question text and exactly 4 options` 
                    });
                }

                const correctOptions = question.options.filter(opt => opt.isCorrect);
                if (correctOptions.length !== 1) {
                    return res.json({ 
                        success: false, 
                        message: `Question ${i + 1} must have exactly one correct option` 
                    });
                }
            }
            quiz.questions = questions;
        }

        // Update other fields
        if (title) quiz.title = title;
        if (description) quiz.description = description;
        if (passingScore) quiz.passingScore = passingScore;
        if (timeLimit) quiz.timeLimit = timeLimit;
        if (maxAttempts) quiz.maxAttempts = maxAttempts;

        await quiz.save();

        res.json({ 
            success: true, 
            message: 'Quiz updated successfully', 
            quiz 
        });

    } catch (error) {
        console.error('[updateQuiz] Error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Delete quiz
export const deleteQuiz = async (req, res) => {
    try {
        const educatorId = req.auth.userId;
        const { quizId } = req.body;

        const quiz = await Quiz.findOne({ _id: quizId, educatorId });
        if (!quiz) {
            return res.json({ 
                success: false, 
                message: 'Quiz not found or unauthorized access' 
            });
        }

        await Quiz.findByIdAndDelete(quizId);

        res.json({ 
            success: true, 
            message: 'Quiz deleted successfully' 
        });

    } catch (error) {
        console.error('[deleteQuiz] Error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get educator's courses for quiz creation
export const getEducatorCoursesForQuiz = async (req, res) => {
    try {
        const educatorId = req.auth.userId;

        const courses = await Course.find({ 
            educator: educatorId 
        }).select('_id courseTitle courseThumbnail');

        // Check which courses already have quizzes
        const coursesWithQuizStatus = await Promise.all(
            courses.map(async (course) => {
                const quizExists = await Quiz.findOne({ courseId: course._id });
                return {
                    ...course.toObject(),
                    hasQuiz: !!quizExists
                };
            })
        );

        res.json({ 
            success: true, 
            courses: coursesWithQuizStatus 
        });

    } catch (error) {
        console.error('[getEducatorCoursesForQuiz] Error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Check if user has completed the course
// Check if user has completed the course
// export const checkCourseCompletion = async (req, res) => {
//     try {
//         const auth = await req.auth();
//         const userId = auth.userId; // ✅ FIXED: Use auth.userId
//         const { courseId } = req.body;

//         console.log(`[checkCourseCompletion] Checking completion for user ${userId}, course ${courseId}`);

//         // Get course progress
//         const progressData = await CourseProgress.findOne({ userId, courseId });
//         console.log('[checkCourseCompletion] Progress data:', progressData);

//         // Get course details
//         const course = await Course.findById(courseId);
//         console.log('[checkCourseCompletion] Course:', course?.courseTitle);
        
//         if (!course) {
//             console.log('[checkCourseCompletion] Course not found');
//             return res.json({ success: false, message: 'Course not found' });
//         }

//         // Calculate total lectures
//         let totalLectures = 0;
//         if (course.courseContent && Array.isArray(course.courseContent)) {
//             course.courseContent.forEach(chapter => {
//                 if (chapter.chapterContent && Array.isArray(chapter.chapterContent)) {
//                     totalLectures += chapter.chapterContent.length;
//                 }
//             });
//         }

//         console.log('[checkCourseCompletion] Total lectures:', totalLectures);

//         // Get completed lectures count
//         const completedLectures = progressData ? progressData.lectureCompleted.length : 0;
//         console.log('[checkCourseCompletion] Completed lectures:', completedLectures);

//         const isCompleted = completedLectures === totalLectures && totalLectures > 0;
        
//         console.log('[checkCourseCompletion] Is course completed:', isCompleted);

//         res.json({ 
//             success: true, 
//             isCompleted,
//             progress: `${completedLectures}/${totalLectures}`,
//             percentage: totalLectures > 0 ? (completedLectures / totalLectures) * 100 : 0
//         });

//     } catch (error) {
//         console.error('[checkCourseCompletion] Error:', error);
//         res.json({ success: false, message: error.message });
//     }
// };
// Check if user has completed the course - FIXED
export const checkCourseCompletion = async (req, res) => {
    try {
        const userId = req.auth.userId; // ✅ Use this directly
        const { courseId } = req.body;

        console.log(`[checkCourseCompletion] Checking completion for user ${userId}, course ${courseId}`);

        // Import CourseProgress if you're using it (add at top of file)
        // import CourseProgress from '../models/CourseProgress.js';

        // Get course progress
        const progressData = await CourseProgress.findOne({ userId, courseId });
        console.log('[checkCourseCompletion] Progress data:', progressData);

        // Get course details
        const course = await Course.findById(courseId);
        console.log('[checkCourseCompletion] Course:', course?.courseTitle);
        
        if (!course) {
            console.log('[checkCourseCompletion] Course not found');
            return res.json({ success: false, message: 'Course not found' });
        }

        // Calculate total lectures
        let totalLectures = 0;
        if (course.courseContent && Array.isArray(course.courseContent)) {
            course.courseContent.forEach(chapter => {
                if (chapter.chapterContent && Array.isArray(chapter.chapterContent)) {
                    totalLectures += chapter.chapterContent.length;
                }
            });
        }

        console.log('[checkCourseCompletion] Total lectures:', totalLectures);

        // Get completed lectures count
        const completedLectures = progressData ? progressData.lectureCompleted.length : 0;
        console.log('[checkCourseCompletion] Completed lectures:', completedLectures);

        const isCompleted = completedLectures === totalLectures && totalLectures > 0;
        
        console.log('[checkCourseCompletion] Is course completed:', isCompleted);

        res.json({ 
            success: true, 
            isCompleted,
            progress: `${completedLectures}/${totalLectures}`,
            percentage: totalLectures > 0 ? (completedLectures / totalLectures) * 100 : 0
        });

    } catch (error) {
        console.error('[checkCourseCompletion] Error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get quiz for student
// export const getQuizForStudent = async (req, res) => {
//     try {
//         const auth = await req.auth();
//         const userId = req.auth.userId;
//         const { courseId } = req.params;

//         console.log(`[getQuizForStudent] User: ${userId}, Course: ${courseId}`);

//         // Check if user is enrolled in the course
//         const user = await User.findById(userId);
//         console.log(`[getQuizForStudent] User found:`, user ? 'Yes' : 'No');
        
//         if (!user) {
//             console.log(`[getQuizForStudent] User not found in database`);
//             return res.json({ 
//                 success: false, 
//                 message: 'User not found' 
//             });
//         }

//         console.log(`[getQuizForStudent] User enrolled courses:`, user.enrolledCourses);
        
//         // Check if user is enrolled in this course
//         const isEnrolled = user.enrolledCourses.includes(courseId);
//         console.log(`[getQuizForStudent] Is user enrolled:`, isEnrolled);
        
//         if (!isEnrolled) {
//             console.log(`[getQuizForStudent] User not enrolled in this course`);
//             return res.json({ 
//                 success: false, 
//                 message: 'You are not enrolled in this course' 
//             });
//         }

//         // Get quiz
//         const quiz = await Quiz.findOne({ courseId, isActive: true });
//         console.log(`[getQuizForStudent] Quiz found:`, quiz ? 'Yes' : 'No');
        
//         if (!quiz) {
//             console.log(`[getQuizForStudent] No active quiz found for course: ${courseId}`);
//             return res.json({ 
//                 success: false, 
//                 message: 'No quiz available for this course' 
//             });
//         }

//         console.log(`[getQuizForStudent] Quiz title: ${quiz.title}`);

//         // Check if user has reached max attempts
//         const previousAttempts = await QuizResult.find({ 
//             userId, 
//             quizId: quiz._id 
//         }).countDocuments();

//         console.log(`[getQuizForStudent] Previous attempts: ${previousAttempts}`);

//         if (previousAttempts >= quiz.maxAttempts) {
//             return res.json({ 
//                 success: false, 
//                 message: `You have reached the maximum attempts (${quiz.maxAttempts}) for this quiz` 
//             });
//         }

//         // Return quiz without correct answers
//         const quizForStudent = {
//             _id: quiz._id,
//             title: quiz.title,
//             description: quiz.description,
//             questions: quiz.questions.map(q => ({
//                 questionText: q.questionText,
//                 options: q.options.map(opt => ({
//                     optionText: opt.optionText
//                 })),
//                 points: q.points
//             })),
//             timeLimit: quiz.timeLimit,
//             totalPoints: quiz.totalPoints,
//             passingScore: quiz.passingScore,
//             maxAttempts: quiz.maxAttempts,
//             currentAttempt: previousAttempts + 1
//         };

//         console.log(`[getQuizForStudent] Sending quiz to student with ${quizForStudent.questions.length} questions`);

//         res.json({ success: true, quiz: quizForStudent });

//     } catch (error) {
//         console.error('[getQuizForStudent] Error:', error);
//         res.json({ success: false, message: error.message });
//     }
// };
// Get quiz for student - FIXED VERSION
export const getQuizForStudent = async (req, res) => {
    try {
        const userId = req.auth.userId; // ✅ Use this directly
        const { courseId } = req.params;

        console.log(`[getQuizForStudent] User: ${userId}, Course: ${courseId}`);

        // Check if user exists and is enrolled in the course
        const user = await User.findById(userId);
        console.log(`[getQuizForStudent] User found:`, user ? 'Yes' : 'No');
        
        if (!user) {
            console.log(`[getQuizForStudent] User not found in database`);
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        console.log(`[getQuizForStudent] User enrolled courses:`, user.enrolledCourses);
        
        // Check if user is enrolled in this course
        const isEnrolled = user.enrolledCourses && user.enrolledCourses.includes(courseId);
        console.log(`[getQuizForStudent] Is user enrolled:`, isEnrolled);
        
        if (!isEnrolled) {
            console.log(`[getQuizForStudent] User not enrolled in this course`);
            return res.status(403).json({ 
                success: false, 
                message: 'You are not enrolled in this course' 
            });
        }

        // Get quiz
        const quiz = await Quiz.findOne({ courseId, isActive: true });
        console.log(`[getQuizForStudent] Quiz found:`, quiz ? 'Yes' : 'No');
        
        if (!quiz) {
            console.log(`[getQuizForStudent] No active quiz found for course: ${courseId}`);
            return res.status(404).json({ 
                success: false, 
                message: 'No quiz available for this course' 
            });
        }

        console.log(`[getQuizForStudent] Quiz title: ${quiz.title}`);

        // Check if user has reached max attempts
        const previousAttempts = await QuizResult.countDocuments({ 
            userId, 
            quizId: quiz._id 
        });

        console.log(`[getQuizForStudent] Previous attempts: ${previousAttempts}`);

        if (previousAttempts >= quiz.maxAttempts) {
            return res.status(403).json({ 
                success: false, 
                message: `You have reached the maximum attempts (${quiz.maxAttempts}) for this quiz` 
            });
        }

        // Return quiz without correct answers
        const quizForStudent = {
            _id: quiz._id,
            title: quiz.title,
            description: quiz.description,
            questions: quiz.questions.map(q => ({
                questionText: q.questionText,
                options: q.options.map(opt => ({
                    optionText: opt.optionText
                    // Don't send isCorrect to student
                })),
                points: q.points
            })),
            timeLimit: quiz.timeLimit,
            totalPoints: quiz.totalPoints,
            passingScore: quiz.passingScore,
            maxAttempts: quiz.maxAttempts,
            currentAttempt: previousAttempts + 1
        };

        console.log(`[getQuizForStudent] Sending quiz to student with ${quizForStudent.questions.length} questions`);

        res.json({ success: true, quiz: quizForStudent });

    } catch (error) {
        console.error('[getQuizForStudent] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Submit quiz answers
// export const submitQuiz = async (req, res) => {
//     try {
//         const userId = req.auth.userId;
//         const { quizId, answers, timeSpent } = req.body;

//         // Get quiz with correct answers
//         const quiz = await Quiz.findById(quizId);
//         if (!quiz) {
//             return res.json({ success: false, message: 'Quiz not found' });
//         }

//         // Check if user is enrolled
//         const user = await User.findById(userId);
//         if (!user || !user.enrolledCourses.includes(quiz.courseId)) {
//             return res.json({ 
//                 success: false, 
//                 message: 'You are not enrolled in this course' 
//             });
//         }

//         // Check max attempts
//         const previousAttempts = await QuizResult.find({ 
//             userId, 
//             quizId 
//         }).countDocuments();

//         if (previousAttempts >= quiz.maxAttempts) {
//             return res.json({ 
//                 success: false, 
//                 message: 'Maximum attempts reached' 
//             });
//         }

//         // Calculate score
//         let score = 0;
//         const detailedAnswers = [];

//         answers.forEach((answer, index) => {
//             const question = quiz.questions[answer.questionIndex];
//             const isCorrect = question.options[answer.selectedOptionIndex].isCorrect;
            
//             if (isCorrect) {
//                 score += question.points;
//             }

//             detailedAnswers.push({
//                 questionIndex: answer.questionIndex,
//                 selectedOptionIndex: answer.selectedOptionIndex,
//                 isCorrect,
//                 points: isCorrect ? question.points : 0
//             });
//         });

//         const percentage = (score / quiz.totalPoints) * 100;
//         const passed = percentage >= quiz.passingScore;

//         // Save result
//         const quizResult = new QuizResult({
//             quizId,
//             courseId: quiz.courseId,
//             userId,
//             score,
//             totalPoints: quiz.totalPoints,
//             percentage,
//             passed,
//             attemptNumber: previousAttempts + 1,
//             answers: detailedAnswers,
//             timeSpent
//         });

//         await quizResult.save();

//         res.json({
//             success: true,
//             result: {
//                 score,
//                 totalPoints: quiz.totalPoints,
//                 percentage: Math.round(percentage),
//                 passed,
//                 attemptNumber: previousAttempts + 1,
//                 timeSpent
//             }
//         });

//     } catch (error) {
//         console.error('[submitQuiz] Error:', error);
//         res.json({ success: false, message: error.message });
//     }
// };
// Submit quiz answers - FIXED
export const submitQuiz = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { quizId, answers, timeSpent } = req.body;

        // Get quiz with correct answers
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.json({ success: false, message: 'Quiz not found' });
        }

        // Check if user is enrolled
        const user = await User.findById(userId);
        if (!user || !user.enrolledCourses.includes(quiz.courseId)) {
            return res.json({ 
                success: false, 
                message: 'You are not enrolled in this course' 
            });
        }

        // Check max attempts
        const previousAttempts = await QuizResult.countDocuments({ 
            userId, 
            quizId 
        });

        if (previousAttempts >= quiz.maxAttempts) {
            return res.json({ 
                success: false, 
                message: 'Maximum attempts reached' 
            });
        }

        // Calculate score
        let score = 0;
        const detailedAnswers = [];

        answers.forEach((answer, index) => {
            const question = quiz.questions[answer.questionIndex];
            const isCorrect = question.options[answer.selectedOptionIndex].isCorrect;
            
            if (isCorrect) {
                score += question.points;
            }

            detailedAnswers.push({
                questionIndex: answer.questionIndex,
                selectedOptionIndex: answer.selectedOptionIndex,
                isCorrect,
                points: isCorrect ? question.points : 0
            });
        });

        const percentage = (score / quiz.totalPoints) * 100;
        const passed = percentage >= quiz.passingScore;

        // Save result
        const quizResult = new QuizResult({
            quizId,
            courseId: quiz.courseId,
            userId,
            score,
            totalPoints: quiz.totalPoints,
            percentage,
            passed,
            attemptNumber: previousAttempts + 1,
            answers: detailedAnswers,
            timeSpent
        });

        await quizResult.save();

        res.json({
            success: true,
            result: {
                score,
                totalPoints: quiz.totalPoints,
                percentage: Math.round(percentage),
                passed,
                attemptNumber: previousAttempts + 1,
                timeSpent
            }
        });

    } catch (error) {
        console.error('[submitQuiz] Error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get user's quiz results for a course
export const getUserQuizResults = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { courseId } = req.params;

        const quiz = await Quiz.findOne({ courseId });
        if (!quiz) {
            return res.json({ success: false, message: 'No quiz found for this course' });
        }

        const results = await QuizResult.find({ 
            userId, 
            quizId: quiz._id 
        }).sort({ attemptNumber: 1 });

        res.json({ success: true, results });

    } catch (error) {
        console.error('[getUserQuizResults] Error:', error);
        res.json({ success: false, message: error.message });
    }
};