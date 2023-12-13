import Image from 'next/image'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.center}>
        <div className={styles.logoContainer}>
          <Image
            className={styles.logo}
            src="/assets/tn_logo.svg"
            alt="Next.js Logo"
            width={500}
            height={37}
            priority
          />
        </div>
        <br/>
        <a href="/signin" className={styles.mainButton}>
          Create Amazing Blockchain Wallet!
        </a>

      </div>
    </main>
  )
}
