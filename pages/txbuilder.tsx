import { NextPage } from 'next'
import Head from 'next/head'
import { Navbar } from '../components/navbar'
import { useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import {
  Transaction,
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js'
import { gql } from '@apollo/client'
import 'react-toastify/dist/ReactToastify.css'
import client from '../client'
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createTransferInstruction
} from '@solana/spl-token'

import React from 'react'
import Select from 'react-select'
import { InstructionDrawerRow } from '../components/instructionDrawerRow'


const TXBuilder: NextPage = () => {
  interface Nft {
    name: string
    address: string
    description: string
    image: string
    mintAddress: string
  }

  interface InstructionDrawerRow {
    name: string
    to: string
    amount?: string
    instructions: TransactionInstruction[]
  }

  const { publicKey, signTransaction, connected } = useWallet()
  const { connection } = useConnection()
  const [nfts, setNfts] = useState<Nft[]>([])
  const [sending, setSending] = useState(-1)
  const [tabSelected, setTabSelected] = useState(1)
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [instructions, setInstructions] = useState<TransactionInstruction[]>([])
  const [instructionsDrawer, setInstructionsDrawer] = useState<
    InstructionDrawerRow[]
  >([])

  const sendSolana = async (amount: string, to: string) => {
    if (to == '') {
      alert('no dest')
      return
    } else {
      try {
        console.log('to: ', to)
        new PublicKey(to)
      } catch (e) {
        console.log('Invalid address')
        return
      }
    }

    if (!publicKey) return

    return SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: new PublicKey(to),
      lamports: Number(amount) * LAMPORTS_PER_SOL
    })
  }

  const sendNft = async (nft: Nft, to: string) => {
    if (to == '') {
      alert('no dest')
      return
    } else {
      try {
        console.log('to: ', to)
        new PublicKey(to)
      } catch (e) {
        console.log('Invalid address')
        return
      }
    }

    if (!nft || !publicKey) return
    let ret = []
    const mintPublicKey = new PublicKey(nft.mintAddress)
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
      ret.push(
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

    ret.push(
      createTransferInstruction(
        fromTokenAccount,
        destTokenAccount,
        fromPublicKey,
        1
      )
    )
    return ret
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
            limit: 1000
          }
        })
        .then(res => setNfts(res.data.nfts))
    } else {
      setNfts([])
    }
  }, [publicKey?.toBase58()])

  return (
    <div>
      <Head>
        <title>TX Builder</title>
        <meta name='description' content='Build Some Transactions!' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <div className='drawer drawer-end'>
        <input id='my-drawer' type='checkbox' className='drawer-toggle' />
        <div className='drawer-content'>
          <Navbar sending={instructionsDrawer} />

          <div className='container px-4'>
            <div className='grid place-items-center'>
              <div className='tabs'>
                {tabSelected === 1 ? (
                  <a
                    className='tab tab-bordered tab-active'
                    onClick={() => setTabSelected(1)}
                  >
                    Send NFT
                  </a>
                ) : (
                  <a
                    className='tab tab-bordered'
                    onClick={() => setTabSelected(1)}
                  >
                    Send NFT
                  </a>
                )}
                {tabSelected === 2 ? (
                  <a
                    className='tab tab-bordered tab-active'
                    onClick={() => setTabSelected(2)}
                  >
                    Send Solana
                  </a>
                ) : (
                  <a
                    className='tab tab-bordered'
                    onClick={() => setTabSelected(2)}
                  >
                    Send Solana
                  </a>
                )}
                {tabSelected === 3 ? (
                  <a
                    className='tab tab-bordered tab-active'
                    onClick={() => setTabSelected(3)}
                  >
                    Send SPL Token
                  </a>
                ) : (
                  <a
                    className='tab tab-bordered'
                    onClick={() => setTabSelected(3)}
                  >
                    Send SPL Token
                  </a>
                )}
              </div>

              {tabSelected === 1 && (
                // SEND NFT TAB
                <div className=''>
                  <div className='w-full'>
                  <Select
                    options={nfts.map((n, i) => ({ value: i, label: n.name }))}
                    onChange={e => {
                      setSending(e?.value as number)
                    }}
                  />
                  </div>
                  <input
                    type='text'
                    placeholder='to'
                    className='w-full input input-bordered input-secondary'
                    onChange={e => setTo(e.target.value)}
                  />
                  <button
                    className='block text-white btn btn-primary'
                    onClick={async () => {
                      const nftSend = await sendNft(nfts[sending], to)
                      if (nftSend) {
                        console.log([...instructions, ...nftSend])
                        const n = setInstructions([...instructions, ...nftSend])
                        setInstructionsDrawer([
                          ...instructionsDrawer,
                          { name: 'send-nft', to: to, instructions: nftSend }
                        ])
                      }
                    }}
                  >
                    Add it
                  </button>
                </div>
              )}
              {tabSelected === 2 && (
                // SEND SOLANA TAB
                <div>
                  <input
                    type='text'
                    placeholder='to'
                    className='w-full input input-bordered input-secondary'
                    onChange={e => setTo(e.target.value)}
                  />
                  <input
                    type='text'
                    placeholder='amount'
                    className='w-full input input-bordered input-secondary'
                    onChange={e => setAmount(e.target.value)}
                  />
                  <button
                    className='block text-white btn btn-primary'
                    onClick={async () => {
                      const solSend = await sendSolana(amount, to)
                      if (solSend) {
                        console.log([...instructions, solSend])
                        setInstructions([...instructions, solSend])
                      }
                    }}
                  >
                    Add it
                  </button>
                </div>
              )}
              {tabSelected === 3 && (
                <div>
                  <h1>Send SPL Token</h1>
                  <h1>Coming soon</h1>
                </div>
              )}
            </div>

          </div>
        </div>
        <div className='drawer-side'>
          <label htmlFor='my-drawer' className='drawer-overlay'></label>
          <ul className='p-4 overflow-y-auto menu w-80 bg-base-100 text-base-content'>
            {instructionsDrawer.map(n => (
              <li key={Math.random()}>
                <InstructionDrawerRow
                  name={n.name}
                  to={n.to}
                  unselect={() => {
                    setInstructionsDrawer(
                      instructionsDrawer.filter(item => item !== n)
                    )
                  }}
                />
              </li>
            ))}

            {instructionsDrawer.length > 0 ? (
              <>
                <li key={Math.random()}>
                <button
              className='block text-white btn btn-primary'
              onClick={async () => {
                if (
                  instructions.length == 0 ||
                  !connection ||
                  !publicKey ||
                  !signTransaction
                ) {
                  console.log('returning')
                  return
                }
                const tx = new Transaction()
                instructionsDrawer.map(i => {
                  i.instructions.map((instruction) =>
                    tx.add(instruction)
                  )
                })
                tx.recentBlockhash = (
                  await connection.getLatestBlockhash()
                ).blockhash
                tx.feePayer = publicKey

                let signed: Transaction | undefined = undefined

                try {
                  signed = await signTransaction(tx)
                } catch (e: any) {
                  console.log(e.message)
                  return
                }

                let signature: string | undefined = undefined

                try {
                  signature = await connection.sendRawTransaction(
                    signed.serialize()
                  )
                  await connection.confirmTransaction(signature, 'confirmed')
                  console.log('Transaction successful')
                } catch (e: any) {
                  console.log(e.message)
                }
              }}
            >
              Ship it
            </button>
                </li>
              </>
            ) : (
              <>
                <li key={Math.random()}>Add some actions!</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TXBuilder
