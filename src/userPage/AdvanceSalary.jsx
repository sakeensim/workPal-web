import React from 'react'

function AdvanceSalary() {
  return (
    <>
    <div className='flex justify-around items-center bg-gradient-to-t from-blue-800 to-blue-500 h-screen'>
        <div className="flex mt-50 border-amber-50 w-140 h-140 text-5xl text-white leading-relaxed ml-40">
        “Take a break,take a breath, and take care of yourself."
        </div>

        <div className="flex flex-col items-center  border-white w-100 h-140 bg-gray-100 rounded-2xl">
            <h3 className='text-3xl text-blue-900  mt-15'>Advance Salary</h3>
            {/* sign-in sign-up */}
            
            {/* input */}
            <form>
            <div className="flex flex-col gap-5 mt-20">
    
            <input 
            placeholder='14/2/2025'
            // type = 'text'
            // name = 'email'
            className="border w-74 h-10 border-gray-400 rounded-md p-1 px-4"
   
            />
            <input 
            placeholder='จำนวน.............บาท'
            // type = 'text'
            // name = 'password'
            className="border w-74 h-10 border-gray-400 rounded-md p-1 px-4"
      
            />

            <button className="border-white w-74 h-12 rounded-2xl bg-blue-700 mt-3 text-xl text-white">
                Submit
            </button>
            
            </div>
            </form>
        </div>


    </div>
</>
  )
}

export default AdvanceSalary