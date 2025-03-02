import React from 'react'
import { Link } from 'react-router'

function CheckIn() {
  return (
    <>
    <div className='flex justify-around items-center bg-gradient-to-t from-blue-800 to-blue-500 h-screen'>
        <div className="flex mt-80 border-amber-50 w-140 h-140 text-5xl text-white leading-relaxed ml-40">
            "Your work, your way, your success story."
        </div>

        <div className="flex flex-col items-center  border-white w-100 h-140 bg-gray-100 rounded-2xl">
            <h3 className='text-3xl text-blue-900  mt-15'>เวลาเข้า-ออกงาน</h3>
            {/* sign-in sign-up */}
            <div className="flex mt-6 ml-2">
                <div className="border-amber-50 w-40 h-12 rounded-2xl bg-blue-700 absolute -ml-4 ">
                    <p className='text-xl text-white flex justify-center mt-2'>เวลาเข้า</p>
                </div>
                <div className="border-amber-50 w-40 h-12  rounded-2xl bg-white ml-30 ">
                    <Link to='/user/check-out' className='text-xl text-blue-950 flex justify-center mt-2'>เวลาออก</Link>
                </div>
            </div>
            {/* input */}
            <form>
            <div className="flex flex-col gap-5 mt-10">
    
            <input 
            placeholder='วันที่'
            // type = 'text'
            // name = 'email'
            className="border w-74 h-10 border-gray-400 rounded-md p-1 px-4"
   
            />
            <input 
            placeholder='เวลา'
            // type = 'text'
            // name = 'password'
            className="border w-74 h-10 border-gray-400 rounded-md p-1 px-4"
      
            />

            <button className="border-white w-74 h-12 rounded-2xl bg-blue-700 mt-3 text-xl text-white">
                Check-In
            </button>
            
            </div>
            </form>
        </div>


    </div>
</>
  )
}

export default CheckIn