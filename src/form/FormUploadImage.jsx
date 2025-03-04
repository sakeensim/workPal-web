import React from 'react'
import { resizeFile } from '../utils/resizeImage'
import { uploadImgProfile } from '../api/uploadFile'
import useAuthStore from '../store/auth-store'

function FormUploadImage({setValue,setImage}) {
    const token = useAuthStore((state)=>state.token)
    console.log(token)
    const hdlOnChange = async (e) => {
        // console.log(e.target.files[0])
        const file = e.target.files[0]
        if(!file)return
        try {
            const resizedImage = await resizeFile(file)
            console.log(resizedImage)

            const res = await uploadImgProfile(token, resizedImage)
            console.log(res)
            setValue('image',res.data.result)
            setImage(res.data.result)
        } catch (error) {
            console.log(error)
        }
    }

  return (
    <div>
         <input type='file' 
         onChange ={hdlOnChange}/>
    </div>
  )
}

export default FormUploadImage