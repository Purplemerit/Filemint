import { useEffect, useRef, useCallback } from "react";

/**
 * useAutoDownload
 *
 * - If user clicks the returned `triggerDownload` manually → file downloads ONCE, auto-timer is cancelled.
 * - If user does NOT click within `delay` ms after `isReady` becomes true → auto-downloads.
 * - Resets properly when `isReady` goes back to false (new conversion started).
 */
export function useAutoDownload(
    isReady: boolean,
    downloadFn: () => void,
    delay = 10000
): () => void {
    const hasDownloadedRef = useRef(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Store latest downloadFn in a ref so the timer closure always has the current version
    const downloadFnRef = useRef(downloadFn);
    useEffect(() => {
        downloadFnRef.current = downloadFn;
    }, [downloadFn]);

    useEffect(() => {
        if (!isReady) {
            // Reset when a new conversion starts
            hasDownloadedRef.current = false;
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        // Start auto-download timer
        timerRef.current = setTimeout(() => {
            if (!hasDownloadedRef.current) {
                hasDownloadedRef.current = true;
                downloadFnRef.current();
            }
        }, delay);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isReady, delay]);

    // Manual download — cancels the timer and marks as downloaded
    const triggerDownload = useCallback(() => {
        if (hasDownloadedRef.current) return; // already downloaded
        hasDownloadedRef.current = true;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        downloadFnRef.current();
    }, []);

    return triggerDownload;
}
