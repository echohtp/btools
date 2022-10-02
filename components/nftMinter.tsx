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
import { Button } from 'antd'
import axios from 'axios'
import { JsonForms } from '@jsonforms/react'
import { materialRenderers, materialCells } from '@jsonforms/material-renderers'
import { NftRow } from './nftRow'
import * as ga from '../lib/ga'
import {
  Metaplex,
  walletAdapterIdentity,
  toMetaplexFileFromBrowser
} from '@metaplex-foundation/js'
import { Nft } from '../types'
import React from 'react'
import { XCircle } from 'react-feather'

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
          type: 'string',
          enum: ['Image', 'Video', 'HTML']
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

const imageSchema = {
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
    external_url: {
      type: 'string'
    },
    seller_fee_basis_points: {
      type: 'integer'
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
                type: 'number'
              },
              cdn: {
                type: 'boolean'
              }
            }
          }
        }
      }
    }
  }
}

const videoSchema = {
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
    external_url: {
      type: 'string'
    },
    seller_fee_basis_points: {
      type: 'integer'
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
          type: 'string',
          enum: ['Image', 'Video', 'HTML']
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

const UISchema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/name',
      label: 'Name'
    },
    {
      type: 'Control',
      scope: '#/properties/description',
      label: 'Description'
    },
    {
      type: 'Control',
      scope: '#/properties/external_url',
      label: 'External URL'
    },
    {
      type: 'Control',
      scope: '#/properties/seller_fee_basis_points',
      label: 'Royalty Percentage'
    },
    {
      type: 'Control',
      scope: '#/properties/attributes',
      label: 'Attributes'
    }
  ]
}

const htmlSchema = {
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

export const NftMint = () => {
  const wallet = useWallet()
  const { publicKey, signTransaction, connected } = useWallet()
  const { connection } = useConnection()
  const [nfts, setNfts] = useState<Nft[]>([])
  const [nftType, setNftType] = useState<'' | 'video' | 'image' | 'other'>('')
  const [step, setStep] = useState<number>(0)
  const [sending, setSending] = useState<Nft[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [modalData, setModalData] = useState<any>({
    name: '',
    description: '',
    symbol: '',
    animation_url: '',
    seller_fee_basis_points: 0,
    image: '',
    properties: {
      category: '',
      files: [],
      creators: [{ address: publicKey?.toBase58(), share: 100 }]
    }
  })
  const [nftData, setNftData] = useState<any>({})
  const [selectedNft, setSelectedNft] = useState<any>()
  const [toggler, setToggler] = useState<boolean>(false)
  const metaplex = Metaplex.make(connection).use(
    walletAdapterIdentity(useWallet())
  )

  const imageData = {
    properties: {
      category: 'Image',
      creators: []
    }
  }

  const mintImage = async (data: any) => {
    // @ts-ignore
    const selectedFile = document.getElementById('imageInput').files[0]
    console.log(selectedFile)
    if (selectedFile == undefined) {
      toast('Please select an image')
      return
    }

    if (data.seller_fee_basis_points > 100) {
      toast('Royalty needs to be less than 100')
      return
    }

    if (data.seller_fee_basis_points < 0) {
      toast('Royalty needs to be greater than 0')
      return
    }

    let mdata = data
    mdata.seller_fee_basis_points = mdata.seller_fee_basis_points * 100
    mdata.image = await toMetaplexFileFromBrowser(selectedFile)
    mdata.properties.category = 'image'
    mdata.properties.files.push({
      type: 'image/png',
      uri: mdata.image,
      cdn: true
    })
    toast("A few TX's will pop, follow these notifs for more")
    //@ts-ignore
    // document.getElementById('my-modal-3').checked = true
    try {
      const { uri, metadata } = await metaplex
        .nfts()
        .uploadMetadata(mdata)
        .run()
      toast('1/2 done')

      const { nft } = await metaplex
        .nfts()
        .create({
          uri: uri,
          name: metadata.name!,
          sellerFeeBasisPoints: metadata.seller_fee_basis_points!
        })
        .run()
      toast('2/2 DONE')
      toast('Minting successful!')
    } catch (e:any) {
      toast(`ERROR: ${e.message}`)
    }
  }

  const mintVideo = async (data: any) => {
    // @ts-ignore
    const selectedFile = document.getElementById('videoInput').files[0]
    console.log(selectedFile)
    if (selectedFile == undefined) {
      toast('Please select a video')
      return
    }

    // @ts-ignore
    const selectedCoverFile = document.getElementById('videoCoverInput').files[0]
    console.log(selectedCoverFile)
    if (selectedCoverFile == undefined) {
      toast('Please select a cover image')
      return
    }

    if (data.seller_fee_basis_points > 100) {
      toast('Royalty needs to be less than 100')
      return
    }

    if (data.seller_fee_basis_points < 0) {
      toast('Royalty needs to be greater than 0')
      return
    }

    let mdata = data
    mdata.seller_fee_basis_points = mdata.seller_fee_basis_points * 100
    mdata.image = await toMetaplexFileFromBrowser(selectedCoverFile)
    mdata.animation_url = await toMetaplexFileFromBrowser(selectedFile)
    mdata.properties.category = 'video'
    mdata.properties.files.push(
      { type: 'image/mp4', uri: mdata.animation_url, cdn: true },
      { type: 'image/png', uri: mdata.image, cdn: true }
    )
    toast("A few TX's will pop, follow these notifs for more")
    try {
      const { uri, metadata } = await metaplex
        .nfts()
        .uploadMetadata(mdata)
        .run()

      toast('1/2 done')
      const { nft } = await metaplex
        .nfts()
        .create({
          uri: uri,
          name: metadata.name!,
          sellerFeeBasisPoints: metadata.seller_fee_basis_points!
        })
        .run()
      toast('2/2 DONE')
      toast('Minting successful!')
    } catch (e:any) {
      toast(`ERROR: ${e.message}`)
    }
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
    }
  }, [publicKey, GET_NFTS, toggler])

  return (
    <div>
      <h1>NFT Creator</h1>
      <div className='container px-4'>
        {step == 0 && (
          <>
            {nftType == '' && (
              <>
                <div className='grid grid-flow-row'>
                  <div>
                    <button
                      className='h-40 border rounded-lg w-80 hover:bg-purple-600 hover:text-white'
                      onClick={() => {
                        setNftType('image')
                        setStep(1)
                      }}
                    >
                      Image
                    </button>
                    <br />
                    <button
                      className='h-40 border rounded-lg w-80 hover:bg-purple-600 hover:text-white'
                      onClick={() => {
                        setNftType('video')
                        setStep(1)
                      }}
                    >
                      Video
                    </button>
                    <br />
                    {/* <button
                      className='h-40 border rounded-lg w-80 hover:bg-purple-600 hover:text-white'
                      onClick={() => {
                        setNftType('other')
                        setStep(1)
                      }}
                    >
                      Other
                    </button> */}
                  </div>
                </div>
              </>
            )}
          </>
        )}
        {step == 1 && (
          <>
            {nftType == 'image' && (
              <>
                <span
                  className='fixed right-40'
                  onClick={() => {
                    setNftType('')
                    setStep(0)
                  }}
                >
                  <XCircle />
                </span>
                <h2>Upload an image</h2>
                <input type='file' id='imageInput' />
                <JsonForms
                  schema={imageSchema}
                  data={modalData}
                  uischema={UISchema}
                  renderers={materialRenderers}
                  cells={materialCells}
                  onChange={({ errors, data }) => setNftData(data)}
                />
                <button
                  className='btn btn-secondary'
                  onClick={() => mintImage(nftData)}
                >
                  Mint It
                </button>
              </>
            )}
            {nftType == 'video' && (
              <>
                <span
                  className='fixed right-40'
                  onClick={() => {
                    setNftType('')
                    setStep(0)
                  }}
                >
                  <XCircle />
                </span>
                <h2>Upload a video</h2>
                <input type='file' id='videoInput' />
                <h2>Upload a cover image</h2>
                <input type='file' id='videoCoverInput' />
                <JsonForms
                  schema={videoSchema}
                  uischema={UISchema}
                  data={modalData}
                  renderers={materialRenderers}
                  cells={materialCells}
                  onChange={({ errors, data }) => setNftData(data)}
                />
                <button
                  className='btn btn-secondary'
                  onClick={() => mintVideo(nftData)}
                >
                  Mint It
                </button>
              </>
            )}
            {nftType == 'other' && (
              <>
                <h1>Other</h1>
                <span
                  onClick={() => {
                    setNftType('')
                    setStep(0)
                  }}
                >
                  x
                </span>
                <h2>Upload a file</h2>
                <input type='file' id='otherInput' />
                <h2>Upload a cover image</h2>
                <input type='file' id='otherCoverInput' />

                {/* <JsonForms
                  schema={htmlSchema}
                  data={modalData}
                  renderers={materialRenderers}
                  cells={materialCells}
                  onChange={({ errors, data }) => setNftData(data)}
                /> */}
              </>
            )}
          </>
        )}
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
          <h3 className='text-lg font-bold'>Preview nft here</h3>

          <button className='btn btn-secondary'>mint</button>
        </div>
      </div>
    </div>
  )
}

export default NftMint
