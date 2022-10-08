import { NextPage } from 'next'
import Head from 'next/head'
import { Navbar } from '../components/navbar'
import { useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  createCloseAccountInstruction
} from '@solana/spl-token'
import { Button } from 'antd'
import * as ga from '../lib/ga'
import { toast } from 'react-toastify'
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token'
const IX_LIMIT = 8

interface Token {
  pubkey: PublicKey
  balance: any
  decimals: any
}

const Vacuum: NextPage = () => {
  const { publicKey, signTransaction, connected } = useWallet()
  const connection = new Connection('https://ssc-dao.genesysgo.net')
  const [loading, setLoading] = useState(false)
  const [txLoading, setTxLoading] = useState(false)
  const [tokens, setTokens] = useState<Token[]>([])
  const [solPrice, setSolPrice] = useState(0)
  const [to, setTo] = useState('')
  


  const getTokens = async (publicKey: PublicKey) => {
    const userTokens = await connection.getTokenAccountsByOwner(publicKey, {
      programId: TOKEN_PROGRAM_ID
    })

    // Promise array to get balance for each token account
    const pAll = userTokens.value.map(ut =>
      connection.getTokenAccountBalance(ut.pubkey)
    )

    // Get balance for each token account
    Promise.all(pAll).then(balances => {
      // Create array of all tokens and balances
      let allTokens = userTokens.value.map((ut, i) => ({
        pubkey: ut.pubkey,
        balance: balances[i].value.uiAmount,
        decimals: balances[i].value.decimals
      }))

      // Filter out tokens that have zero balance and decimals 0 (NFT)
      // setTokens(allTokens.filter(t => t.balance == 0 && t.decimals == 0))
      console.log(allTokens)

      setTokens(allTokens)
      // stop loading
      setLoading(false)
    })
  }



  

  useMemo(() => {
    var url =
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
    fetch(url).then(async response => {
      let price = await response.json()
      setSolPrice(price.solana.usd)
    })
  }, [])

  useMemo(async () => {
    if (publicKey?.toBase58()) {
      // start loading
      setLoading(true)
      try {
        // Get list of all token accounts
        getTokens(publicKey)
        // catch error
      } catch (e) {
        // stop loading
        setLoading(false)
      }
    }
  }, [publicKey])

  const closeAll = async () => {
    if (!publicKey || !signTransaction) {
      return
    }

    let toPk: PublicKey
    try {
      toPk = new PublicKey(to)
    } catch (e) {
      toast('Not a valid publickey')
      console.log('Not a valid publickey')
      return
    }

    // Set Transaction Loading to true
    setTxLoading(true)

    console.log(tokens.length)
    // for each token
    let ixList: TransactionInstruction[] = []
    let sentIx: TransactionInstruction[] = []

    // create instructions for all token accounts
    for (var i = 0; i < tokens.length; i++) {
      const mintPublicKey = new PublicKey(tokens[i].pubkey)

      const fromTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        publicKey
      )
      const fromPublicKey = publicKey

      const destTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        toPk
      )
      const receiverAccount = await connection.getAccountInfo(destTokenAccount)

      if (receiverAccount === null) {
        const cATAIx = await createAssociatedTokenAccountInstruction(
          fromPublicKey,
          destTokenAccount,
          toPk,
          mintPublicKey,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
        ixList.push(cATAIx)
      }

      const cTIIx = await createTransferInstruction(
        fromTokenAccount,
        destTokenAccount,
        fromPublicKey,
        tokens[i].balance
      )
      ixList.push(cTIIx)
    }

  
    // send IX at a time
    for (var i = 0; i<Math.ceil(ixList.length / IX_LIMIT); i++) {
      const tx = new Transaction()

      // list of tokens accounts queued to close
      let queuedIxs = []

      // load up the X to action
      for (var j = 0; j < IX_LIMIT; j++) {
        // make sure we dont overflow the list length
        if (ixList[i * IX_LIMIT + j]) {
          // add the token to the list of tokens to be closed
          queuedIxs.push(ixList[i * IX_LIMIT + j])

          // add the instruction to the transaction
          tx.add(ixList[i * IX_LIMIT + j])
        }
      }

      // get recent blockhash
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

      // set whos paying for the tx
      tx.feePayer = publicKey

      // pop for user signature
      let signed: Transaction | undefined = undefined

      try {
        signed = await signTransaction(tx)
      } catch (e) {
        console.log(e)
        // didnt complete outer loop - if token was sent, remove it from tokens
        // setTokens(tokens.filter(t => !sentTokens.includes(t)))
        setTxLoading(false)
        return
      }

      let signature: string | undefined = undefined

      // send transaction
      try {
        signature = await connection.sendRawTransaction(signed.serialize())
        await connection.confirmTransaction(signature, 'confirmed')

        console.log('Transaction successful')

        // tx was successful, add queued tokens to sent tokens
        sentIx = [...queuedIxs, ...sentIx]

        ga.event({
          action: 'vacuum_inner_loop',
          params: { count: queuedIxs.length }
        })
      } catch (e) {
        setTxLoading(false)

        // didnt complete outer loop - if token was sent, remove it from tokens
        // need to refresh tokens here. 
        console.log(e)
        console.log("calling get tokens")
        getTokens(publicKey)
      }
    }

    // get sol balance
    const solBalance = await connection.getBalance(publicKey)
    const tx = new Transaction()
    // create instruction for sending solana add to list
     tx.add(SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: toPk,
      lamports: solBalance
    }))

    // get recent blockhash
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

    // set whos paying for the tx
    tx.feePayer = publicKey

    // pop for user signature
    let signed: Transaction | undefined = undefined

    try {
      signed = await signTransaction(tx)
    } catch (e) {
      console.log(e)
      // didnt complete outer loop - if token was sent, remove it from tokens
      // setTokens(tokens.filter(t => !sentTokens.includes(t)))
      setTxLoading(false)
      return
    }

    let signature: string | undefined = undefined

    // send transaction
    try {
      signature = await connection.sendRawTransaction(signed.serialize())
      await connection.confirmTransaction(signature, 'confirmed')

      console.log('Transaction successful')

      
      ga.event({
        action: 'vacuum_inner_loop',
        params: { count: solBalance }
      })
    } catch (e) {
      setTxLoading(false)
      // couldnt send solana
      console.log("couldnt send sol")
      console.log(e)
    }

    // record the event
    ga.event({
      action: 'vacuum_success',
      params: {
        count: tokens.length,
      }
    })
    console.log("Successful")
    toast("successful!")
    // tx event done
    setTxLoading(false)

    // clear tokens list
    setTokens([])
  }

  return (
    <div>
      <Head>
        <title>Vacuum Assets</title>
        <meta name='description' content='Vacuum Assets' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Navbar />

      <div className='container items-center px-4'>
        {!connected && <h1>Connect your wallet first</h1>}
        {connected && loading && (
          <>
            <div className='grid grid-cols-1'>
              <div className='items-center h-12'>
                <Button
                  loading={loading}
                  id='btn-copy'
                  type='primary'
                  className='w-full h-12 py-40 text-2xl btn btn-primary bg-fuchsia-500'
                  disabled={true}
                >
                  Loading...
                </Button>
              </div>
            </div>
          </>
        )}
        {connected && !loading && (
          <>
            <div className='grid grid-cols-1'>
              <div className='h-12'>
                <Button
                  loading={txLoading}
                  id='btn-copy'
                  type='primary'
                  className='w-full h-12 py-40 text-2xl text-indigo-400 btn btn-primary bg-fuchsia-500 hover:text-white hover:bg-indigo-400'
                  onClick={closeAll}
                >
                  Accounts to Transfer: {tokens.length} 
                </Button>
                <input type='text' onChange={e => setTo(e.target.value)} />
              </div>
            </div>
          </>
        )}
      </div>

      <footer></footer>
    </div>
  )
}

export default Vacuum
