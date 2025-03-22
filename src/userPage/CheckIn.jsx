import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment/min/moment-with-locales';
import axios from 'axios';
import useAuthStore from '../store/auth-store';
import timeStore from '../store/time-store';
import { createAlert } from '../utils/createAlert';

function CheckIn() {
    const token = useAuthStore((state) => state.token);
    const { actionCheckIn } = timeStore();
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        checkNetwork();
    }, []);

    const checkNetwork = async () => {
        try {
            const res = await axios.get('https://ipwhois.app/json/');
            const userIP = res.data.ip;
            console.log(res.data);

            const allowedIPs = ['184.82.221.58']; // Replace with your office Wi-Fi IPs
            setIsAllowed(allowedIPs.includes(userIP));
        } catch (error) {
            console.error("Error fetching IP:", error);
            setIsAllowed(false);
        }
    };

    const hdlSubmit = async (e) => {
        e.preventDefault();

        if (!isAllowed) {
            createAlert("info", "คุณต้องเชื่อมต่อไวไฟบริษัท!");
            return;
        }

        try {
            console.log("Sending check-in request...");
            const res = await actionCheckIn(token);
            console.log("Check-in response:", res);
            createAlert("success", "ลงชื่อเข้า สำเร็จ");
        } catch (error) {
            console.error("Check-in failed:", error);
            createAlert("error", "Check-in ล้มเหลว");
        }
    };

    return (
        <div className="flex flex-col lg:flex-row justify-center items-center h-screen p-4">
            
            {/* Hidden on mobile, visible on larger screens */}
            <div className="hidden lg:flex text-4xl text-white leading-relaxed ml-10">
                "Work with purpose, live with passion."
            </div>

            {/* Check-In Box */}
            <div className="flex flex-col items-center border-white bg-gray-100 rounded-2xl 
                            w-80 h-120 sm:w-96 sm:h-96 lg:w-100 lg:h-150 p-6 shadow-lg">
                <h3 className="text-2xl text-blue-900 mt-3">เวลาเข้า-ออกงาน</h3>

                {/* Navigation Buttons */}
                <div className="flex mt-6 w-full justify-center">
                    <p className="w-36 h-12 flex justify-center items-center text-xl text-white bg-blue-700 rounded-xl">
                        เวลาเข้า
                    </p>
                    <Link to='/user/check-out' className="w-36 h-12 flex justify-center items-center text-xl text-blue-950 bg-white rounded-xl border border-gray-300 ml-2">
                        เวลาออก
                    </Link>
                </div>

                {/* Form */}
                <form onSubmit={hdlSubmit} className="w-full mt-6">
                    <div className="flex flex-col gap-4">
                        <input
                            disabled
                            placeholder='วันที่'
                            type='text'
                            defaultValue={moment(new Date()).locale("th").format("dddd ll")}
                            className="border w-full h-10 border-gray-400 rounded-md p-2"
                        />
                        <input
                            disabled
                            placeholder='เวลา'
                            type='text'
                            defaultValue={moment(new Date()).locale("th").format("LTS")}
                            className="border w-full h-10 border-gray-400 rounded-md p-2"
                        />
                        <button type="submit" className="w-full h-12 rounded-lg bg-blue-700 text-xl text-white mt-3">
                            Check-In
                        </button>
                    </div>
                </form>
            </div>

        </div>
    );
}

export default CheckIn;
