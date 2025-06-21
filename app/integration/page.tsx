'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import IntegrationPage from '@/components/integration/IntegrationPage';

export default function Integration() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  return <IntegrationPage />;
}