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
import { Button } from 'antd'

//@ts-ignore
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createTransferInstruction} from '@solana/spl-token'
import { NftRow } from '../components/nftRow'
import * as ga from '../lib/ga'

import {Nft} from '../types'

const MultiSend: NextPage = () => {

  const { publicKey, signTransaction, connected } = useWallet()
  const { connection } = useConnection()
  const [nfts, setNfts] = useState<Nft[]>([])
  const [sending, setSending] = useState<Nft[]>([])
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<boolean>(false)

  if (sending.length > 7 ) {
    toast(
      `Warning! You may not be able to send ${sending.length} NFTs in one transaction. Send fewer NFTs to ensure success`,
      {
        toastId: 'TooManyNFTs',
      })
  }

  const massSend = async (list: Nft[], to: string) => {
    setLoading(true)
    if (to == '') {
      toast.error('Destination wallet address is blank. Please enter a destination wallet')
      setLoading(false)
      return
    } else {
      try {
        console.log('to: ', to)
        new PublicKey(to)
        console.log('valid dest address: ', to)
      } catch (e) {
        console.log('Invalid address')
        setTo('')
        setLoading(false)
        return
      }
    }

    if (!list || !connection || !publicKey || !signTransaction) {
      console.log('returning')
      setLoading(false)
      return
    }

    if (!list.length) {
      console.log('probably want to select some nfts')
      setLoading(false)
      return
    }

    const tx = new Transaction()
    console.log('trying to send ', list.length, ' nfts')
    for (var i = 0; i < list.length; i++) {
      const mintPublicKey = new PublicKey(list[i].mintAddress)
      const fromTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        publicKey
      )
      const fromPublicKey = publicKey
      const destPublicKey = new PublicKey(to)
      const destTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        destPublicKey
      )
      const receiverAccount = await connection.getAccountInfo(destTokenAccount)

      if (receiverAccount === null) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            fromPublicKey,
            destTokenAccount,
            destPublicKey,
            mintPublicKey,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        )
      }

      tx.add(
        createTransferInstruction(
          fromTokenAccount,
          destTokenAccount,
          fromPublicKey,
          1
        )
      )
    }
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
    tx.feePayer = publicKey

    let signed: Transaction | undefined = undefined

    try {
      signed = await signTransaction(tx)
    } catch (e: any) {
      toast(e.message)
      setLoading(false)
      return
    }

    let signature: string | undefined = undefined

    try {
      signature = await connection.sendRawTransaction(signed.serialize())
      await connection.confirmTransaction(signature, 'confirmed')

      toast.success('Transaction successful')
      ga.event({
        action: 'multisend_success',
        params: { count: sending.length }
      })
      sending.map(n => {
        setNfts(nfts.filter(n => !sending.includes(n)))
      })
      setSending([])
      setLoading(false)
    } catch (e: any) {
      toast.error(e.message)
      setLoading(false)
      ga.event({
        action: 'multisend_error',
        params: { msg: e.message }
      })
    }
  }

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

  useMemo(() => {
    if (publicKey?.toBase58()) {
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
      setSending([])
      setTo('')
    }
  }, [publicKey?.toBase58()])

  return (
    <div>
      <Head>
        <title>Multi-Send</title>
        <meta name='description' content='Send multiple NFTs at once!' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <div className='drawer drawer-end'>
        <input id='my-drawer' type='checkbox' className='drawer-toggle' />
        <div className='drawer-content'>
          <Navbar sending={sending} />
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
                .filter(n => n.name.toLowerCase().includes(search.toLowerCase()))
                .map(n => (
                  <NftRow
                    key={Math.random()}
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
              <li key={Math.random()}>
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

            {sending.length > 0 ? (
              <>
                <li key={Math.random()}>
                  <input
                    type='text'
                    className='w-full max-w-xs input input-bordered'
                    placeholder='pubkey address'
                    onChange={e => {
                      setTo(e.target.value)
                    }}
                  />
                </li>
                <li key={Math.random()}>
                  <Button
                    loading={loading}
                    id='btn-copy'
                    type='primary'
                    className='block btn btn-secondary hover:text-white'
                    onClick={() => {
                      // setLoading(true)
                      massSend(sending, to)
                      // setLoading(false)
                    }}
                  >
                    Send them off!
                  </Button>
                </li>
              </>
            ) : (
              <>
                <li>Select some NFTs!</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default MultiSend
