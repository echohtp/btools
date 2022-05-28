import { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { Navbar } from '../components/navbar'
import { useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, Transaction, PublicKey } from '@solana/web3.js'
import { gql } from '@apollo/client'
import client from '../client'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {


  return (
    <div>
      <Head>
        <title>bTools</title>
        <meta name='description' content='Solana web3 tools by 0xBanana' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Navbar />

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to 🍌 tools
        </h1>

        <p className={styles.description}>
          Get started by checking out our tools below<br/>
        </p>

        <div className={styles.grid}>
          <a href="multisend" className={styles.card}>
            <h2>Multi Send &rarr;</h2>
            <p>Send multiple NFTs in one transaction</p>
          </a>

          {/* <a href="txbuilder" className={styles.card}>
            <h2>Transaction Builder &rarr;</h2>
            <p>Build custom solana transactions</p>
          </a> */}

          <a
            href="gatedentry"
            className={styles.card}
          >
            <h2>Gated Entry &rarr;</h2>
            <p>Members only area, are you in, anon?</p>
          </a>
          
          <a href="minthash" className={styles.card}>
            <h2>Mint Hash Getter&rarr;</h2>
            <p>Get your mint hash list here, anon!</p>
          </a>

        </div>
      </main>

      <div className='container'>
        <h1></h1>
      </div>

      <footer></footer>
    </div>
  )
}

export default Home
