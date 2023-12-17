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
    const text = 'Hello Vitalic'
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
  }, [session]);

  return (
    <main className={styles.main}>
    {
      status === "loading"
      ? <div className={styles.loadingContainer}>
          <h1 className={styles.loadingText}>Loading...</h1>
        </div>
      : session && session.user
      ?
      <div>
        <div className={styles.logoContainer}>
          <div className={styles.typingContainer}>
          <span ref={linkRef} className={styles.typingText}></span>
          {showBar && <span className={styles.blinkingBar}></span>}
        </div>
        </div>
        {showDomain && (
          <div className={styles.center}>
                  <div className={styles.domainSection}>
                    <p className={styles.domainLabel}>Transaction Link:</p>
                    <Link href={"https://goerli.lineascan.build/tx/" + session.user.txhash} className={styles.domainLink}>
                      {"https://goerli.lineascan.build/tx/" + session.user.txhash}
                    </Link>
                    
                  </div>
                  <button className={styles.logoutButton} onClick={() => signOut({ callbackUrl: '/' })}>Logout</button>
          </div>
        )}
      </div>
      :         
    <div className={styles.notLoggedIn}>
      <h1>You are not logged in</h1>
      <Link href="/" className={styles.mainPageLink}>
         Go to Main Page
      </Link>
    </div>
    }
  </main>
  );
}