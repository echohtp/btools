import { NextPage } from 'next'
import Head from 'next/head'
import { Navbar } from '../components/navbar'
import { useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { gql } from '@apollo/client'
import 'react-toastify/dist/ReactToastify.css'
import client from '../client'
import React from 'react'
import { NftRow } from '../components/nftRow'

const HolderSnapshot: NextPage = () => {
  interface Nft {
    mintAddress: string
    name: string
    image: string
    owner: any
  }

  const { publicKey, signTransaction, connected } = useWallet()
  const { connection } = useConnection()
  const [nfts, setNfts] = useState<Nft[]>([])
  const [sending, setSending] = useState<Nft[]>([])
  const [search, setSearch] = useState<string>('')

  const downloadFile = (all: boolean = false) => {
    const element = document.createElement('a')

    let file

    if (all)
      file = new Blob([JSON.stringify(sending.map(n => n.owner.address))], {
        type: 'text/json'
      })
    else
      file = new Blob([JSON.stringify(nfts.map(n => n.owner.address))], {
        type: 'text/json'
      })

    element.href = URL.createObjectURL(file)
    element.download = publicKey?.toBase58() + '_holdersnapshot.json'
    document.body.appendChild(element)
    element.click()
  }

  const GET_NFTS = gql`
    query GetNfts($creators: [PublicKey!], $limit: Int!, $offset: Int!) {
      nfts(creators: $creators, limit: $limit, offset: $offset) {
        mintAddress
        name
        image
        owner {
          address
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
            creators: [publicKey?.toBase58()],
            offset: 0,
            limit: 10000
          }
        })
        .then(res => setNfts(res.data.nfts))
    } else {
      setNfts([])
    }
  }, [publicKey, GET_NFTS])

  return (
    <div>
      <Head>
        <title>Holder Snapshot</title>
        <meta name='description' content='Get holder snapshot!' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <div className='drawer drawer-end'>
        <input id='my-drawer' type='checkbox' className='drawer-toggle' />
        <div className='drawer-content'>
          <Navbar sending={sending} />

          <div className='container px-4'>
            <div className='w-full mb-4'>
              <input
                type='text'
                placeholder='Search...'
                className='w-[90%] input input-bordered input-secondary'
                onChange={e => setSearch(e.target.value)}
              />
              <button
                className='inline-block text-white btn btn-primary'
                onClick={()=>downloadFile(true)}
              >
                Get All
              </button>
            </div>
            <div className='grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {nfts
                .filter(n => n.name.toLowerCase().includes(search.toLowerCase()))
                .map(n => (
                  <NftRow
                    owner={n.owner.address}
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
                  <button
                    id='btn-copy'
                    className='block text-white btn btn-primary'
                    onClick={e => {
                      navigator.clipboard.writeText(
                        JSON.stringify(sending.map(n => n.owner.address))
                      )
                    }}
                  >
                    Copy Selected Holders
                  </button>
                </li>
                <li key={Math.random()}>
                  <button
                    className='block text-white btn btn-primary'
                    onClick={()=>downloadFile()}
                  >
                    Download JSON File
                  </button>
                </li>
              </>
            ) : (
              <>
                <li key={Math.random()}>Select some NFTs!</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default HolderSnapshot
