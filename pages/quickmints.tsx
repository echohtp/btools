import { NextPage } from 'next'
import Head from 'next/head'
import { Navbar } from '../components/navbar'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { EditionPrinter } from '../components/editionPrinter'
import { QuickMint } from '../components/quickMint'
import * as ga from '../lib/ga'

const EditionPrinterPage: NextPage = () => {
  const { publicKey, signTransaction, connected } = useWallet()
  const { connection } = useConnection()

  return (
    <div>
      <Head>
        <title>Edition Printer</title>
        <meta name='description' content='Solana Edition Printer' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Navbar />

      <div className='container px-4'>
        {!connected && <h1>Connect your wallet first 🚫</h1>}
        {connected && (
          <>
            <QuickMint />
            <EditionPrinter />
          </>
        )}
      </div>

      <footer></footer>
    </div>
  )
}

export default EditionPrinterPage
