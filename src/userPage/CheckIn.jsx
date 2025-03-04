import React from 'react'
import { Link } from 'react-router'
import moment from 'moment/min/moment-with-locales'
import axios from 'axios'
import useAuthStore from '../store/auth-store'
import timeStore from '../store/time-store'

function CheckIn() {
    const token = useAuthStore((state)=>state.token)
    const user = useAuthStore((state)=>state.user)
    const {time,actionCheckIn} = timeStore()

    const hdlSubmit = async (e) => {
        e.preventDefault()
        try {
           actionCheckIn(token)
        } catch (error) {
            console.log(error)
        }
    }
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
                    <form onSubmit={hdlSubmit}>
                        <div className="flex flex-col gap-5 mt-10">

                            <input
                                disabled
                                placeholder='วันที่'
                                type='text'
                                defaultValue={moment(new Date()).locale("th").format("dddd ll")}
                                className="border w-74 h-10 border-gray-400 rounded-md p-1 px-4"

                            />
                            <input
                                disabled
                                placeholder='เวลา'
                                type='text'
                                defaultValue={moment(new Date()).locale("th").format("LTS")}
                                className="border w-74 h-10 border-gray-400 rounded-md p-1 px-4"

                            />


                            <button type="submit" className="border-white w-74 h-12 rounded-2xl bg-blue-700 mt-3 text-xl text-white">
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