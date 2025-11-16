// import React from 'react'
// import { useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom'

// const Loading = () => {

//   const { path } = useParams()
//   const navigate = useNavigate();

//   useEffect(()=>{
//     if(path){
//       const timer = setTimeout(()=>{
//         navigate(`/${path}`)
//       }, 5000)
//       return ()=> clearTimeout(timer)
//     }
//   })

//   return (
//     <div className='min-h-screen flex items-center justify-center'>
//       <div className='w-16 sm:w-20 aspect-square border-4 border-gray-300 border-t-4 border-t-blue-400 rounded-full animate-spin'>

//       </div>
//     </div>
//   )
// }

// export default Loading

import React from 'react'

const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}

export default Loading