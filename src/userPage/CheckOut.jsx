import moment from 'moment/min/moment-with-locales'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router'
import useAuthStore from '../store/auth-store'
import timeStore from '../store/time-store'
import axios from 'axios'
import { createAlert } from '../utils/createAlert'

function CheckOut() {
    const token = useAuthStore((state)=>state.token)
    const {time,actionCheckOut} = timeStore()
    const [isAllowed, setIsAllowed] = useState(false)

    useEffect(() => {
            checkNetwork();
        }, []);
    const checkNetwork = async () => {
        try {
            
            // const res = await axios.get('https://ipapi.co/json/');
            const res = await axios.get('https://ipwhois.app/json/');
            
            const userIP = res.data.ip;
            console.log(res.data)

            const allowedIPs = ['110.168.210.188']; // Replace with your office Wi-Fi IPs

            if (allowedIPs.includes(userIP)) {
                setIsAllowed(true);
            } else {
                setIsAllowed(false);
            }
        } catch (error) {
            console.error("Error fetching IP:", error);
            setIsAllowed(false);
        }
    };
    const hdlSubmit = async (e) => {
        e.preventDefault();

       if (isAllowed) {
                   createAlert("success","ลงชื่อออก สำเร็จ")
                   return;
               } else if(!isAllowed){
                   createAlert("info","คุณต้องเชื่อมต่อไวไฟบริษัท!");
               }


        try {
           const res = await actionCheckOut(time.id,token)
            console.log("CheckOut",res)
            
        } catch (error) {
            console.log("Check-Out",error);
        }
    };
  return (
    <>
    <div className='flex justify-around items-center bg-gradient-to-t from-blue-800 to-blue-500 min-h-screen'>
        <div className="flex mt-50 border-amber-50 w-140 h-140 text-6xl text-white leading-relaxed ml-40">
        "Work with purpose, live with passion."
        </div>

        <div className="flex flex-col items-center  border-white w-1/4 h-140 bg-gray-100 rounded-2xl">
            <h3 className='text-3xl text-blue-900  mt-15'>เวลาเข้า-ออกงาน</h3>
            {/* sign-in sign-up */}
            <div className="flex mt-6 ml-2">
                <div className="border-amber-50 w-40 h-12 rounded-2xl bg-white ">
                    <Link to='/user/check-in'  
                    className='text-xl text-blue-950 flex justify-center mt-2'>เวลาเข้า</Link>
                </div>
                <div className="border-amber-50 w-40 h-12  rounded-2xl bg-blue-700 -ml-4 ">
                    <p className='text-xl text-white flex justify-center mt-2'>เวลาออก</p>
                </div>
            </div>
            {/* input */}
            <form onSubmit={hdlSubmit}>
            <div className="flex flex-col gap-5 mt-10">
    
            <input 
                       disabled
                       placeholder='วันที่'
                       type = 'text'
                       defaultValue={moment(new Date()).locale("th").format("dddd ll")}
                       className="border w-74 h-10 border-gray-400 rounded-md p-1 px-4"
              
                       />
                       <input 
                       disabled
                       placeholder='เวลา'
                       type = 'text'
                       defaultValue={moment(new Date()).locale("th").format("LTS")}
                       className="border w-74 h-10 border-gray-400 rounded-md p-1 px-4"
                 
                       />

            <button className="border-white w-74 h-12 rounded-2xl bg-blue-700 mt-3 text-xl text-white">
                Check-Out
            </button>
            
            </div>
            </form>
        </div>


    </div>
</>
  )
}

export default CheckOut