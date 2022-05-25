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
import CounterInput from "react-counter-input";
import { NftCard } from '../components/nftCard'

import React, { Component } from 'react'
import Select from 'react-select'

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
  const [balance, setBalance] = useState(0)
  const [sendAmount, setSendAmount] = useState(0)
  const [singleAssetSend, setSingleAssetSend] = useState<Nft | undefined | string >()
  const [addInstruction, setAddInstruction] = useState<string | undefined | null>("")
  const [txState, setTxState] = useState<transactionState>(
    transactionState.NONE
  )
  const [inputStatus, setInputStatus] = useState<inputState>(inputState.NONE) 

  const massSend = async (list: Nft[], to: string) => {
    if (to == ''){
      alert("no dest")
      return
    }else{
      try {
        console.log('to: ', to)
        new PublicKey(to)
        console.log('valid dest address: ', to)
        setInputStatus(inputState.VALID)
      } catch (e: any) {
        console.log("invaid addres")
        setInputStatus(inputState.INVALID)
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
        .then(()=>connection.getBalance(publicKey))
        .then((bal)=>setBalance(bal))
    } else {
      setNfts([])
      
    }
  }, [publicKey?.toBase58()])



  const instructions = [
    { value: 'single-send', label: 'send a nft' },
    { value: 'multi-send', label: 'send multiple nfts' }
  ]


  const allAssets = [...nfts.map((n)=>({value: n.mintAddress, label: n.name}))]

  return (
    <div>
      <Head>
        <title>Multi Send</title>
        <meta name='description' content='Send multiple NFTs at once!' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Navbar sending={sending.length} />

      <div className='container'>
        <div className='grid grid-flow-row px-4'>

          <div className='py-4 border border-black border-rounded'>
            <h3>Instruction type</h3>
            <Select options={instructions}  onChange={(e: any)=>{setAddInstruction(e.value)}}/>
            {
              addInstruction == "single-send" && <><Select options={allAssets} /></>
            }
          </div>
          <button className='border border-white '>+</button>
        </div>
      </div>

      <footer></footer>
    </div>
  )
}

export default Home
