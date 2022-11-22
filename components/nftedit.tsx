import { NextPage } from 'next'
import Head from 'next/head'
import { Navbar } from './navbar'
import { useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey, Connection } from '@solana/web3.js'
import { gql } from '@apollo/client'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import client from '../client'
import { Button } from 'antd'
import axios from 'axios'
import { JsonForms } from '@jsonforms/react'
import { materialRenderers, materialCells } from '@jsonforms/material-renderers'
import { NftRow } from './nftRow'
import * as ga from '../lib/ga'
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js'
import { Nft } from '../types'

const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string'
    },
    symbol: {
      type: 'string'
    },
    description: {
      type: 'string'
    },
    image: {
      type: 'string'
    },
    animation_url: {
      type: 'string'
    },
    external_url: {
      type: 'string'
    },
    seller_fee_basis_points: {
      type: 'number'
    },
    attributes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          trait_type: {
            type: 'string'
          },
          value: {
            type: 'string'
          }
        }
      }
    },
    properties: {
      type: 'object',
      properties: {
        category: {
          type: 'string'
        },
        files: {
          type: 'array',
          items: {
            types: 'object',
            properties: {
              uri: {
                type: 'string'
              },
              type: {
                type: 'string'
              },
              cdn: {
                type: 'boolean'
              }
            }
          }
        },
        creators: {
          type: 'array',
          items: {
            types: 'object',
            properties: {
              address: {
                type: 'string'
              },
              share: {
                type: 'number'
              }
            }
          }
        }
      }
    }
  }
}

export const NftEdit = () => {
  const wallet = useWallet()
  const { publicKey, signTransaction, connected } = useWallet()
  const connection = new Connection(process.env.NEXT_PUBLIC_RPC!)
  const [nfts, setNfts] = useState<Nft[]>([])
  const [sending, setSending] = useState<Nft[]>([])
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [searchMint, setSearchMint] = useState('')
  const [loading, setLoading] = useState<boolean>(false)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [modalData, setModalData] = useState<any>({})
  const [nftData, setNftData] = useState<any>({})
  const [selectedNft, setSelectedNft] = useState<any>()
  const [toggler, setToggler] = useState<boolean>(false)
  const metaplex = Metaplex.make(connection).use(
    walletAdapterIdentity(useWallet())
  )

  const updateNft = async () => {
    //upload new metadata
    toast('upload metadata')
    const { uri: newUri } = await metaplex
      .nfts()
      .uploadMetadata(nftData)
      .run()

    console.log('new uri: ', newUri)

    //set on chain data
    toast('set on chain and update uri')
    const { nft: updatedNft } = await metaplex
      .nfts()
      .update(selectedNft, {
        name: nftData.name,
        symbol: nftData.symbol,
        sellerFeeBasisPoints: nftData.seller_fee_basis_points,
        uri: newUri
      })
      .run()

    console.log('selected mint: ', selectedNft.mintAddress.toBase58())
    // console.log('updated mint: ', updatedMetaplexNft.mintAddress.toBase58())
    console.log('updated nft: ', updatedNft.mintAddress.toBase58())
    ga.event({ action: 'nft_edit', params: { who: wallet.publicKey?.toBase58() } })
    setToggler(!toggler)
    toast('done')
  }

  const GET_NFTS = gql`
    query GetNfts(
      $creators: [PublicKey!]
      $updateAuthorities: [PublicKey!]
      $limit: Int!
      $offset: Int!
    ) {
      nfts(
        creators: $creators
        updateAuthorities: $updateAuthorities
        limit: $limit
        offset: $offset
      ) {
        address
        mintAddress
        name
        updateAuthorityAddress
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
            updateAuthorities: [publicKey?.toBase58()],
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
  }, [publicKey, GET_NFTS, toggler])

  const loadNft = async (mintAddress: string) => {
    const nPK = new PublicKey(mintAddress)

    const nft = await metaplex
      .nfts()
      .findByMint(nPK)
      .run()
    setSelectedNft(nft)
    console.log(nft.uri)
    // send it to modal

    axios.get(nft.uri).then(res => {
      console.log('got data')
      let data = res.data
      console.log(data)
      setModalData(data)
    })

    //@ts-ignore
    document.getElementById('my-modal-3').checked = true
  }

  return (
    <div>
      <h2>Nft Editor</h2>
      <div className='drawer drawer-end'>
        <input id='my-drawer' type='checkbox' className='drawer-toggle' />
        <div className='drawer-content'>
        <div className='w-full'>
              <input className="w-11/12 input input-bordered input-primary" type={'text'} placeholder='load this mint' id="searchMint" onChange={((e)=>{
                setSearchMint(e.target.value)
              })} />
              <button className='w-1/12 btn btn-secondary' onClick={() => {
                loadNft(searchMint)
              }}>
                load nft
              </button>
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
                .filter(n =>
                  n.name.toLowerCase().includes(search.toLowerCase())
                )
                .map(n => (
                  <NftRow
                    key={Math.random()}
                    name={n.name}
                    image={n.image}
                    unselect={() => {
                      // setSending(sending.filter(item => item !== n))
                    }}
                    select={async () => {
                      // get NFT data from metaplex
                      loadNft(n.mintAddress)
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
          <h3 className='text-lg font-bold'>Edit Metaplex JSON</h3>
          <JsonForms
            schema={schema}
            data={modalData}
            renderers={materialRenderers}
            cells={materialCells}
            onChange={({ errors, data }) => setNftData(data)}
          />
          <button className='btn btn-secondary' onClick={updateNft}>
            Update NFT
          </button>
        </div>
      </div>
    </div>
  )
}

export default NftEdit
