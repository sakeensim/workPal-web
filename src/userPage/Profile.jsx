import React, { useEffect, useState } from 'react'
import FormUploadImage from '../form/FormUploadImage'
import { useForm } from 'react-hook-form'
import useAuthStore from '../store/auth-store'
import axios from 'axios'

function Profile() {
      const token = useAuthStore((state)=>state.token)
      const user = useAuthStore((state)=>state.user)

      const [image,setImage]= useState('')
      const[profile,setProfile] = useState({})


      const {register,handleSubmit,setValue}= useForm({
        values: {
          phone: profile?.phone,
          emergencyContact :profile?.emergencyContact
        }
      })

      useEffect(()=>{
        getProfile()
      },[])

      const hdlSubmit= async (value)=>{
        console.log(value)
        //send to backend
        try {
          const res = await axios.patch('http://localhost:9191/user/update-profile/'+user.id, value,
            {
               headers:{
                   Authorization: `Bearer ${token}`
               }
           })
            console.log(res)
            getProfile()
        } catch (error) {
          console.log(error)
        }
      }

      const getProfile = async() =>{
        try {
          const res = await axios.get('http://localhost:9191/user/myProfile', {
            headers:{
              Authorization: `Bearer ${token}`
          }
          })
          setProfile(res.data.result)
          console.log(res)
        } catch (error) {
          console.log(error)
        }
      }
      console.log("99999999000000",profile)
  return (
    <>
    <form onSubmit={handleSubmit(hdlSubmit)}>

    <div className='flex flex-col ml-60'>Profile
    <div className='flex '>
    <div className='border w-60 h-70 ml-30  bg-gray-300 rounded-2xl border-gray-300'>
      <FormUploadImage setValue={setValue} setImage={setImage}/>
      <img src={image.secure_url || user.profile} className='w-55 h-60'/>
    </div>


    <div className='ml-30'>
      <p className='text-xl text-white mb-3'>Name : {user.firstname}</p>
      <p className='text-xl text-white mb-3'>Phone Number:
         <input {...register("phone")} />
         </p>
      <p className='text-xl text-white mb-3'>Email Address : {user.email}</p>
      <p className='text-xl text-white mb-3'>Emergency Contact :
      <input {...register("emergencyContact")}/>
      </p>

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
    <button className=''>Upload</button>
    </div>
    </form>
    </>
  )
}

export default Profile