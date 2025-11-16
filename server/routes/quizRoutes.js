import express from 'express';
import { 
    createQuiz, 
    getQuizByCourse, 
    updateQuiz, 
    deleteQuiz,
    getEducatorCoursesForQuiz,
    checkCourseCompletion,
    getQuizForStudent,
    submitQuiz,
    getUserQuizResults  
} from '../controllers/quizController.js';

const quizRouter = express.Router();

quizRouter.post('/create', createQuiz);
quizRouter.get('/course/:courseId', getQuizByCourse);
quizRouter.post('/update', updateQuiz);
quizRouter.post('/delete', deleteQuiz);
quizRouter.get('/educator-courses', getEducatorCoursesForQuiz);

// Add these routes to your existing quizRoutes.js
quizRouter.post('/check-course-completion', checkCourseCompletion);
quizRouter.get('/student/:courseId', getQuizForStudent);
quizRouter.post('/submit', submitQuiz);
quizRouter.get('/results/:courseId', getUserQuizResults);

export default quizRouter;