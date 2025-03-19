import axios from 'axios'
import {create} from 'zustand'


const timeStore= create((set)=> ({
    time: {},
    date:{},

    actionCheckIn: async (token) => {
        try {
            const res = await axios.post('http://localhost:9191/user/check-in', null, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
    
            set({ time: res.data.data }); // Update state
            console.log("res.data.data", res.data);
    
            return res.data; // Return the response for use in hdlSubmit
        } catch (error) {
            console.error("Error in actionCheckIn:", error);
            throw error; // Ensure the error is propagated
        }
    },
    
    actionCheckOut: async (id, token) => {
        try {
            const res = await axios.patch(
                "http://localhost:9191/user/check-out",
                { id },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            set({ time: res.data.data });
            console.log("Check-Out Response:", res.data); // Debugging
            return res.data; // Return response for hdlSubmit
        } catch (error) {
            console.error("Check-Out Error:", error);
            throw error; // Ensure error is caught in hdlSubmit
        }
    },
    
    actionDayOff: async(token, date, reason, status)=>{
        const res = await axios.post('http://localhost:9191/user/day-off',{ date, reason, status },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            }, 

            
        )
        console.log("log from day off time store",res)   
        set({date: res.data.data})
        return res.data;  // This will ensure that the frontend gets the expected data
    }
}))

export default timeStore