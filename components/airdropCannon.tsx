import { useState, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, clusterApiUrl, PublicKey, Transaction } from '@solana/web3.js'
import { Metaplex, walletAdapterIdentity } from '@metaplex-foundation/js'
import { materialRenderers, materialCells } from '@jsonforms/material-renderers'
import { Button } from 'antd'
import { gql } from '@apollo/client'
import client from '../client'
import { JsonForms } from '@jsonforms/react'
import { Nft } from '../types'
import * as ga from '../lib/ga'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createTransferInstruction
} from '@solana/spl-token'

export const AirdropCannon = () => {
  const connection = new Connection(clusterApiUrl('mainnet-beta'))
  const wallet = useWallet()
  const {publicKey, signTransaction} = useWallet()
  const [loading, setLoading] = useState<boolean>(false)
  const initData = { destinationAddress: wallet.publicKey?.toBase58() }
  const [data, setData] = useState<any>(initData)
  const [nfts, setNfts] = useState<any[]>([])
  const [lists, setLists] = useState<any[]>([])

  const schema = {
    type: 'object',
    properties: {
      destinationAddress: {
        type: 'string'
      }
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
    if (wallet.publicKey?.toBase58()) {
      client
        .query({
          query: GET_NFTS,
          variables: {
            owners: [wallet.publicKey?.toBase58()],
            offset: 0,
            limit: 10000
          }
        })
        .then(res => {
          setNfts(res.data.nfts)
        })
    } else {
      setNfts([])
    }
  }, [wallet, GET_NFTS])

  const shipIt = async () => {
    console.log(data)
    if (nfts.length == 0 || data.destinationAddress == ''|| !publicKey || !signTransaction ) {
      toast('data needed')
      return
    }


    setLoading(true)
    try {
      

      const owners = data.destinationAddress.split(',')
        ? data.destinationAddress.replace(/(^,)|(,$)/g, '').split(',')
        : data.destinationAddress
      
      if (nfts.length != owners.length){
        toast('number of nfts doesnt match address list')
        toast(`${nfts.length} != ${owners.length}`)
        setLoading(false)
        return 
      }
      
      const tx = new Transaction()

      for (var i =0;i < owners.length; i++){
        const mintPublicKey = new PublicKey(nfts[i].mintAddress)
          const fromTokenAccount = await getAssociatedTokenAddress(
            mintPublicKey,
            publicKey
          )
          const fromPublicKey = publicKey
          const destPublicKey = new PublicKey(owners[i])
          const destTokenAccount = await getAssociatedTokenAddress(
            mintPublicKey,
            destPublicKey
          )
          const receiverAccount = await connection.getAccountInfo(
            destTokenAccount
          )


          console.log(`sending ${mintPublicKey.toBase58()} to ${destPublicKey.toBase58()}`)

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
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
          tx.feePayer = publicKey

      let signed: Transaction | undefined = undefined

      try {
        signed = await signTransaction(tx)
      } catch (e:any) {
        toast(e.message)
        setLoading(false)
        return
      }

      let signature: string | undefined = undefined

      try {
        signature = await connection.sendRawTransaction(signed.serialize())
        await connection.confirmTransaction(signature, 'confirmed')

        toast.success('Transaction successful')
      } catch (e:any) {
        toast.error(e.message)
        setLoading(false)
        ga.event({
          action: 'multisend_error',
          params: { msg: e.message }
        })
      }

      } // end of owners for loop
      
      toast('done!')
      ga.event({ action: 'airdrop_cannon', params: { length: nfts.length } })
    } catch (e: any) {
      toast(`error: ${e.message}`)
      console.error(e.message)
      setLoading(false)
    }
    setLoading(false)
  }

  return (
    <>
      <div className='p-4 border border-dashed rounded-md'>
        <h2>Airdrop Cannon, 1 NFT = 1 Address</h2>
        <JsonForms
          schema={schema}
          data={data}
          renderers={materialRenderers}
          cells={materialCells}
          onChange={({ errors, data }) => setData(data)}
        />

        <Button
          loading={loading}
          onClick={shipIt}
          className='btn btn-secondary'
        >
          Ship It
        </Button>
      </div>
    </>
  )
}

export default AirdropCannon
