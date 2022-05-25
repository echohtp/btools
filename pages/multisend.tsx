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
import { NftCard } from '../components/nftCard'
import { NftRow } from '../components/nftRow'

enum transactionState {
  NONE,
  SENDING,
  DONE
}

enum inputState {
  NONE,
  VALID,
  INVALID
}

const Home: NextPage = () => {
  interface Nft {
    name: string
    address: string
    description: string
    image: string
    mintAddress: string
  }

  const { publicKey, signTransaction, connected } = useWallet()
  const { connection } = useConnection()
  const [nfts, setNfts] = useState<Nft[]>([])
  const [sending, setSending] = useState<Nft[]>([])
  const [to, setTo] = useState('')
  const [showHidden, setShowHidden] = useState(false)
  const [txState, setTxState] = useState<transactionState>(
    transactionState.NONE
  )
  const [inputStatus, setInputStatus] = useState<inputState>(inputState.NONE)

  const massSend = async (list: Nft[], to: string) => {
    if (to == '') {
      alert('no dest')
      return
    } else {
      try {
        console.log('to: ', to)
        new PublicKey(to)
        console.log('valid dest address: ', to)
        setInputStatus(inputState.VALID)
      } catch (e) {
        toast.error('Invalid address')
        setInputStatus(inputState.INVALID)
        setTo("")
        return
      }
    }

    if (!list || !connection || !publicKey || !signTransaction) {
      console.log('returning')
      return
    }
    setTxState(transactionState.SENDING)

    if (!list.length) {
      console.log('probably want to select some nfts')
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
      setTxState(transactionState.NONE)
      return
    }

    let signature: string | undefined = undefined

    try {
      signature = await connection.sendRawTransaction(signed.serialize())
      await connection.confirmTransaction(signature, 'confirmed')

      toast.success('Transaction successful')
      // WE HAVE TO REFETCH WALLET DATA HERE
      // for now remove them from the list
      sending.map(n => {
        setNfts(nfts.filter(n => !sending.includes(n)))
      })
      setSending([])
      setTxState(transactionState.NONE)
    } catch (e: any) {
      toast.error(e.message)
      setTxState(transactionState.NONE)
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
            limit: 200
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
        <title>Multi Send</title>
        <meta name='description' content='Send multiple NFTs at once!' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Navbar />

      <div className='container pl-4'>
        <div className="w-full">
          <div className='right-0'>
        {connected && (
          <div className='inline-block mr-4 indicator'>
            {sending.length > 0 && (
              <span className='indicator-item badge badge-secondary'>
                {sending.length}
              </span>
            )}
            <div className=''>
              {' '}
              <label htmlFor='my-modal-3' className='bg-white rounded-lg btn-ghost w-14 btn'>
                <span>🛒</span>
              </label>
            </div>
          </div>
        )}
          <div className='inline-block form-control'>
            <label className='cursor-pointer label'>
              <span className='label-text'>Show hidden</span>
              <input type='checkbox' className='toggle' onChange={(e)=>{
                if (e.target.checked){
                  setShowHidden(true)
                }else{
                  setShowHidden(false)
                }
              }} />
            </label>
          </div>
        </div>
        </div>
        <div className='grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {nfts.map(e => (
            <NftRow
              showHidden={showHidden}
              key={Math.random()}
              image={e.image}
              name={e.name}
              unselect={() => {
                setSending(sending.filter(item => item !== e))
              }}
              select={() => {
                setSending([...sending, e])
              }}
              selected={sending.includes(e)}
            />
          ))}
        </div>
      </div>

      <footer></footer>
      {/* Send Modal */}
      <input type='checkbox' id='my-modal-3' className='modal-toggle ' />
      <div
        className='modal'
        onBlur={() => {
          console.log('bye bye')
        }}
      >
        <div className='relative modal-box'>
          <label
            htmlFor='my-modal-3'
            className='absolute btn btn-sm btn-circle right-2 top-2'
          >
            ✕
          </label>
          {txState === transactionState.NONE && (
            <div>
              <h3 className='text-lg font-bold'>Send the NFS</h3>
              <div className="grid grid-flow-row gap-2 overflow-scroll">
                {sending.length === 0 && (
                  <h1>Select some nfts to send fren!</h1>
                )}
                {sending.map(e => (
                  <NftRow
                  showHidden={showHidden}
                  key={Math.random()}
                  image={e.image}
                  name={e.name}
                  unselect={() => {
                    setSending(sending.filter(item => item !== e))
                  }}
                  select={() => {
                    setSending([...sending, e])
                  }}
                  selected={sending.includes(e)}
                />
                ))}
                
                {inputStatus == inputState.NONE && (
                  <div className="input-group">
                  <input type='text'
                    className='w-full max-w-xs input input-bordered'
                    placeholder='pubkey address'
                    onChange={e => {
                      setTo(e.target.value)
                    }}/>
                    <button
                    className='btn btn-square'
                    onClick={() => {
                      massSend(sending, to)
                    }}
                  >
                    🚀
                  </button>
                </div>
                )}
                {inputStatus == inputState.VALID && (
                  <div className="input-group">
                  <input type='text'
                    className='w-full max-w-xs input input-bordered'
                    placeholder='pubkey address'
                    onChange={e => {
                      setTo(e.target.value)
                    }}/>
                    <button
                    className='btn btn-square'
                    onClick={() => {
                      massSend(sending, to)
                    }}
                  >
                    🚀
                  </button>
                </div>
                )}
                {inputStatus == inputState.INVALID && (
                  <div className="input-group">
                  <input type='text'
                    className='w-full max-w-xs input input-bordered'
                    placeholder='pubkey address'
                    onChange={e => {
                      setTo(e.target.value)
                    }}/>
                    <button
                    className='btn btn-square'
                    onClick={() => {
                      massSend(sending, to)
                    }}
                  >
                    🚀
                  </button>
                </div>
                )}

              </div>{' '}
            </div>
          )}
          {txState === transactionState.SENDING && (
            
              <div className='lds-ripple'>
                <div></div>
                <div></div>
              </div>
            
          )}
          {txState === transactionState.DONE && (
            
              <h1>DONE!</h1>
            
          )}
        </div>
      </div>
      <ToastContainer position='bottom-center' />
    </div>
  )
}

export default Home
