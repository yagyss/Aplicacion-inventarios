'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="auth-container">
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #818CF8, #06B6D4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Stokly
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Cargando...</p>
      </div>
    </div>
  );
}
