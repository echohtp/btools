import { NextPage } from 'next'
import Head from 'next/head'
import { Navbar } from '../components/navbar'
import { useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { gql } from '@apollo/client'
// import { CreateFanout} from '../components/CreateFanout'

import client from '../client'
import NftEdit from '../components/nftedit'


const Home: NextPage = () => {
  const { publicKey, signTransaction, connected } = useWallet()
  const { connection } = useConnection()

  const GET_NFTS = gql`
    query GetNfts($owners: [PublicKey!], $limit: Int!, $offset: Int!) {
      nfts(owners: $owners, limit: $limit, offset: $offset) {
        address
        mintAddress
        name
        description
        image
        owner {
          address
          associatedTokenAccountAddress
        }
      }
    }
  `

  const GET_ACCESS = gql`
    query GetNfts(
      $owners: [PublicKey!]
      $creators: [PublicKey!]
      $limit: Int!
      $offset: Int!
    ) {
      nfts(
        owners: $owners
        creators: $creators
        limit: $limit
        offset: $offset
      ) {
        name
        address
        description
        image
        mintAddress
      }
    }
  `

  interface Nft {
    name: string
    address: string
    description: string
    image: string
    mintAddress: string
  }

  const [nfts, setNfts] = useState<Nft[]>([])
  const [allowed, setAllowed] = useState(false)

  useMemo(() => {
    if (publicKey?.toBase58()) {
      client
        .query({
          query: GET_ACCESS,
          variables: {
            owners: [publicKey?.toBase58()],
            creators: ['232PpcrPc6Kz7geafvbRzt5HnHP4kX88yvzUCN69WXQC', '465Av5qxktim1iN9p54k41MbRGPe2nqCfyVYwB2EF84J'],
            offset: 0,
            limit: 10000
          }
        })
        .then(res => {
          if (res.data.nfts && res.data.nfts.length > 0) {
            setNfts(res.data.nfts)
            setAllowed(true)
          }
        })
    } else {
      setNfts([])
      setAllowed(false)
    }
  }, [publicKey, GET_ACCESS])

  return (
    <div>
      <Head>
        <title>Gated Entry</title>
        <meta name='description' content='Solana Gated Entry' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Navbar />

      <div className='container px-4'>
        {!connected && <h1>Connect your wallet first 🚫</h1>}
        {connected && (
          <>
            <h1>Connected to: {publicKey?.toBase58()}</h1>
            {allowed ? (
              <>
              <NftEdit/>
              </>
            ) : (
              <h1>🚫 <a href="https://exchange.art/artists/0xBanana/nfts" target={"_blank"} rel="noreferrer">Grab some NFTs for access here</a></h1>
            )}
          </>
        )}
      </div>

      <footer></footer>
    </div>
  )
}

export default Home
