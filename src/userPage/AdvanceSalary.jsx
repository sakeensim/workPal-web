import moment from 'moment/min/moment-with-locales'
import React, { useState } from 'react'
import salaryStore from '../store/salary-store'
import useAuthStore from '../store/auth-store'
import { createAlert } from '../utils/createAlert'

function AdvanceSalary() {
  const token = useAuthStore((state)=>state.token)
  const {actionSalary} = salaryStore()
  const [amount, setAmount] = useState()


  const hdlSubmit = async (e)=>{
    e.preventDefault()


  if (!amount) {
    console.error("Please fill amount");
    return;
  }
  createAlert('success','Your request has been submitted')
  
    try {
      const res = await actionSalary(token,amount)
      setAmount ('')  //Reset input after success

    } catch (error) {
      console.log(error)
    }
  }
  return (
    <>
    <div className='flex flex-col md:flex-row justify-center md:justify-around items-center bg-gradient-to-t from-blue-800 to-blue-500 min-h-screen p-4'>
        <div className="fhidden md:flex max-w-md text-3xl md:text-4xl lg:text-5xl text-white leading-relaxed mb-6 md:mb-0">
        “Take a break,take a breath, and take care of yourself."
        </div>

        <div className="flex flex-col items-center w-full max-w-sm md:max-w-md bg-gray-100 rounded-2xl p-6 h-150">
            <h3 className='text-3xl text-blue-900  mt-15'>Advance Salary</h3>
            {/* sign-in sign-up */}
            
            {/* input */}
            <form onSubmit={hdlSubmit}> 
            <div className="flex flex-col gap-5 mt-20">
    
            <input 
            disabled
            placeholder='วันที่'
            type = 'text'
           defaultValue={moment(new Date()).locale("th").format("dddd ll")}
            className="border w-74 h-10 border-gray-400 rounded-md p-1 px-4"
   
            />
            <input 
            placeholder='จำนวน.............บาท'
            type = 'text'
            value = {amount}
            onChange={(e)=>setAmount(e.target.value)} //update State
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