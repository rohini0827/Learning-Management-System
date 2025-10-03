import { clerkClient } from "@clerk/express";

//middleware protect educator routes
export const protectEducator = async (req, res, next)=>{
    try{
        console.log(req.auth)
        const userId = req.auth.userId
        const response = await clerkClient.users.getUser(userId)

        if(response.publicMetadata.role !== 'educator'){
            return res.json({success: false, message: 'Unauthorized Access'})
        }

        next()

    }catch (error){
        res.json({success: false, message: error.message})
    }
}





// import { clerkClient } from "@clerk/expresslllll";

// // Middleware to protect educator routes
// export const protectEducator = async (req, res, next) => {
//   try {
//     const auth = req.auth();   // ✅ now a function
//     console.log(auth);

//     const userId = auth.userId;

//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized: No user ID found" });
//     }

//     const response = await clerkClient.users.getUser(userId);

//     if (response.publicMetadata.role !== "educator") {
//       return res.status(403).json({ success: false, message: "Unauthorized Access" });
//     }

//     next();
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
