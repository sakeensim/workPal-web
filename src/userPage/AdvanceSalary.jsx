import moment from 'moment/min/moment-with-locales';
import React, { useState } from 'react';
import salaryStore from '../store/salary-store';
import useAuthStore from '../store/auth-store';
import { createAlert } from '../utils/createAlert';

function AdvanceSalary() {
  const token = useAuthStore((state) => state.token);
  const { actionSalary } = salaryStore();
  const [amount, setAmount] = useState('');

  const hdlSubmit = async (e) => {
    e.preventDefault();

    if (!amount) {
      createAlert('error', 'กรุณากรอกจำนวนเงิน!');
      return;
    }

    createAlert('success', 'Your request has been submitted');

    try {
      await actionSalary(token, amount);
      setAmount(''); // Reset input after success
    } catch (error) {
      console.error('Error submitting advance salary request:', error);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row justify-center items-center min-h-screen p-4">
      
      {/* Hidden on mobile, visible on larger screens */}
      <div className="hidden lg:flex text-4xl text-white leading-relaxed ml-10">
        “Take a break, take a breath, and take care of yourself."
      </div>

      {/* Salary Request Box */}
      <div className="flex flex-col items-center border-white bg-gray-100 rounded-2xl 
                      w-80 h-120 sm:w-96 sm:h-96 lg:w-100 lg:h-150 p-6 shadow-lg">
        <h3 className="text-2xl text-blue-900 mt-3">Advance Salary</h3>

        {/* Form */}
        <form onSubmit={hdlSubmit} className="w-full mt-6">
          <div className="flex flex-col gap-4">
            <input
              disabled
              placeholder="วันที่"
              type="text"
              defaultValue={moment(new Date()).locale("th").format("dddd ll")}
              className="border w-full h-10 border-gray-400 rounded-md p-2"
            />
            <input
              placeholder="จำนวนเงิน (บาท)"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border w-full h-10 border-gray-400 rounded-md p-2"
            />
            <button type="submit" className="w-full h-12 rounded-lg bg-blue-700 text-xl text-white mt-10">
              Submit
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

export default AdvanceSalary;
