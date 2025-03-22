import React, { useState } from "react";
import useTimeStore from "../store/time-store"; 
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import useAuthStore from "../store/auth-store";
import { createAlert } from '../utils/createAlert'

function DayOff() {
  const token = useAuthStore((state) => state.token);
  const { actionDayOff } = useTimeStore(); 

  const [selected, setSelected] = useState();
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("PENDING");

  const hdlSubmit = async (e) => {
    e.preventDefault();
  
    if (!token) {
      console.error("No token found! Please log in.");
      return;
    }
  
    if (!selected) {
      console.error("Please select a date.");
      return;
    }
  
    // Check if the selected date has already passed
    const currentDate = new Date();
    const requestDate = new Date(selected);
    if (requestDate < currentDate) {
      createAlert('error', "โปรดเลือกวันที่ในอนาคต!");
      return;
    }
  
    // Submit the day off request
    createAlert('success', 'You have booked a day off');
    try {
      const res = await actionDayOff(token, selected, reason, status);
      console.log("Response:", res);
    } catch (error) {
      console.error("Error submitting day off:", error);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row justify-center items-center h-screen p-4">
      
      {/* Hidden on mobile, visible on larger screens */}
      <div className="hidden lg:flex border-amber-50 text-4xl text-white leading-relaxed ml-10">
        “Take a break, take a breath, and take care of yourself."
      </div>

      {/* The main square box */}
      <div className="flex flex-col items-center border-white bg-gray-100 rounded-2xl 
                      w-80 h-150 sm:w-96 sm:h-96 lg:w-100 lg:h-150 p-6 shadow-lg">
        <h3 className="text-2xl text-blue-900 mt-3">วันหยุด</h3>

        <form onSubmit={hdlSubmit} className="w-full">
          <div className="flex flex-col gap-4 mt-4">
            <DayPicker mode="single" selected={selected} onSelect={setSelected} />

            <input
              placeholder="เหตุผล"
              type="text"
              name="reason"
              className="border w-full h-10 border-gray-400 rounded-md p-2"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <button className="w-full h-12 rounded-lg bg-blue-700 text-xl text-white mt-3">
              Submit
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

export default DayOff;
