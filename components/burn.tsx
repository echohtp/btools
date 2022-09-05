import { NextPage } from 'next'
import Head from 'next/head'
import { Navbar } from './navbar'
import { useMemo, useState } from 'react'
//@ts-ignore
import {
  TOKEN_PROGRAM_ID,
  createBurnInstruction,
  createCloseAccountInstruction
} from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey } from '@solana/web3.js'
import { gql } from '@apollo/client'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import client from '../client'
import { Button } from 'antd'

import { NftRow } from './nftRow'
import * as ga from '../lib/ga'
import { Nft } from '../types'

const Burn: NextPage = () => {
  const { publicKey, signTransaction, connected } = useWallet()
  const { connection } = useConnection()
  const [nfts, setNfts] = useState<Nft[]>([])
  const [sending, setSending] = useState<Nft[]>([])
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const burn = async (list: Nft[]) => {
    setLoading(true)
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

    toast(`trying to burn ${list.length} nfts`)
    toast(`breaking that up into ${Math.ceil(list.length / 8)} transactions`)
    for (var i = 0; i < list.length / 8; i++) {
      const tx = new Transaction()
      for (var j = 0; j < 8; j++) {
        if (list[i * 8 + j]) {
          tx.add(
            createBurnInstruction(
              new PublicKey(list[i].owner.associatedTokenAccountAddress),
              new PublicKey(list[i].mintAddress),
              publicKey,
              1,
              [],
              TOKEN_PROGRAM_ID
            )
          )
          tx.add(
            createCloseAccountInstruction(
              new PublicKey(list[i].owner.associatedTokenAccountAddress),
              publicKey,
              publicKey,
              [],
              TOKEN_PROGRAM_ID
            )
          )
        }
      }
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      tx.feePayer = publicKey

      let signed: Transaction | undefined = undefined

      try {
        signed = await signTransaction(tx)
      } catch (e:any) {
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
          action: 'burn_success',
          params: { count: sending.length }
        })
        sending.map(n => {
          setNfts(nfts.filter(n => !sending.includes(n)))
        })
      } catch (e:any) {
        toast.error(e.message)
        setLoading(false)
        ga.event({
          action: 'burn_error',
          params: { msg: e.message }
        })
      }
    }
    setSending([])
    setLoading(false)
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
  }, [publicKey, GET_NFTS])

  return (
    <div>
      <Head>
        <title>Burn!</title>
        <meta name='description' content='Burn multiple NFTs at once!' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <div className='drawer drawer-end'>
        <input id='my-drawer' type='checkbox' className='drawer-toggle' />
        <div className='drawer-content'>
          <div className='w-full mb-4'>
            <input
              type='text'
              placeholder='Search...'
              className='w-11/12 input input-bordered input-secondary'
              onChange={e => setSearch(e.target.value)}
            />{sending.length > 0 ? <button onClick={()=>{
              //@ts-ignore  
              document.getElementById("my-drawer").checked = true
            }} className="mx-3 btn btn-secondary">{sending.length}</button> : <button className="mx-3 btn btn-secondary">{sending.length}</button> }
          </div>
          <div className='container px-4'>
            <div className='grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {nfts
                .filter(n =>
                  n.name.toLowerCase().includes(search.toLowerCase())
                )
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
                  <Button
                    loading={loading}
                    id='btn-copy'
                    type='primary'
                    className='block btn btn-secondary hover:text-white'
                    onClick={() => {
                      burn(sending)
                    }}
                  >
                    Burn them!
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

export default Burn
