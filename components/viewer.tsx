import { NextPage } from 'next'
import Head from 'next/head'
import { Navbar } from './navbar'
import { useMemo, useState } from 'react'


import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey } from '@solana/web3.js'
import { gql } from '@apollo/client'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import client from '../client'

import { NftRow } from './nftRow'
import * as ga from '../lib/ga'
import { Nft } from '../types'
import {NftDetails} from '../components/nftDetails'

export const Viewer = () => {
  const { publicKey, signTransaction, connected } = useWallet()
  const { connection } = useConnection()
  const [nfts, setNfts] = useState<Nft[]>([])
  const [nft, setNft] = useState<Nft | undefined>()
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
        files {
          uri
          fileType
        }
        owner {
          address
          associatedTokenAccountAddress
        }
        creators {
          address
          twitterHandle
        }
        attributes{
          traitType
          value
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
        ga.event({
          action: 'viewer_load',
          params: { who: viewer }
        })
    } catch (e:any) {
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
          ga.event({
            action: 'viewer_load',
            params: { who:  publicKey?.toBase58() }
          })
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
                    select={() => {
                      setNft(n)
                      //@ts-ignore
                      document.getElementById('my-modal-3').checked = true
                    }}
                    selected={false}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
      <input type='checkbox' id='my-modal-3' className='modal-toggle' />
      <div className='modal'>
        <div className='relative w-11/12 max-w-5xl modal-box'>
          <label
            htmlFor='my-modal-3'
            className='absolute btn btn-sm btn-circle right-2 top-2'
          >
            ✕
          </label>
          <NftDetails nft={nft!}/>
        </div>
      </div>
    </div>
  )
}

export default Viewer
