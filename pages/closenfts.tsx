import { NextPage } from 'next'
import Head from 'next/head'
import { Navbar } from '../components/navbar'
import { useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  createCloseAccountInstruction
} from '@solana/spl-token'
import { Button } from 'antd'
import * as ga from '../lib/ga'

const CloseNfts: NextPage = () => {
  const { publicKey, signTransaction, connected } = useWallet()
  const connection = new Connection('https://ssc-dao.genesysgo.net')

  interface Token {
    pubkey: PublicKey
    balance: any
    decimals: any
  }

  const [loading, setLoading] = useState(false)
  const [txLoading, setTxLoading] = useState(false)
  const [tokens, setTokens] = useState<Token[]>([])
  const [solPrice, setSolPrice] = useState(0)

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
          setTokens(allTokens.filter(t => t.balance == 0 && t.decimals == 0))

          // stop loading
          setLoading(false)
        })

        // catch error
      } catch (e: any) {
        // stop loading
        setLoading(false)
      }
    }
  }, [publicKey])

  const closeAll = async () => {
    if (!publicKey || !signTransaction) {
      return
    }

    // Set Transaction Loading to true
    setTxLoading(true)

    // list of all closed token accounts
    let sentTokens: Token[] = []

    // close 10 at a time
    for (var i = 0; i < Math.ceil(tokens.length / 10); i++) {
      const tx = new Transaction()

      // list of tokens accounts queued to close
      let queuedTokens = []

      // load up the 10 to close
      for (var j = 0; j < 10; j++) {
        // make sure we dont overflow the list length
        if (tokens[i * 10 + j]) {
          // add the token to the list of tokens to be closed
          queuedTokens.push(tokens[i * 10 + j])

          // add the instruction to the transaction
          tx.add(
            createCloseAccountInstruction(
              new PublicKey(tokens[i * 10 + j].pubkey),
              publicKey,
              publicKey,
              [],
              TOKEN_PROGRAM_ID
            )
          )
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
      } catch (e: any) {
        console.log(e.message)
        // didnt complete outer loop - if token was sent, remove it from tokens
        setTokens(tokens.filter(t => !sentTokens.includes(t)))
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
        sentTokens = [...queuedTokens, ...sentTokens]

        ga.event({
          action: 'close_nft_accounts',
          params: { count: queuedTokens.length }
        })
      } catch (e: any) {
        setTxLoading(false)

        // didnt complete outer loop - if token was sent, remove it from tokens
        setTokens(tokens.filter(t => !sentTokens.includes(t)))
      }
    }

    // record the event
    ga.event({
      action: 'close_nft_success',
      params: {
        count: tokens.length,
        value: Number(tokens.length * 0.002 * solPrice).toFixed(2)
      }
    })

    // tx event done
    setTxLoading(false)

    // clear tokens list
    setTokens([])
  }

  return (
    <div>
      <Head>
        <title>Close Empty NFT Accounts</title>
        <meta name='description' content='Closed Empty NFT Token Accounts' />
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
                  Close Accounts: {tokens.length} ($
                  {Number(tokens.length * 0.002 * solPrice).toFixed(2)})
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <footer></footer>
    </div>
  )
}

export default CloseNfts
