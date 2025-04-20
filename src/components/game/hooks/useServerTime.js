import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../../firebase/config';

export const useServerTime = () => {
    const [serverTimeOffset, setServerTimeOffset] = useState(0);

    useEffect(() => {
        const offsetRef = ref(database, '.info/serverTimeOffset');
        const unsubscribe = onValue(offsetRef, (snapshot) => {
            const offset = snapshot.val() || 0;
            setServerTimeOffset(offset);
        });

        return () => unsubscribe();
    }, []);

    const getServerTime = () => Date.now() + serverTimeOffset;

    return { getServerTime };
}; 