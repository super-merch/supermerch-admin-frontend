import axios from "axios";

export const listAllEquipmentTypes = async () => {
    return await axios.get(
        `/api/auth/list/equipment-type-master`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
};

export const getEquipmentTypeById = async (id) => {
    return await axios.get(
        `/api/auth/get/equipment-type-master/${id}`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
}; 