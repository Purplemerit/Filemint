'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGuard({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');

      if (!token) {
        // No token, redirect to 404
        router.replace('/404');
        return;
      }

      // Check if user is admin
      const response = await fetch('/api/auth/check-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.isAdmin) {
        setIsAuthorized(true);
      } else {
        // Not an admin, redirect to 404
        router.replace('/404');
      }
    } catch (error) {
      console.error('Admin check failed:', error);
      router.replace('/404');
    } finally {
      setIsChecking(false);
    }
  };

  // Show loading while checking
  if (isChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
      }}>
        <div style={{
          textAlign: 'center',
          color: '#6B7280',
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '1rem',
          }}>🔒</div>
          <p>Verifying access...</p>
        </div>
      </div>
    );
  }

  // Only render children if authorized
  return isAuthorized ? children : null;
}