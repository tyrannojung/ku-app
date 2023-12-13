'use client'
import { useEffect } from 'react'
import { Inter } from 'next/font/google'
 
// If loading a variable font, you don't need to specify the font weight
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

import styles from '@/app/css/page.module.css'

export default function Loader( {content} : {content : string}) {
  
  useEffect(() => {
    async function getLoader() {
      const { quantum } = await import('ldrs')
      quantum.register()
    }
    getLoader()
  }, [])

  return (
    //https://uiball.com/ldrs/
    <main className={styles.main}>
      <div className={styles.center}>
        <div className={styles.logoContainer}>
          <h1 className={inter.className}>
            {content}
          </h1>
          <l-quantum
              size="200"
              speed="1.75" 
              color="#2775FF" 
            ></l-quantum>
        </div>
      </div>
    </main>
  )
}


