import axios from 'axios'
import React, { useState } from 'react'
import { createAlert } from '../utils/createAlert'
import { Link } from 'react-router'

function Register() {

    //เก็บค่าที่userกรอกเข้ามา โดยให้ค่าเริ่มต้นเป็นค่าว่าง
    const [value, setValue]= useState({
        firstname: '',
        lastname: '',
        phonenumber: '',
        email: '',
        password: '',
        confirmpassword: ''
    })
    const hdlOnchange = (e) =>{
        // console.log(e.target.value)
        setValue({...value, [e.target.name]: e.target.value})
    }
    const hdlSubmit = async(e)=>{
        e.preventDefault()
        try {
            //connect to backend
            const res = await axios.post('http://localhost:9191/register', value)
            
            createAlert('success', 'Register Success')
            
            console.log(res)
        } catch (error) {
           
            createAlert('error', error.response.data.message)
            console.log(error.response.data.message)
        }
    }
  return (
  <>
  <div className='flex justify-around items-center bg-gradient-to-t from-blue-800 to-blue-500 h-screen'>
                <div className="flex items-center border-amber-50 w-140 h-140 text-4xl text-white leading-relaxed">
                    "Work is not everything in life,but it is where we prove our skills and professionalism to the world."
                </div>

                <div className="flex flex-col items-center  border-white w-100 h-140 bg-gray-100 rounded-2xl">
                    <h1 className='text-5xl text-blue-900  mt-4'>Sign-up</h1>
                    {/* sign-in sign-up */}
                    <div className="flex mt-6 -ml-31">
                        <div className="border-amber-50 w-40 h-12 rounded-2xl bg-white ml-30 ">
                            <Link to='/' className='text-xl text-blue-950 flex justify-center mt-2'>Log-in</Link>
                        </div>
                        <div className="border-amber-50 w-40 h-12  rounded-2xl bg-blue-700   -ml-4">
                            <p className='text-xl text-white flex justify-center mt-2'>Sign-up</p>
                        </div>
                    </div>
                    {/* input */}
                    <form onSubmit={hdlSubmit}>
                    <div className="flex flex-col gap-3 mt-4">
                    <input 
                    placeholder='Firstname'
                    type = 'text'
                    name = 'firstname'
                    className="border w-74 h-10 border-gray-400 rounded-md p-1 px-4"
                     onChange={hdlOnchange}
                    />
                    <input 
                    placeholder='Lastname'
                    type = 'text'
                    name = 'lastname'
                    className="border w-74 h-10 border-gray-400 rounded-md p-1 px-4"
                    onChange={hdlOnchange}
                    />
                    <input 
                    placeholder='Phone number'
                    type = 'text'
                    name = 'phonenumber'
                    className="border w-74 h-10 border-gray-400 rounded-md p-1 px-4"
                    onChange={hdlOnchange}
                    />
                    <input 
                    placeholder='Email Address'
                    type = 'text'
                    name = 'email'
                    className="border w-74 h-10 border-gray-400 rounded-md p-1 px-4"
                    onChange={hdlOnchange}
                    />
                    <input 
                    placeholder='Password'
                    type = 'text'
                    name = 'password'
                    className="border w-74 h-10 border-gray-400 rounded-md p-1 px-4"
                    onChange={hdlOnchange}
                    />
                    <input 
                    placeholder='Confirmpassword'
                    type = 'text'
                    name = 'confirmpassword'
                    className="border w-74 h-10 border-gray-400 rounded-md p-1 px-4"
                    onChange={hdlOnchange}
                    />

                    <button className="border-white w-74 h-12 rounded-2xl bg-blue-700 mt-3 text-xl text-white hover:cursor-pointer"
                    >
                        Sign-up
                    </button>
                
                    </div>
                    </form>
                </div>


            </div>
  </>
  )
}

export default Register