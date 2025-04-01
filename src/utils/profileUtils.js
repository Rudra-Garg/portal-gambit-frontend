import {BACKEND_URL} from "../config.js";

const fetchProfileDetails = async (uid) => {
    try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            throw new Error('No access token found');
        }

        const response = await fetch(`${BACKEND_URL}/profiles/${uid}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile details');
        }

        const profileData = await response.json();
        return profileData;
    } catch (error) {
        console.error('Error fetching profile details:', error);
        return null;
    }
};

export { fetchProfileDetails };