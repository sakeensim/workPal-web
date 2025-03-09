import React, { useEffect, useState } from 'react';
import FormUploadImage from '../form/FormUploadImage';
import { useForm } from 'react-hook-form';
import useAuthStore from '../store/auth-store';
import axios from 'axios';

function Profile() {
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);

    const [image, setImage] = useState('');
    const [profile, setProfile] = useState({});
    const [dayOffDates, setDayOffDates] = useState([]); // Store approved day-off dates
    const [totalSalaryAdvance, setTotalSalaryAdvance] = useState(0);

    const { register, handleSubmit, setValue } = useForm({
        values: {
            phone: profile?.phone,
            emergencyContact: profile?.emergencyContact
        }
    });

    useEffect(() => {
        getProfile();
        fetchApprovedRequests();
    }, []);

    const hdlSubmit = async (value) => {
        try {
            const res = await axios.patch(`http://localhost:9191/user/update-profile/${user.id}`, value, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log(res);
            getProfile();
        } catch (error) {
            console.log(error);
        }
    };

    const getProfile = async () => {
        try {
            const res = await axios.get('http://localhost:9191/user/myProfile', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setProfile(res.data.result);
        } catch (error) {
            console.log(error);
        }
    };

    // Fetch approved requests and extract day-off dates
    const fetchApprovedRequests = async () => {
        try {
            const res = await axios.get('http://localhost:9191/user/approved-requests', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            // Filter only "dayoff" type requests and extract the dates
            const approvedDayOffs = res.data.data.filter(request => request.type === 'dayoff');
            setDayOffDates(approvedDayOffs.map(request => request.date)); // Store the dates
            // Set total approved salary advance
            setTotalSalaryAdvance(res.data.totalSalaryAdvance);

        } catch (error) {
            console.log('Error fetching approved requests:', error);
        }
    };

    const totalDayOffs = 6;  // Total day-offs available in a month

    // Calculate the remaining day-offs
    const remainingDayOffs = totalDayOffs - dayOffDates.length;

    return (
        <>
            <form onSubmit={handleSubmit(hdlSubmit)}>
                <div className='flex flex-col ml-60'>Profile
                    <div className='flex '>
                        <div className='border w-60 h-70 ml-30 bg-gray-300 rounded-2xl border-gray-300'>
                            <FormUploadImage setValue={setValue} setImage={setImage} />
                            <img src={image.secure_url || profile.profileImage} className='w-55 h-60' />
                        </div>

                        <div className='ml-30'>
                            <p className='text-xl text-white mb-3'>Name : {user.firstname}</p>
                            <p className='text-xl text-white mb-3'>Phone Number:
                                <input {...register("phone")} />
                            </p>
                            <p className='text-xl text-white mb-3'>Email Address : {user.email}</p>
                            <p className='text-xl text-white mb-3'>Emergency Contact:
                                <input {...register("emergencyContact")} />
                            </p>
                        </div>
                    </div>

                    <div className='flex justify-center'>
                        {/* Upcoming Approved Day-Offs */}
                        <div className='border w-60 h-60 mx-2 mt-10 bg-gray-300 rounded-2xl border-gray-300'>
                            <p className='flex justify-center mt-5 mb-5 text-xl'>วันหยุดที่มาถึง</p>
                            {dayOffDates.length > 0 ? (
                                dayOffDates.map((date, index) => (
                                    <p key={index} className='flex justify-center mb-2'>{new Date(date).toLocaleDateString('th-TH')}</p>
                                ))
                            ) : (
                                <p className='flex justify-center text-gray-500'>ไม่มีวันหยุดที่อนุมัติ</p>
                            )}
                        </div>

                        <div className='border w-60 h-60 mx-2 mt-10 bg-gray-300 rounded-2xl border-gray-300'>
                          <p className='flex justify-center mt-5 mb-5 text-xl'>วันหยุดคงเหลือ</p>
                          <p className='flex justify-center mt-10 mb-2'>{remainingDayOffs} วัน</p>
                        </div>

                        <div className='border w-60 h-60 mx-2 mt-10 bg-gray-300 rounded-2xl border-gray-300'>
                          <p className='flex justify-center mt-5 mb-5 text-xl'>เบิกล่วงหน้า</p>
                          <p className='flex justify-center mt-10 mb-2'>{totalSalaryAdvance.toLocaleString()} บาท</p>
                        </div>
                    </div>

                    <button className=''>Upload</button>
                </div>
            </form>
        </>
    );
}

export default Profile;
