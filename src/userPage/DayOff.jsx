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
    <div className="flex justify-around items-center bg-gradient-to-t from-blue-800 to-blue-500 h-screen">
      <div className="flex mt-50 border-amber-50 w-140 h-140 text-5xl text-white leading-relaxed ml-40">
        “Take a break, take a breath, and take care of yourself."
      </div>

      <div className="flex flex-col items-center border-white w-100 h-150 bg-gray-100 rounded-2xl">
        <h3 className="text-3xl text-blue-900 mt-5">Day Off</h3>

        <form onSubmit={hdlSubmit}>
          <div className="flex flex-col gap-5 mt-5">
            <DayPicker mode="single" selected={selected} onSelect={setSelected} />

            <input
              placeholder="เหตุผล"
              type="text"
              name="reason"
              className="border w-74 h-10 border-gray-400 rounded-md p-1 px-4"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <button className="border-white w-74 h-12 rounded-2xl bg-blue-700 mt-3 text-xl text-white">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DayOff;
