import { NextPage } from 'next'
import Head from 'next/head'
import { Navbar } from '../components/navbar'
import { useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey } from '@solana/web3.js'
import { gql } from '@apollo/client'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import client from '../client'
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createTransferInstruction
} from '@solana/spl-token'
//@ts-ignore
import CounterInput from 'react-counter-input'
import { NftCard } from '../components/nftCard'

import React, { Component } from 'react'
import Select from 'react-select'
import { NftRow } from '../components/nftRow'

const Sidebar: NextPage = () => {
  interface Nft {
    mintAddress: string
    name: string
    image: string
  }

  const { publicKey, signTransaction, connected } = useWallet()
  const { connection } = useConnection()
  const [nfts, setNfts] = useState<Nft[]>([])
  const [sending, setSending] = useState<Nft[]>([])

  const GET_NFTS = gql`
    query GetNfts($creators: [PublicKey!], $limit: Int!, $offset: Int!) {
      nfts(creators: $creators, limit: $limit, offset: $offset) {
        mintAddress
        name
        image
      }
    }
  `

  useMemo(() => {
    if (publicKey?.toBase58()) {
      client
        .query({
          query: GET_NFTS,
          variables: {
            creators: [publicKey?.toBase58()],
            offset: 0,
            limit: 10000
          }
        })
        .then(res => setNfts(res.data.nfts))
    } else {
      setNfts([])
    }
  }, [publicKey?.toBase58()])

  return (
    <div className='drawer drawer-end'>
      <input id='my-drawer' type='checkbox' className='drawer-toggle' />
      <div className='drawer-content'>
        <Navbar />
        <label htmlFor='my-drawer' className='btn btn-primary drawer-button'>
          Open drawer
        </label>

        <div className='container'>
          <h1>Connect your wallet, get your mint hash here.</h1>

          <div className='grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {nfts.map(n => (
              <NftRow
                name={n.name}
                image={n.image}
                unselect={() => {
                  setSending(sending.filter(item => item !== n))
                }}
                select={() => {
                  setSending([...sending, n])
                }}
                selected={sending.includes(n)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className='drawer-side'>
        <label htmlFor='my-drawer' className='drawer-overlay'></label>
        <ul className='p-4 overflow-y-auto menu w-80 bg-base-100 text-base-content'>
          {sending.map(n => (
            <li>
              <NftRow
                name={n.name}
                image={n.image}
                unselect={() => {
                  setSending(sending.filter(item => item !== n))
                }}
                select={() => {
                  setSending([...sending, n])
                }}
                selected={sending.includes(n)}
              />
            </li>
          ))}
          <li>
            <button
              className='block text-white btn btn-primary'
              onClick={() => {
                navigator.clipboard.writeText(
                  JSON.stringify(sending.map(n => n.mintAddress))
                )
              }}
            >
              Copy Selected Mints
            </button>
          </li>
          <li>
            <button
              className='block text-white btn btn-primary'
              onClick={() => {
                const element = document.createElement('a')
                const file = new Blob(
                  [JSON.stringify(sending.map(n => n.mintAddress))],
                  {
                    type: 'text/json'
                  }
                )
                element.href = URL.createObjectURL(file)
                element.download = publicKey?.toBase58() + '_minthash.json'
                document.body.appendChild(element)
                element.click()
              }}
            >
              Download JSON File
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Sidebar
