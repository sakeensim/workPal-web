import axios from 'axios'; 

export const uploadImgProfile = async(token, form)=>{
    return await axios.patch('http://localhost:9191/user/upload-img',
     {image: form},
     {
        headers:{
            Authorization: `Bearer ${token}`
        }
    })
}