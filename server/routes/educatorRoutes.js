import express from 'express'
import { addCourse, educatorDashboardData, getEducatorCourses, getEnrolledStudentsData, updateRoleToEducator,deleteCourse } from '../controllers/educatorController.js';
import upload from '../configs/multer.js';
import { protectEducator } from '../middlewares/authMiddleware.js';

const educatorRouter = express.Router()

//add educator role
educatorRouter.get('/update-role', updateRoleToEducator)
educatorRouter.post('/add-course', upload.single('image'), protectEducator, addCourse)
educatorRouter.get('/courses', protectEducator, getEducatorCourses)
educatorRouter.get('/dashboard', protectEducator, educatorDashboardData)
educatorRouter.get('/enrolled-students', protectEducator, getEnrolledStudentsData)
educatorRouter.post('/delete-course', deleteCourse);
export default educatorRouter;



// {
//     "courseTitle": "Test Course Title",
//     "courseDescription": "Test Course Description",
//     "coursePrice": 50,
//     "discount": 10,
//     "courseContent": [
//         {
//             "chapterId": "ch01",
//             "chapterOrder": 1,
//             "chapterTitle": "Test Chapter Title",
//             "chapterContent": [
//                 {
//                     "lectureId": "lec01",
//                     "lectureTitle": "Test Lecture Title",
//                     "lectureDuration": 20,
//                     "lectureUrl": "https://example.com/lectures/lec01.mp4",
//                     "isPreviewFree": true,
//                     "lectureOrder": 1

//                 }
//             ]
//         }
//     ]
// }