import { useState } from 'react'
import { NextPage } from 'next'
import Head from 'next/head'
import { Navbar } from '../components/navbar'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, Transaction, PublicKey } from '@solana/web3.js'
import { Connection, clusterApiUrl } from '@solana/web3.js'
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js'
import { Button } from 'antd'
import axios from 'axios'

const QuickMint: NextPage = () => {
  const connection = new Connection(clusterApiUrl('mainnet-beta'))
  const wallet = useWallet()
  const { publicKey, signTransaction, connected } = useWallet()
  const [metadataUrl, setMetadataUrl] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const mintIt = async () => {
    if (metadataUrl.length === 0) {
      alert("Please enter a metadata URL")
      return
    }
    setLoading(true)
    try {
      const metaplex = Metaplex.make(connection).use(
        walletAdapterIdentity(wallet)
      )
      console.log(wallet.publicKey?.toBase58())
      console.log('gonna try and mint this!')
      console.log(metadataUrl)
      axios.get(metadataUrl).then(async (data)=>{
        const nft  = await metaplex.nfts().create({
          name: data.data.name,
          uri: metadataUrl,
          sellerFeeBasisPoints: 0
        }).run()
        console.log('minted!')
        console.log(nft)
      
      setLoading(false)
      })
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div>
      <div className='container'>
        <h1>Connected to: {publicKey?.toBase58()}</h1>
        {connected && (
          <>
            <input
              placeholder='url'
              onChange={e => setMetadataUrl(e.target.value)}
            ></input>
            <br />
            <Button loading={loading} onClick={mintIt}>
              mint
            </Button>
          </>
        )}
      </div>

      <footer></footer>
    </div>
  )
}

export default QuickMint
