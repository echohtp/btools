import { NextPage } from 'next'
import Head from 'next/head'
import { Navbar } from '../components/navbar'
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

        {/* <p className={styles.description}>
          Get started by checking out our tools below<br/>
        </p> */}

        <div className={styles.grid}>
          <a href="multisend" className={styles.card}>
            <h2>Multi Send &rarr;</h2>
            <p>Send multiple NFTs in one transaction</p>
          </a>

          <a
            href="nfteditor"
            className={styles.card}
          >
            <h2>NFT Editor &rarr;</h2>
            <p>Edit your NFT&apos;s metadata on and off chain!</p>
          </a>

          <a
            href="quickmints"
            className={styles.card}
          >
            <h2>Quick Mints &rarr;</h2>
            <p>Quick tools</p>
          </a>
          
          <a href="minthash" className={styles.card}>
            <h2>Mint Hash Getter&rarr;</h2>
            <p>Get your mint hash list here, anon!</p>
          </a>

          <a href="holdersnapshot" className={styles.card}>
            <h2>Holder Snapshot&rarr;</h2>
            <p>Get your holder list here, anon!</p>
          </a>
          
          <a href="burn" className={styles.card}>
            <h2>Burn &rarr;</h2>
            <p>Burn NFTs and reclaim rent</p>
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
