'use client'
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import styles from '@/app/css/page.module.css';
import { useSession, signOut } from 'next-auth/react';

export default function Home() {
  const { status, data: session } = useSession();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [showBar, setShowBar] = useState(false);
  const [showDomain, setShowDomain] = useState(false);

  useEffect(() => {
    if (session == null) {
      return
    }
    
    const text = 'Hello Vitalic' + session.user;
    let index = 0;

    function animateText() {
      if (linkRef.current) {
        linkRef.current.textContent = text.substring(0, index);
        index++;
        if (index <= text.length) {
          setTimeout(animateText, 100);
        } else {
          setShowBar(true);
          setTimeout(() => {
            setShowDomain(true);
          }, 500);
        }
      }
    }

    animateText();
  }, []);

  return (
    <main className={styles.main}>
    <div className={styles.center}>
      <div className={styles.logoContainer}>
        <Link href="/" className={styles.domainLink}>
          <span ref={linkRef} style={{ fontSize: '28px' }} ></span>
          {showBar && <span className={styles.blinkingBar}>|</span>}
        </Link>
      </div>
      {showDomain && (
        <div className={styles.domainText}>
          <p>Link : </p> <Link href="/" className={styles.underlinedLink}>yourdomain.com</Link>
        </div>
      )}
    </div>
  </main>
  );
}