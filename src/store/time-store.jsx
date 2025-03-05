import axios from 'axios'
import {create} from 'zustand'


const timeStore= create((set)=> ({
    time: {},

    actionCheckIn: async(token) =>{
        const res = await axios.post('http://localhost:9191/user/check-in',null,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
           set({time: res.data.data})
           console.log("res.data.data",res.data)
    },
    actionCheckOut: async(id,token) =>{
        const res = await axios.patch('http://localhost:9191/user/check-out',
            { id },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            console.log(res)
           set({time: res.data.data})
    }
}))

export default timeStore