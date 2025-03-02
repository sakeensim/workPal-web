import axios from "axios"
import {create} from "zustand"
import { persist } from "zustand/middleware"

//1.create store
const authStore = (set) => ({
    user: [],
    token: null,
    loginWithZustand: async(value)=>{
        try {
            const res = await axios.post('http://localhost:9191/login', value)
            // console.log(res.data.payload)
            // console.log(res.data.token)

            // console.log("Login response:", res);

            const {payload,token} = res.data
            // console.log(payload.role)
            // console.log(token)

            set({ user: payload, token: token }); // Updating Zustand store

            return {success: true, role : payload.role}
        } catch (error) {
            // console.log(error.response.data.message) 
            return {success: false, message: error.response.data.message}
        }
    }
})

//2. exports Store
const useAuthStore = create(persist(authStore, {name: 'auth-store'}))

export default useAuthStore