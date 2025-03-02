import React from 'react'

function Profile() {
  return (
    <>
    <div className='flex flex-col ml-60'>Profile
    <div className='flex '>
    <div className='border w-60 h-70 ml-30  bg-gray-300 rounded-2xl border-gray-300'>Image</div>

    <div className='ml-30'>
      <p className='text-xl text-white mb-3'>Name :</p>
      <p className='text-xl text-white mb-3'>Phone Number :</p>
      <p className='text-xl text-white mb-3'>Email Address :</p>
      <p className='text-xl text-white mb-3'>Emergency Contact :</p>
      <p className='text-xl text-white mb-3'>ตำแหน่ง :</p>


    </div>
    </div>

    <div className='flex justify-center'>
    <div className=' border w-60 h-60 mx-2 mt-10 bg-gray-300 rounded-2xl border-gray-300'>
      <p className='flex justify-center mt-5 mb-5 text-xl'>วันหยุดที่มาถึง</p>
      <p className='flex justify-center mb-2'>14/2/2025</p>
      <p className='flex justify-center mb-2'>24/2/2025</p>

    </div>
    <div className=' border w-60 h-60 mx-2 mt-10 bg-gray-300 rounded-2xl border-gray-300'>
      <p className='flex justify-center mt-5 mb-5 text-xl'>วันหยุดคงเหลือ</p>
      <p className='flex justify-center mt-10 mb-2'>4 วัน</p>
      </div>
    <div className=' border w-60 h-60 mx-2 mt-10 bg-gray-300 rounded-2xl border-gray-300'>
      <p className='flex justify-center mt-5 mb-5 text-xl'>เบิกล่วงหน้า</p>
      <p className='flex justify-center mt-10 mb-2'>4000 บาท</p>
    </div>
    </div>
    </div>
    </>
  )
}

export default Profile