import moment from 'moment/min/moment-with-locales';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/auth-store';
import timeStore from '../store/time-store';
import axios from 'axios';
import { createAlert } from '../utils/createAlert';
import useIPConfigStore from '../store/IP-Config';

function CheckOut() {
    const token = useAuthStore((state) => state.token);
    const { time, actionCheckOut } = timeStore();
    const { allowedIPs } = useIPConfigStore(); // Get allowed IPs from store
    const [isAllowed, setIsAllowed] = useState(false);
    const [userIP, setUserIP] = useState('');

    useEffect(() => {
        checkNetwork();
    }, [allowedIPs]); // Re-check when allowed IPs change

    const checkNetwork = async () => {
        try {
            const res = await axios.get('https://ipwhois.app/json/');
            const currentIP = res.data.ip;
            setUserIP(currentIP);
            console.log("Current IP:", currentIP);
            console.log("Allowed IPs:", allowedIPs);

            // Check if current IP is in the allowed list
            setIsAllowed(allowedIPs.includes(currentIP));
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

        if (!time?.id) {
            createAlert("error", "ไม่พบ ID การเข้าเช็คอิน กรุณาลองใหม่");
            return;
        }

        try {
            console.log("Sending check-out request with ID:", time.id);
            const res = await actionCheckOut(time.id, token);
            console.log("Check-Out Response:", res);
            createAlert("success", "ลงชื่อออก สำเร็จ");
        } catch (error) {
            console.error("Check-Out Failed:", error);
            createAlert("error", "Check-out ล้มเหลว");
        }
    };

    return (
        <div className="flex flex-col lg:flex-row justify-center items-center h-screen p-4">
            
            {/* Hidden on mobile, visible on larger screens */}
            <div className="hidden lg:flex text-4xl text-white leading-relaxed ml-10">
                "Work with purpose, live with passion."
            </div>

            {/* Check-Out Box */}
            <div className="flex flex-col items-center border-white bg-gray-100 rounded-2xl 
                            w-80 h-120 sm:w-96 sm:h-96 lg:w-100 lg:h-150 p-6 shadow-lg">
                <h3 className="text-2xl text-blue-900 mt-3">เวลาเข้า-ออกงาน</h3>

                {/* Navigation Buttons */}
                <div className="flex mt-6 w-full justify-center">
                    <Link to='/user/check-in' className="w-36 h-12 flex justify-center items-center text-xl text-blue-950 bg-white rounded-xl border border-gray-300">
                        เวลาเข้า
                    </Link>
                    <p className="w-36 h-12 flex justify-center items-center text-xl text-white bg-blue-700 rounded-xl ml-2">
                        เวลาออก
                    </p>
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
                        <button className="w-full h-12 rounded-lg bg-blue-700 text-xl text-white mt-3">
                            Check-Out
                        </button>
                    </div>
                </form>
            </div>

        </div>
    );
}

export default CheckOut;
