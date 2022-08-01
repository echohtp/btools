import { NextPage } from 'next'
import Head from 'next/head'
import { Navbar } from '../components/navbar'
import { useMemo, useState } from 'react'


import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey } from '@solana/web3.js'
import { gql } from '@apollo/client'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import client from '../client'

import { NftRow } from '../components/nftRow'
import * as ga from '../lib/ga'
import { Nft } from '../types'

const Viewer: NextPage = () => {
  const { publicKey, signTransaction, connected } = useWallet()
  const { connection } = useConnection()
  const [nfts, setNfts] = useState<Nft[]>([])
  const [sending, setSending] = useState<Nft[]>([])
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [viewer, setViewer] = useState('')
  const [loading, setLoading] = useState(false)

  const GET_NFTS = gql`
    query GetNfts($owners: [PublicKey!], $limit: Int!, $offset: Int!) {
      nfts(owners: $owners, limit: $limit, offset: $offset) {
        address
        mintAddress
        name
        description
        animationUrl
        image
        owner {
          address
          associatedTokenAccountAddress
        }
      }
    }
  `

  useMemo(() => {
    try {
      let searchKey = new PublicKey(viewer)
      client
        .query({
          query: GET_NFTS,
          variables: {
            owners: [searchKey],
            offset: 0,
            limit: 10000
          }
        })
        .then(res => setNfts(res.data.nfts))
    } catch (e) {
      if (publicKey) {
        client
          .query({
            query: GET_NFTS,
            variables: {
              owners: [publicKey?.toBase58()],
              offset: 0,
              limit: 10000
            }
          })
          .then(res => setNfts(res.data.nfts))
      } else {
        setNfts([])
      }
    }
  }, [publicKey, GET_NFTS, viewer])

  return (
    <div>
      <Head>
        <title>Viewer!</title>
        <meta name='description' content='View NFTs inside any wallet!' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <div className='drawer drawer-end'>
        <input id='my-drawer' type='checkbox' className='drawer-toggle' />
        <div className='drawer-content'>
          <Navbar sending={[]} />
          <div className='w-full mb-4'>
            <input
              type='text'
              placeholder='View inside a wallet...'
              className='w-full input input-bordered input-secondary'
              onChange={e => setViewer(e.target.value)}
            />
          </div>
          <div className='w-full mb-4'>
            <input
              type='text'
              placeholder='Search...'
              className='w-full input input-bordered input-secondary'
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className='container px-4'>
            <div className='grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {nfts
                .filter((n: Nft) => n.name.toLowerCase().includes(search.toLowerCase()))
                .map((n: Nft) => (
                  <NftRow
                    key={Math.random()}
                    name={n.name}
                    image={n.image}
                    unselect={() => {}}
                    select={() => {}}
                    selected={false}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Viewer
