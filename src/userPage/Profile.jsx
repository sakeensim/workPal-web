import React, { useEffect, useState } from 'react';
import FormUploadImage from '../form/FormUploadImage';
import { useForm } from 'react-hook-form';
import { EditIcon } from '../icon/icon';
import useAuthStore from '../store/auth-store';
import axios from 'axios';
import { createAlert } from '../utils/createAlert';
import { Trash2 } from 'lucide-react';

function Profile() {
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);

    const [image, setImage] = useState('');
    const [profile, setProfile] = useState({});
    const [dayOffDates, setDayOffDates] = useState([]);
    const [totalSalaryAdvance, setTotalSalaryAdvance] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeletingDayOff, setIsDeletingDayOff] = useState(false);
    
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
            setDayOffDates(approvedDayOffs.map(dayOff => ({
                id: dayOff.id,
                date: dayOff.date
            })));
            
            setTotalSalaryAdvance(res.data.totalSalaryAdvance);
        } catch (error) {
            console.log('Error fetching approved requests:', error);
        }
    };

    const deleteDayOff = async (dayOffId) => {
        try {
            setIsDeletingDayOff(true);
            await axios.delete(`http://localhost:9191/user/cancel-dayoff/${dayOffId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchApprovedRequests();
            createAlert('success', 'Day off canceled successfully');
        } catch (error) {
            console.log('Error canceling day off:', error);
            createAlert('error', 'Failed to cancel day off');
        } finally {
            setIsDeletingDayOff(false);
        }
    };

    const totalDayOffs = 6;
    const remainingDayOffs = totalDayOffs - dayOffDates.length;

    return (
        <form onSubmit={handleSubmit(hdlSubmit)} className="w-full max-w-4xl pb-1 mx-auto p-4">
            {/* Profile Info */}
            <div className="flex flex-col items-center md:flex-row md:items-start md:gap-8">
                <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-300 shadow-lg">
                    {isEditing ? (
                        <FormUploadImage setValue={setValue} setImage={setImage} />
                    ) : (
                        <img 
                            src={image.secure_url || profile.profileImage} 
                            className="w-full h-full object-cover" 
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    )}
                </div>

                <div className="mt-4 md:mt-0">
                    <p className="text-xl font-semibold text-gray-800 mb-2">Name: {user.firstname}</p>
                    <p className="text-xl text-gray-700 mb-2">
                        Phone: {isEditing ? <input {...register("phone")} className="border p-1 rounded" /> : profile.phone}
                    </p>
                    <p className="text-xl text-gray-700 mb-2">Email: {user.email}</p>
                    <p className="text-xl text-gray-700 mb-2">
                        Emergency Contact: {isEditing ? <input {...register("emergencyContact")} className="border p-1 rounded" /> : profile.emergencyContact}
                    </p>
                    <div className="cursor-pointer mt-2" onClick={() => setIsEditing(!isEditing)}>
                        <EditIcon className="w-6 text-gray-700" />
                    </div>
                    {isEditing && (
                        <button type="submit" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            Save Changes
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                <div className="border p-4 rounded-lg bg-red-500 text-white shadow-lg">
                    <p className="text-center text-xl font-semibold mb-4">Upcoming Day Offs</p>
                    {dayOffDates.length > 0 ? (
                        dayOffDates.map((dayOff, index) => (
                            <div key={index} className="flex justify-between items-center mb-2">
                                <p>{new Date(dayOff.date).toLocaleDateString('th-TH')}</p>
                                <button onClick={() => deleteDayOff(dayOff.id)} className="text-xl">
                                    <Trash2 />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-200">No approved day offs</p>
                    )}
                </div>

                <div className="border p-4 rounded-lg bg-green-500 text-white shadow-lg">
                    <p className="text-center text-xl font-semibold mb-4">Remaining Day Offs</p>
                    <p className="text-center text-3xl">{remainingDayOffs} Days</p>
                </div>

                <div className="border p-4 rounded-lg bg-yellow-500 text-white shadow-lg">
                    <p className="text-center text-xl font-semibold mb-4">Advance Salary</p>
                    <p className="text-center text-3xl">{totalSalaryAdvance.toLocaleString()} ฿</p>
                </div>
            </div>
        </form>
    );
}

export default Profile;
