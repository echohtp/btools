import { NextPage } from 'next'
import Head from 'next/head'
import { Navbar } from '../components/navbar'
import { useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey } from '@solana/web3.js'
import { toast } from 'react-toastify'
import * as ga from '../lib/ga'
import { gql } from '@apollo/client'
import 'react-toastify/dist/ReactToastify.css'
import client from '../client'
import Upload from '../components/Upload'
import { Metaplex } from '@metaplex-foundation/js'
import { Connection, clusterApiUrl } from '@solana/web3.js'
import { NftRow } from '../components/nftRow'
import { materialRenderers, materialCells } from '@jsonforms/material-renderers'
import { JsonForms } from '@jsonforms/react'
import { useForm } from 'react-hook-form'
import { JsonMetadata, Nft } from '../types'

const NftEdit: NextPage = () => {
  const connection = new Connection(clusterApiUrl('mainnet-beta'))
  const metaplex = new Metaplex(connection)
  const { publicKey, signTransaction, connected } = useWallet()

  const [nfts, setNfts] = useState<Nft[]>([])
  const [sending, setSending] = useState<Nft[]>([])
  const [search, setSearch] = useState('')
  const [fileList, setFileList] = useState<any[]>([])
  const [tabSelected, setTabSelected] = useState(1)
  const [nftMetadata, setNftMetadata] = useState<JsonMetadata | null>(null)
  const [nftChainData, setNftChainData] = useState<any>({})
  const [nftNewChainData, setNewChainData] = useState<any>({})

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()
  const updateMetaplex = handleSubmit(data => {
    console.log('updateMetaplex', data)
  })
  const updateChain = handleSubmit(data => {
    console.log('updateChain', data)
  })

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
            creators: [publicKey?.toBase58()],
            updateAuthorities: [publicKey?.toBase58()],
            offset: 0,
            limit: 10000
          }
        })
        .then(res => setNfts(res.data.nfts))
    } else {
      setNfts([])
      setNftMetadata(null)
    }
  }, [publicKey, GET_NFTS])

  const schema = {
    type: 'object',
    properties: {
      name: {
        type: 'string'
      },
      description: {
        type: 'string'
      },
      external_url: {
        type: 'string'
      },
      symbol: {
        type: 'string'
      },
      category: {
        type: 'string',
        enum: ['audio', 'image', 'html', 'video', 'vr']
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
      }
    }
  }

  const chainSchema = {
    type: 'object',
    properties: {
      name: {
        type: 'string'
      },
      symbol: {
        type: 'string'
      },
      updateAuthority: {
        type: 'string'
      }
    }
  }

  const uischema = {
    type: 'VerticalLayout',
    elements: [
      ,
      {
        type: 'Control',
        scope: '#/properties/name'
      },
      {
        type: 'Control',
        scope: '#/properties/description'
      },
      {
        type: 'HorizontalLayout',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/external_url'
          },
          {
            type: 'Control',
            scope: '#/properties/symbol'
          }
        ]
      },
      {
        type: 'Control',
        scope: '#/properties/category'
      },
      {
        type: 'Control',
        scope: '#/properties/attributes',
        options: {
          showSortButtons: true
        }
      }
    ]
  }

  const chainUiSchema = {
    type: 'VerticalLayout',
    elements: [
      ,
      {
        type: 'Control',
        scope: '#/properties/name'
      },
      {
        type: 'Control',
        scope: '#/properties/symbol'
      },
      {
        type: 'Control',
        scope: '#/properties/updateAuthority'
      }
    ]
  }

  const [data, setData] = useState<any>({})
  let mdata = nftMetadata
  let cdata = nftChainData

  return (
    <>
      <div>
        <Head>
          <title>Nft Edit</title>
          <meta name='description' content='Edit NFTs!' />
          <link rel='icon' href='/favicon.ico' />
        </Head>
        <div className='drawer drawer-end'>
          <input id='my-drawerr' type='checkbox' className='drawer-toggle' />
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
                  .filter(n =>
                    n.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map(n => (
                    <NftRow
                      key={Math.random()}
                      name={n.name}
                      image={n.image}
                      unselect={() => {
                        setNftMetadata(null)
                      }}
                      select={async () => {
                        //   setSending([...sending, n])
                        const m_nft = await metaplex
                          .nfts()
                          .findByMint(new PublicKey(n.mintAddress))

                        console.log(m_nft)
                        setNftChainData({
                          updateAuthority: m_nft.updateAuthority,
                          mint: m_nft.mint,
                          name: m_nft.name,
                          symbol: m_nft.symbol,
                          uri: m_nft.uri,
                          sellerFeeBasisPoints: m_nft.sellerFeeBasisPoints,
                          creators: m_nft.creators,
                          primarySaleHappened: m_nft.primarySaleHappened,
                          isMutable: m_nft.isMutable,
                          editionNonce: m_nft.editionNonce,
                          tokenStandard: m_nft.tokenStandard,
                          collection: m_nft.collection,
                          uses: m_nft.uses
                        })
                        setNftMetadata(m_nft.metadata)
                        if (
                          m_nft.metadata.properties &&
                          m_nft.metadata.properties.files
                        )
                          setFileList(
                            m_nft.metadata.properties?.files?.map(f => ({
                              uid: String(f.type),
                              id: f.uri,
                              name: String(f.uri)
                            }))
                          )
                        //@ts-ignore
                        document.getElementById('my-modal-6').checked = true
                      }}
                      selected={false}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <input type='checkbox' id='my-modal-6' className='modal-toggle' />
      <div className='modal modal-bottom sm:modal-middle'>
        <div className='modal-box'>
          <div className='grid place-items-center'>
            <h3 className='text-lg font-bold'>{nftMetadata?.name}</h3>
            <div className='tabs'>
              {tabSelected === 1 ? (
                <a
                  className='tab tab-bordered tab-active'
                  onClick={() => setTabSelected(1)}
                >
                  Metaplex JSON
                </a>
              ) : (
                <a
                  className='tab tab-bordered'
                  onClick={() => setTabSelected(1)}
                >
                  Metaplex JSON
                </a>
              )}
              {tabSelected === 2 ? (
                <a
                  className='tab tab-bordered tab-active'
                  onClick={() => setTabSelected(2)}
                >
                  On Chain Data
                </a>
              ) : (
                <a
                  className='tab tab-bordered'
                  onClick={() => setTabSelected(2)}
                >
                  On Chain Data
                </a>
              )}
            </div>
            {tabSelected === 1 && (
              <>
                <JsonForms
                  schema={schema}
                  uischema={uischema}
                  data={mdata}
                  renderers={materialRenderers}
                  cells={materialCells}
                  validationMode={'NoValidation'}
                  onChange={({ data }) => {
                    setData(data)
                    console.log(data)
                  }}
                />
                <h3>Files</h3>
                <Upload
                  onRemove={e => setFileList(fileList.filter(f => f !== e))}
                  className='h-[2rem] w-[200px]'
                  fileList={fileList}
                  success={(resp: any, file: any) => {
                    console.log('resp', resp)
                    console.log('file', file)
                    setFileList([
                      ...fileList,
                      {
                        uid: String(resp.type),
                        id: String(resp.type),
                        name: String(resp.uri)
                      }
                    ])
                  }}
                >
                  <div className='flex h-[2rem] flex-col text-center border'>
                    <p className=''>Add files</p>
                  </div>
                </Upload>

                <div className='modal-action'>
                  <label
                    htmlFor='my-modal-6'
                    className='btn btn-secondary'
                    onClick={updateMetaplex}
                  >
                    Update
                  </label>
                  <label htmlFor='my-modal-6' className='btn btn-primary'>
                    Cancel
                  </label>
                </div>
              </>
            )}
            {tabSelected === 2 && (
              <>
                <JsonForms
                  schema={chainSchema}
                  uischema={chainUiSchema}
                  data={cdata}
                  renderers={materialRenderers}
                  cells={materialCells}
                  validationMode={'NoValidation'}
                  onChange={({ data }) => {
                    setNewChainData(data)
                    console.log(data)
                  }}
                />

                <div className='modal-action'>
                  <label
                    htmlFor='my-modal-6'
                    className='btn btn-secondary'
                    onClick={updateChain}
                  >
                    Update
                  </label>
                  <label htmlFor='my-modal-6' className='btn btn-primary'>
                    Cancel
                  </label>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default NftEdit
