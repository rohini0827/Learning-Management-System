import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import CourseCard from './CourseCard'

const CoursesSection = () => {

  const {allCourses} = useContext(AppContext)

  return (
    <div className='py-16 md:px-40 px-8'>
      <h2 className='text-3xl font-medium text-gray-800'>Learn From The Best</h2>
      <p className='text-sm md:text-base text-gray-500 mt-3'>Discover our top-rated courses across various categories. From coding and design to <br/>business and wellness, our courses are crafted to deliver results. </p>

    <div className='grid grid-cols-auto px-4 md:my-16 my-10 gap-4'>
      {allCourses.slice(0,4).map((course, index)=> <CourseCard key={index} course={course} />)}
    </div>

      <Link to={'/course-list'} onClick={()=> scrollTo(0,0)} className='inline-block border bg-blue-600 border-gray-400 text-white px-6 py-2 rounded-md'>Show all courses</Link>
    </div>
  )
}

export default CoursesSection
