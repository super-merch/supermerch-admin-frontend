import React, { useContext, useState } from 'react'
import { AdminContext } from '../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";

const LoginAdmin = () => {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const { setAToken,backednUrl  } = useContext(AdminContext);
    const navigate = useNavigate();

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        try {

            const { data } = await axios.post(`${backednUrl}/api/add-discount/admin-login`,{
                email,
                password
            });
            
            if (data.success) {
                localStorage.setItem('aToken', data.token)
                setAToken(data.token);
                // toast.success(data.message)
                navigate("/products");
            } else {
               console.log(data.message,'error msg');
               
            }

        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || error.message)
        }
        
    }

    return (
        <form onSubmit={onSubmitHandler} className='min-h-screen flex items-center'>
            <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
                <p className='text-2xl font-semibold m-auto'><span className='text-blue-500'> Admin </span> Login</p>
                <div className='w-full'>
                    <p>Email</p>
                    <input onChange={(e) => setEmail(e.target.value)} value={email} className='border border-[#DADADA] rounded w-full  p-2 mt-1 outline-none' type="email" placeholder='Enter Email' required />
                </div>
                <div className='w-full'>
                    <p>Password</p>
                    <input onChange={(e) => setPassword(e.target.value)} value={password} className='border border-[#DADADA] rounded w-full p-2 mt-1 outline-none' type="password" placeholder='Enter Password' required />
                </div>
                <button className='bg-blue-500 text-white w-full py-2 rounded-md text-base'>Login</button>
            </div>
        </form>
    )
}

export default LoginAdmin
