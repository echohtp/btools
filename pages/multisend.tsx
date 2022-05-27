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

const MultiSend: NextPage = () => {
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
        setTo('')
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
      <title>Mint Hash Getter</title>
      <meta name='description' content='Send multiple NFTs at once!' />
      <link rel='icon' href='/favicon.ico' />
    </Head>
    <div className='drawer drawer-end'>
      <input id='my-drawer' type='checkbox' className='drawer-toggle' />
      <div className='drawer-content'>
        <Navbar sending={sending} />

        <div className='container'>
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
          
          { (sending.length > 0) ?
          <>
          <li>
          <input
                type='text'
                className='w-full max-w-xs input input-bordered'
                placeholder='pubkey address'
                onChange={e => {
                  setTo(e.target.value)
                }}
              />
          </li>
                    <li>
            <button
              id='btn-copy'
              className='block text-white btn btn-primary'
              onClick={() => {
                massSend(sending, to)
              }}
            >
              Send them off!
            </button>
          </li>
          </> : <><li>Select some NFTs!</li></>}
        </ul>
      </div>
    </div>
    </div>
  )
}

export default MultiSend
