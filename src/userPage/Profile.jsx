import React, { useEffect, useState } from 'react';
import FormUploadImage from '../form/FormUploadImage';
import { useForm } from 'react-hook-form';
import { EditIcon } from '../icon/icon';
import useAuthStore from '../store/auth-store';
import axios from 'axios';
import { createAlert } from '../utils/createAlert'

function Profile() {
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);

    const [image, setImage] = useState('');
    const [profile, setProfile] = useState({});
    const [dayOffDates, setDayOffDates] = useState([]);
    const [totalSalaryAdvance, setTotalSalaryAdvance] = useState(0);
    const [isEditing, setIsEditing] = useState(false);

    const { register, handleSubmit, setValue } = useForm();

    useEffect(() => {
        getProfile();
        fetchApprovedRequests();
    }, []);

    useEffect(() => {
        if (profile) {
            setValue("phone", profile.phone);
            setValue("emergencyContact", profile.emergencyContact);
        }
    }, [profile, setValue]);

    const hdlSubmit = async (value) => {
        try {
            await axios.patch(`http://localhost:9191/user/update-profile/${user.id}`, value, {
                headers: { Authorization: `Bearer ${token}` }
            });
            getProfile();
            setIsEditing(false);
            createAlert('success', 'Profile updated successfully');
        } catch (error) {
            console.log(error);
        }
    };

    const getProfile = async () => {
        try {
            const res = await axios.get('http://localhost:9191/user/myProfile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(res.data.result);
        } catch (error) {
            console.log(error);
        }
    };

    const fetchApprovedRequests = async () => {
        try {
            const res = await axios.get('http://localhost:9191/user/approved-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const approvedDayOffs = res.data.data.filter(request => request.type === 'dayoff');
            setDayOffDates(approvedDayOffs.map(request => request.date));
            setTotalSalaryAdvance(res.data.totalSalaryAdvance);
        } catch (error) {
            console.log('Error fetching approved requests:', error);
        }
    };

    const totalDayOffs = 6;
    const remainingDayOffs = totalDayOffs - dayOffDates.length;

    return (
        <>
            <form onSubmit={handleSubmit(hdlSubmit)}>
                <div className='flex flex-col ml-60'>
                    <div className='flex'>
                        <div className='w-55 h-55 ml-50 rounded-full mt-15 overflow-hidden bg-gray-300'>
                            {isEditing ? (
                                <FormUploadImage setValue={setValue} setImage={setImage} />
                            ) : (
                                <img 
                                    src={image.secure_url || profile.profileImage} 
                                    className='w-full h-full object-cover' 
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            )}
                        </div>
                        <div className='ml-20 mt-20'>
                            <p className='text-xl text-white mb-3'>Name: {user.firstname}</p>
                            <p className='text-xl text-white mb-3'>
                                Phone Number: {isEditing ? <input {...register("phone")} /> : <span> {profile.phone}</span>}
                            </p>
                            <p className='text-xl text-white mb-3'>Email Address: {user.email}</p>
                            <p className='text-xl text-white mb-3'>
                                Emergency Contact: {isEditing ? <input {...register("emergencyContact")} /> : <span> {profile.emergencyContact}</span>}
                            </p>
                            <div className='cursor-pointer' onClick={() => setIsEditing(!isEditing)}>
                                <EditIcon className='w-6 ml-60' />
                            </div>
                            {isEditing && (
                                <button 
                                    type='submit' 
                                    className='mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'>
                                    Save Changes
                                </button>
                            )}
                        </div>
                    </div>

                    <div className='flex justify-center'>
                        <div className='border w-60 h-60 mx-2 mt-10 bg-red-500 text-white rounded-2xl'>
                            <p className='flex justify-center mt-5 mb-5 text-xl'>วันหยุดที่มาถึง</p>
                            {dayOffDates.length > 0 ? (
                                dayOffDates.map((date, index) => (
                                    <p key={index} className='flex justify-center mb-2'>{new Date(date).toLocaleDateString('th-TH')}</p>
                                ))
                            ) : (
                                <p className='flex justify-center text-gray-200'>ไม่มีวันหยุดที่อนุมัติ</p>
                            )}
                        </div>

                        <div className='border w-60 h-60 mx-2 mt-10 bg-green-500 text-white rounded-2xl'>
                            <p className='flex justify-center mt-5 mb-5 text-xl'>วันหยุดคงเหลือ</p>
                            <p className='flex justify-center mt-10 mb-2'>{remainingDayOffs} วัน</p>
                        </div>

                        <div className='border w-60 h-60 mx-2 mt-10 bg-yellow-500 text-white rounded-2xl'>
                            <p className='flex justify-center mt-5 mb-5 text-xl'>เบิกล่วงหน้า</p>
                            <p className='flex justify-center mt-10 mb-2'>{totalSalaryAdvance.toLocaleString()} บาท</p>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}

export default Profile;

