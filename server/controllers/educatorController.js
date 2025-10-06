import { clerkClient } from '@clerk/express'
import Course from '../models/Course.js'
import {v2 as cloudinary} from 'cloudinary'
import { Purchase } from '../models/Purchase.js'
import User from '../models/User.js'
import { CourseProgress } from '../models/CourseProgress.js'
//update role to educator
export const updateRoleToEducator = async (req, res)=>{
    try{
        const userId = req.auth.userId

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata:{
                role: 'educator',
            }
        })
        
        res.json({ success: true, message: 'You can publish a course now' })

    }catch (error){
        res.json({ success: false, message: error.message })
    }
}

//add new course
export const addCourse = async (req, res)=>{
    try{
        const {courseData} = req.body
        const imageFile = req.file
        const educatorId = req.auth.userId
        console.log(courseData, imageFile, educatorId)

        if(!imageFile){
            return res.json({success: false, message: 'Thumbnail Not Attached'})
        }

        const parsedCourseData = await JSON.parse(courseData)
        parsedCourseData.educator = educatorId
        const newCourse = await Course.create(parsedCourseData)
        const imageUpload = await cloudinary.uploader.upload(imageFile.path)
        newCourse.courseThumbnail = imageUpload.secure_url
        await newCourse.save()

        res.json({success: true, message: 'Course Added'})

    }catch (error){
        res.json({success: false, message: error.message})
    }
}

//get educator courses
export const getEducatorCourses = async (req, res)=>{
    try{
        const educator = req.auth.userId
        const courses = await Course.find({educator})
        res.json({success: true, courses})
    }catch (error){
        res.json({success: false, message: error.message})
    }
}

// get educator dashboard data {total courses, total students, no. of courses}

// export const educatorDashboardData = async (req, res)=>{
//     try{
//         const educator = req.auth.userId;
//         const courses = await Course.find({ educator });
//         const totalCourses = courses.length;

//         const courseIds = courses.map(course => course._id);

//         //calculate total earning from purchases
//         const purchases = await Purchase.find({ 
//             courseId: { $in: courseIds },
//             status: 'completed'
//         });

//         const totalEarnings = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

//         //collect unique enrolled student IDs with their course titles
//         const enrolledStudentsData = [];
//         for(const course of courses){
//             const students = await User.find({
//                 _id: { $in: course.enrolledStudents }
//             }, 'name imageUrl');

//             students.forEach(student =>{
//                 enrolledStudentsData.push({
//                     courseTitle: course.courseTitle,
//                     student
//                 });
//             });
//         }

//         res.json({success: true, dashboardData: {
//             totalEarnings, enrolledStudentsData, totalCourses
//         }})

//     } catch (error){
//         res.json({success: false, message: error.message});
//     }
// }

export const educatorDashboardData = async (req, res)=>{
    try{
        const educator = req.auth.userId;
        const courses = await Course.find({ educator });
        const totalCourses = courses.length;

        const courseIds = courses.map(course => course._id);

        // Calculate total earning from purchases
        const purchases = await Purchase.find({ 
            courseId: { $in: courseIds },
            status: 'completed'
        });

        const totalEarnings = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

        // ✅ FIXED: Get enrolled students from purchases
        const enrolledStudentsData = [];
        
        for(const purchase of purchases){
            try {
                const student = await User.findById(purchase.userId);
                const course = await Course.findById(purchase.courseId);
                
                if(student && course){
                    enrolledStudentsData.push({
                        courseTitle: course.courseTitle,
                        student: {
                            _id: student._id,
                            name: student.name,
                            imageUrl: student.imageUrl,
                            email: student.email
                        },
                        purchaseDate: purchase.createdAt
                    });
                }
            } catch (err) {
                console.error('Error fetching student/course data:', err);
                continue;
            }
        }

        // ✅ Sort by purchase date to get latest enrollments first
        enrolledStudentsData.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));

        res.json({
            success: true, 
            dashboardData: {
                totalEarnings, 
                enrolledStudentsData, 
                totalCourses
            }
        });

    } catch (error){
        console.error('[educatorDashboardData] Error:', error);
        res.json({success: false, message: error.message});
    }
}

//get enrolled students data with purchase data
export const getEnrolledStudentsData = async (req, res)=>{
    try{
        const educator = req.auth.userId;
        const courses = await Course.find({ educator });
        const courseIds = courses.map(course => course._id);

        const purchases = await Purchase.find({
            courseId: { $in: courseIds }, 
            status: 'completed'
        }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle');

        const enrolledStudents = purchases.map(purchase =>({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt
        }));

        res.json({success: true, enrolledStudents})

    }catch (error){
        res.json({success: false, message: error.message})
    }
}

// Delete course and all related data
export const deleteCourse = async (req, res) => {
    try {
        const educatorId = req.auth.userId;
        const { courseId } = req.body;

        if (!courseId) {
            return res.json({ success: false, message: 'Course ID is required' });
        }

        // Check if course exists and belongs to the educator
        const course = await Course.findOne({ _id: courseId, educator: educatorId });
        if (!course) {
            return res.json({ 
                success: false, 
                message: 'Course not found or you are not authorized to delete this course' 
            });
        }

        // Delete all related data in parallel for better performance
        await Promise.all([
            // Delete the course
            Course.findByIdAndDelete(courseId),
            
            // Delete all purchases for this course
            Purchase.deleteMany({ courseId }),
            
            // Delete all course progress records
            CourseProgress.deleteMany({ courseId }),
            
            // Remove course from users' enrolledCourses array
            User.updateMany(
                { enrolledCourses: courseId },
                { $pull: { enrolledCourses: courseId } }
            )
        ]);

        // If you have cloudinary image, you might want to delete it too
        if (course.courseThumbnail) {
            try {
                const publicId = course.courseThumbnail.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (cloudinaryError) {
                console.error('Error deleting Cloudinary image:', cloudinaryError);
                // Continue even if image deletion fails
            }
        }

        res.json({ 
            success: true, 
            message: 'Course and all related data deleted successfully' 
        });

    } catch (error) {
        console.error('[deleteCourse] Error:', error);
        res.json({ success: false, message: error.message });
    }
};