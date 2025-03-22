import axios from 'axios';
import React, { useState } from 'react';
import { createAlert } from '../utils/createAlert';
import { Link, useNavigate } from 'react-router-dom'; // Ensure you're using 'react-router-dom' here

function Register() {
    const navigate = useNavigate();

    const [value, setValue] = useState({
        firstname: '',
        lastname: '',
        phonenumber: '',
        email: '',
        password: '',
        confirmpassword: ''
    });

    const hdlOnchange = (e) => {
        setValue({ ...value, [e.target.name]: e.target.value });
    };

    const hdlSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:9191/register', value);
            createAlert('success', 'Register Success');
            setValue({
                firstname: '',
                lastname: '',
                phonenumber: '',
                email: '',
                password: '',
                confirmpassword: ''
            });
            navigate('/'); 
        } catch (error) {
            createAlert('error', error.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="flex flex-col lg:flex-row justify-center items-center bg-gradient-to-t from-blue-800 to-blue-500 min-h-screen p-4">
            <div className="hidden lg:flex text-4xl text-white leading-relaxed max-w-md ml-10">
                "Work is not everything in life, but it is where we prove our skills and professionalism to the world."
            </div>

            <div className="flex flex-col items-center border-white bg-gray-100 rounded-2xl w-80 h-auto sm:w-96 lg:w-100 p-6 shadow-lg">
                <h1 className="text-3xl text-blue-900 mt-3">Sign-up</h1>

                <div className="flex mt-6 w-full justify-between">
                    <div className="w-40 h-12 rounded-2xl bg-white flex items-center justify-center cursor-pointer">
                        <Link to="/" className="text-xl text-blue-950">
                            Log-in
                        </Link>
                    </div>
                    <div className="w-40 h-12 rounded-2xl bg-blue-700 flex items-center justify-center cursor-pointer">
                        <p className="text-xl text-white">Sign-up</p>
                    </div>
                </div>

                <form onSubmit={hdlSubmit} className="w-full mt-6">
                    <div className="flex flex-col gap-4">
                        <input
                            placeholder="Firstname"
                            type="text"
                            name="firstname"
                            className="border w-full h-10 border-gray-400 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={hdlOnchange}
                        />
                        <input
                            placeholder="Lastname"
                            type="text"
                            name="lastname"
                            className="border w-full h-10 border-gray-400 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={hdlOnchange}
                        />
                        <input
                            placeholder="Phone number"
                            type="text"
                            name="phonenumber"
                            className="border w-full h-10 border-gray-400 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={hdlOnchange}
                        />
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
                        <input
                            placeholder="Confirm Password"
                            type="password"
                            name="confirmpassword"
                            className="border w-full h-10 border-gray-400 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={hdlOnchange}
                        />
                        <button type="submit" className="w-full h-12 rounded-lg bg-blue-700 text-xl text-white mt-3 hover:bg-blue-600 transition duration-200">
                            Sign-up
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Register;
