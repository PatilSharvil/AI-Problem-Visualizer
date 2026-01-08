import { useState, useCallback, useEffect, useRef } from 'react';

const useBackendReady = () => {
    const [isChecking, setIsChecking] = useState(false);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
    const isMounted = useRef(true);
    const pollingInterval = useRef(null);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, []);

    const checkHealth = async (timeoutMs = 2000) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            // Ensure we handle both trailing slash and no trailing slash in env var
            const baseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
            const res = await fetch(`${baseUrl}/health`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!res.ok) return false;
            const data = await res.json();
            return data.status === 'OK';
        } catch (e) {
            return false;
        }
    };

    const waitForBackend = useCallback(async (onReady) => {
        // First try a quick check (1.5s) to avoid showing loader if backend is already warm
        const isAlive = await checkHealth(1500);

        if (!isMounted.current) return;

        if (isAlive) {
            onReady();
            return;
        }

        // Backend not ready or cold, show loader and start polling
        setIsChecking(true);

        // Clear any existing interval just in case
        if (pollingInterval.current) clearInterval(pollingInterval.current);

        pollingInterval.current = setInterval(async () => {
            const alive = await checkHealth(4000); // 4s timeout for polling
            if (!isMounted.current) return;

            if (alive) {
                if (pollingInterval.current) clearInterval(pollingInterval.current);
                pollingInterval.current = null;
                setIsChecking(false);
                onReady();
            }
        }, 5000); // Poll every 5 seconds to ensure no overlap with 4s timeout

    }, [backendUrl]);

    return { waitForBackend, isChecking };
};

export default useBackendReady;
