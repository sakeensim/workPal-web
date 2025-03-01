import axios from 'axios'
import React, { useState } from 'react'
import { createAlert } from '../utils/createAlert'
import { Link, useNavigate } from 'react-router'
import  useAuthStore  from '../store/auth-store'

function Login() {
    //Code
const loginWithZustand = useAuthStore(state => state.loginWithZustand)

    const navigate = useNavigate()
    //เก็บค่าที่userกรอกเข้ามา โดยให้ค่าเริ่มต้นเป็นค่าว่าง
    const [value, setValue]= useState({
        email: '',
        password: '',
    })
    const hdlOnchange = (e) =>{
        // console.log(e.target.value)
        setValue({...value, [e.target.name]: e.target.value})
    }
    const hdlSubmit = async(e) => {
        e.preventDefault()

            const res =await loginWithZustand(value)
            console.log(res)
            if(res.success){
                roleDirect(res.role)
                createAlert('success', 'Login Success')            
            }else{
                createAlert('error', res.message)
            }
}

    const roleDirect = (role) => {
        if(role === 'USER'){
            navigate('/user')
        }else if(role === 'ADMIN'){
            navigate('/admin')
        }
        console.log(role)
    }
    return (
        <>
            <div className='flex justify-around items-center bg-gradient-to-t from-blue-800 to-blue-500 h-screen'>
                <div className="flex items-center border-amber-50 w-140 h-140 text-4xl text-white leading-relaxed">
                    "Work is not everything in life,but it is where we prove our skills and professionalism to the world."
                </div>

                <div className="flex flex-col items-center  border-white w-100 h-140 bg-gray-100 rounded-2xl">
                    <h1 className='text-5xl text-blue-900  mt-15'>Login</h1>
                    {/* sign-in sign-up */}
                    <div className="flex mt-6 ml-2">
                        <div className="border-amber-50 w-40 h-12 rounded-2xl bg-blue-700 absolute -ml-4 ">
                            <p className='text-xl text-white flex justify-center mt-2'>Log-in</p>
                        </div>
                        <div className="border-amber-50 w-40 h-12  rounded-2xl bg-white ml-30 ">
                            <Link to='/register' className='text-xl text-blue-950 flex justify-center mt-2'>Sign-up</Link>
                        </div>
                    </div>
                    {/* input */}
                    <form onSubmit={hdlSubmit}>
                    <div className="flex flex-col gap-5 mt-10">
            
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

                     {/* <div className="border-white w-74 h-12 rounded-2xl bg-blue-700 mt-10 ">
                            <p className='text-xl text-white flex justify-center mt-2'>Log-in</p>
                        </div> */}
                    <button className="border-white w-74 h-12 rounded-2xl bg-blue-700 mt-3 text-xl text-white">
                        Log-in
                    </button>
                    
                    </div>
                    </form>
                </div>


            </div>
        </>
    )
}

export default Login