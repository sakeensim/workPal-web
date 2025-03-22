import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import useAuthStore from '../store/auth-store';
import { createAlert } from '../utils/createAlert';

function Login() {
    const loginWithZustand = useAuthStore((state) => state.loginWithZustand);
    const navigate = useNavigate();

    const [value, setValue] = useState({
        email: '',
        password: '',
    });

    const hdlOnchange = (e) => {
        setValue({ ...value, [e.target.name]: e.target.value });
    };

    const hdlSubmit = async (e) => {
        e.preventDefault();
        const res = await loginWithZustand(value);
        if (res.success) {
            roleDirect(res.role);
            createAlert('success', 'Login Success');
        } else {
            createAlert('error', res.message);
        }
    };

    const roleDirect = (role) => {
        if (role === 'USER') {
            navigate('/user');
        } else if (role === 'ADMIN') {
            navigate('/admin');
        }
    };

   
    return (
        <div className="flex flex-col lg:flex-row justify-center items-center bg-gradient-to-t from-blue-800 to-blue-500 min-h-screen p-4">
            
            {/* Hidden on mobile, visible on larger screens */}
            <div className="hidden lg:flex text-4xl text-white leading-relaxed max-w-md ml-10">
                "Work is not everything in life, but it is where we prove our skills and professionalism to the world."
            </div>

            {/* Login Form Box */}
            <div className="flex flex-col items-center border-white bg-gray-100 rounded-2xl 
                            w-80 h-auto sm:w-96 sm:h-auto lg:w-100 lg:h-auto p-6 shadow-lg">
                <h1 className="text-3xl text-blue-900 mt-3">Login</h1>

                {/* Sign-in & Sign-up buttons */}
                <div className="flex mt-6 w-full justify-between">
                    <div className="w-40 h-12 rounded-2xl bg-blue-700 flex items-center justify-center cursor-pointer">
                        <p className="text-xl text-white">Log-in</p>
                    </div>
                    <div className="w-40 h-12 rounded-2xl bg-white flex items-center justify-center cursor-pointer">
                        <Link to="/register" className="text-xl text-blue-950">
                            Sign-up
                        </Link>
                    </div>
                </div>

                {/* Login Form */}
                <form onSubmit={hdlSubmit} className="w-full mt-6">
                    <div className="flex flex-col gap-4">
                        <input
                            placeholder="Email Address"
                            type="email"
                            name="email"
                            className="border w-full h-10 border-gray-400 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={hdlOnchange}
                        />
                        <input
                            placeholder="Password"
                            type="password"
                            name="password"
                            className="border w-full h-10 border-gray-400 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={hdlOnchange}
                        />
                        <button type="submit" className="w-full h-12 rounded-lg bg-blue-700 text-xl text-white mt-3 hover:bg-blue-600 transition duration-200">
                            Log-in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
