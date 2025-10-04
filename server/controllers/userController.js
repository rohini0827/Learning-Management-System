import User from "../models/User.js"
import { Purchase } from "../models/Purchase.js";
import Stripe from "stripe";
import Course from "../models/Course.js";


//get user data
export const getUserData = async (req, res)=>{
    try{
        const userId = req.auth().userId
        const user = await User.findById(userId)

        if(!user){
            return res.json({ success: false, message: 'User Not Found' })
        }

        res.json({ success: true, user })
    } catch (error){
        res.json({ success: false, message: error.message })
    }
}

//user enrolled courses with lectue links
export const userEnrolledCourses = async (req, res)=>{
    try{
        const userId = req.auth().userId
        const userData = await User.findById(userId).populate('enrolledCourses')

        res.json({success: true, enrolledCourses: userData.enrolledCourses})
    }catch (error){
        res.json({ success: false, message: error.message })
    }
}

//PURCHASE COURSE
// export const purchaseCourse = async (req, res)=>{
//     try{
//         const { courseId } = req.body
//         const { origin } = req.headers
//         const userId = req.auth.userId
//         const userData = await User.findById(userId)
//         const courseData = await Course.findById(courseId)
        
//         console.log(courseData)
//         console.log(userData)
//         // if(!userData || !courseData){
//         //     return res.json({ success: false, message: 'Data Not Found'})
//         // }

//         const purchaseData = {
//             courseId: courseData._id,
//             amount: (courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2),
//             status: "pending" | "completed" | "failed"
//         }

//         const newPurchase = await Purchase.create(purchaseData)

//         //stripe geteway initialization
//         const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)

//         const currency = process.env.CURRENCY.toLowerCase()

//         //creating line items for stripe
//         const line_items = [{
//             price_data:{
//                 currency,
//                 product_data: {
//                     name: courseData.courseTitle
//                 },
//                 unit_amount: Math.floor(newPurchase.amount) * 100
//             },
//             quantity: 1
//         }]

//         const session = await stripeInstance.checkout.sessions.create({
//             success_url: `${origin}/loading/my-enrollments`,
//             cancel_url: `${origin}/`,
//             line_items: line_items,
//             mode: 'payment',
//             metadata: {
//                 purchaseId: newPurchase._id.toString()
//             }
//         })

//         res.json({success: true, session_url: session.url})


//     } catch (error){
//         res.json({ success: false, message: error.message })
//     }
// }


export const purchaseCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const { origin } = req.headers;
        const userId = req.auth().userId;
        console.log("req",req);
        console.log('[purchaseCourse] userId:', userId);
        // const userData = await User.findById(userId);
        const courseData = await Course.findById(courseId);

        // if (!userData) {
        //     console.error('[purchaseCourse] User not found for userId:', userId);
        //     return res.json({ success: false, message: 'User Not Found' });
        // }
        if (!courseData) {
            console.error('[purchaseCourse] Course not found for courseId:', courseId);
            return res.json({ success: false, message: 'Course Not Found' });
        }

        const purchaseData = {
            courseId: courseData._id,
            userId: userId,
            amount: Number((courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2)),
            status: "pending"
        };
        console.log('[purchaseCourse] purchaseData:', purchaseData);

        const newPurchase = await Purchase.create(purchaseData);
        console.log('[purchaseCourse] newPurchase created:', newPurchase);

        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
        const currency = process.env.CURRENCY.toLowerCase();
        const baseUrl = origin || "http://localhost:3000";

        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: courseData.courseTitle
                },
                unit_amount: Math.floor(newPurchase.amount * 100)
            },
            quantity: 1
        }];

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${baseUrl}/loading/my-enrollments`,
            cancel_url: `${baseUrl}/`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                purchaseId: newPurchase._id.toString()
            }
        });
        console.log('[purchaseCourse] Stripe session created:', session.id);

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.error('[purchaseCourse] Error:', error);
        res.json({ success: false, message: error.message });
    }
};