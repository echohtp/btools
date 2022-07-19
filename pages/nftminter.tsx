import { NextPage } from 'next'
import ConfettiExplosion from 'react-confetti-explosion'

import Head from 'next/head'
import { Navbar } from '../components/navbar'
import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { actions } from '@metaplex/js'
import { PublicKey } from '@solana/web3.js'
import { useForm } from 'react-hook-form'
import Upload from '../components/Upload'
import ipfsSDK from '../src/modules/ipfs/client'
import BN from 'bn.js'

function sleeper (ms: any) {
  return function (x: any) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms))
  }
}

function stringifyPubkeysAndBNInArray (a: any[]): any[] {
  const newA = []
  for (const i of a) {
    if (i instanceof PublicKey) {
      newA.push(i.toBase58())
    } else if (i instanceof BN) {
      newA.push(i.toString())
    } else if (parseType(i) === 'array') {
      newA.push(stringifyPubkeysAndBNInArray(i))
    } else if (parseType(i) === 'dict') {
      newA.push(stringifyPubkeysAndBNsInObject(i))
    } else {
      newA.push(i)
    }
  }
  return newA
}

function parseType<T> (v: T): string {
  if (v === null || v === undefined) {
    return 'null'
  }
  if (typeof v === 'object') {
    if (v instanceof Array) {
      return 'array'
    }
    if (v instanceof Date) {
      return 'date'
    }
    return 'dict'
  }
  return typeof v
}

function stringifyPubkeysAndBNsInObject (o: any): any {
  const newO = { ...o }
  for (const [k, v] of Object.entries(newO)) {
    if (v instanceof PublicKey) {
      newO[k] = v.toBase58()
    } else if (v instanceof BN) {
      newO[k] = v.toString()
    } else if (parseType(v) === 'array') {
      newO[k] = stringifyPubkeysAndBNInArray(v as any)
    } else if (parseType(v) === 'dict') {
      newO[k] = stringifyPubkeysAndBNsInObject(v)
    } else {
      newO[k] = v
    }
  }
  return newO
}

const Home: NextPage = () => {
  const {
    publicKey,
    signTransaction,
    signAllTransactions,
    connected,
    wallet
  } = useWallet()
  const { connection } = useConnection()
  const [nftContentUrl, setNftContentUrl] = useState<string | null>(null)
  const [nftContentType, setNftContentType] = useState<string | null>(null)
  const [nftCoverImage, setNftCoverImage] = useState<string | null>(null)
  const [nftAnimationUrl, setNftAnimationUrl] = useState<string | null>(null)
  const [nftMetadataUrl, setNftMetadataUrl] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [isExploding, setIsExploding] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm()


  const watchAllFields = watch()

  const onSubmit = handleSubmit(async data => {
    setLoading(true)
    // console.log('form data')
    // console.log(data)

    if (
      !wallet ||
      !publicKey ||
      !signTransaction ||
      !signAllTransactions ||
      !nftContentType
    ) {
      return
    }

    if (nftContentUrl === '') {
      setLoading(false)
      return alert('Please upload a file')
    }

    const nftJson = {
      name: data.name,
      symbol: '',
      description: data.description,
      image: nftCoverImage || nftContentUrl,
      animation_url: nftAnimationUrl || nftContentUrl,
      external_url: 'https://tools.0xbanana.com',
      seller_fee_basis_points: data.seller_fee_basis_points,
      properties: {
        files: [
          {
            uri: nftContentUrl,
            type: nftContentType
          }
        ],
        category: nftContentType.split('/')[0],
        creators: [
          {
            address: publicKey.toBase58(),
            share: 100
          }
        ]
      }
    }

    const settings = new File([JSON.stringify(nftJson)], 'nft_metadata.json')
    // Refactor this
    ipfsSDK
      .uploadFile(settings)
      .then(async (res: any) => {
        setNftMetadataUrl(res.uri.split('?')[0])
      })
      .catch(e => {
        setLoading(false)
      })
      .then(sleeper(10000))
      .then(async e => {
        actions
          .mintNFT({
            connection,
            wallet: { publicKey, signTransaction, signAllTransactions },
            uri: nftMetadataUrl,
            maxSupply: data.maxSupply
          })
          .then((res: any) => {
            const strResult = stringifyPubkeysAndBNsInObject(res)
            setLoading(false)
          })
          .catch(async e => {
            console.log('minting error: ', e.message)
            if (e.message.includes('User rejected')) {
              setLoading(false)
              return
            }
            Promise.resolve(sleeper(5000)).then(() => {
              actions
                .mintNFT({
                  connection,
                  wallet: { publicKey, signTransaction, signAllTransactions },
                  uri: nftMetadataUrl,
                  maxSupply: data.maxsupply
                })
                .then((res: any) => {
                  const strResult = stringifyPubkeysAndBNsInObject(res)
                  console.log(strResult) // do something here when minting is successful

                  setLoading(false)
                })
                .catch(e => {
                  console.log('minting error: ', e.message)
                  setLoading(false)
                })
            })
          })
      })
  })

  return (
    <div>
      <Head>
        <title>NFT Minter</title>
        <meta name='description' content='Solana NFT Minter' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Navbar />
      {connected && (
        <div className='container px-4'>
          {loading && <p>LOADING</p>}
          {/* {nftContentUrl && <p>{nftContentUrl}</p>} */}
          {/* {nftContentType && <p>{nftContentType}</p>} */}
          <br />

          <div className='grid grid-cols-4 gap-4'>
            <div>
              <div className=''>
                <Upload
                  fileList={[]}
                  onRemove={() => {
                    setNftAnimationUrl(null)
                    setNftContentType(null)
                    setNftContentUrl(null)
                  }}
                  className='h-[1000px]'
                  success={(resp: any, file: any) => {
                    setNftContentType(resp.type)
                    setNftContentUrl(resp.url)
                    if (!resp.type.includes('image'))
                      setNftAnimationUrl(resp.url)
                  }}
                >
                  <div className='flex h-[8rem] flex-col justify-center'>
                    <p className=''>Upload File</p>
                  </div>
                </Upload>
              </div>
              <form onSubmit={onSubmit}>
                <div className='w-full max-w-xs form-control'>
                  <label className='label'>
                    <span className='label-text'>Name</span>
                  </label>
                  <input
                    type='text'
                    placeholder=''
                    className='w-full max-w-xs input input-bordered'
                    {...register('name')}
                  />
                </div>
                <div className='w-full max-w-xs form-control'>
                  <label className='label'>
                    <span className='label-text'>Description</span>
                  </label>
                  <input
                    type='text'
                    placeholder=''
                    className='w-full max-w-xs input input-bordered'
                    {...register('description')}
                  />
                </div>
                {nftContentType && nftContentType.split('/')[0] !== 'image' && (
                  <div className=''>
                    <Upload
                      //@ts-ignore
                      beforeUpload={file => {
                        const isPNG = file.type.includes('image')
                        if (!isPNG) {
                          console.error(`${file.name} is not an image file`)
                        }
                        return isPNG
                      }}
                      onRemove={() => {
                        setNftCoverImage(null)
                      }}
                      className='h-[1000px]'
                      success={(resp: any, file: any) => {
                        setNftCoverImage(resp.url)
                      }}
                    >
                      <div className='flex h-[8rem] flex-col justify-center border'>
                        <p className=''>Upload Cover Image</p>
                      </div>
                    </Upload>
                    
                  </div>
                )}
                <div className='w-full max-w-xs form-control'>
                  <label className='label'>
                    <span className='label-text'>Max Supply</span>
                  </label>
                  <input
                    type='number'
                    placeholder=''
                    defaultValue={100}
                    className='w-full max-w-xs input input-bordered'
                    {...register('maxSupply')}
                  />
                </div>
                <input
                  type='hidden'
                  value={10000}
                  {...register('basis_fee_points')}
                ></input>
                <input
                  type='hidden'
                  value={100}
                  {...register('royalty')}
                ></input>
                <button
                  type='submit'
                  className='inline-block text-white btn btn-secondary'
                >
                  ship it
                </button>
              </form>
            </div>
            <div>
              <div>
                <div className='shadow-xl card bg-base-100'>
                  <figure>
                  
                    {nftContentType && nftContentType.split('/')[0] === 'image' && nftContentUrl && (
                    <img
                      src={nftContentUrl}
                      alt='Shoes'
                    />)}

                {nftCoverImage && <img src={nftCoverImage} />}
                {nftContentType && nftContentType=== 'text/html' && nftContentUrl && (
                    <iframe
                    width={800}
                        height={400}
                        className='border border-black'
                      src={nftContentUrl}
                    />)}


                  </figure>
                  <div className='card-body'>
                    <h2 className='card-title'>
                      {watchAllFields.name}
                      {/* <div className='badge badge-secondary'>NEW</div> */}
                    </h2>
                    <p>{watchAllFields.description}</p>
                    <p>{"Supply: " + watchAllFields.maxSupply}</p>
                    <div className='justify-end card-actions'>
                      <div className='badge badge-outline'>Fashion</div>
                      <div className='badge badge-outline'>Products</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {!connected && <p>NOT CONNECTED</p>}

      <footer></footer>
    </div>
  )
}

export default Home
