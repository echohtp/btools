import { useState, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js'
import { Metaplex, walletAdapterIdentity, Nft } from '@metaplex-foundation/js'
import { materialRenderers, materialCells } from '@jsonforms/material-renderers'
import { Button } from 'antd'
import { gql } from '@apollo/client'
import client from '../client'
import { JsonForms } from '@jsonforms/react'
import * as ga from '../lib/ga'
import { toast } from 'react-toastify'

export const UpdateUA = () => {
  const connection = new Connection(clusterApiUrl('mainnet-beta'))
  const wallet = useWallet()
  const [loading, setLoading] = useState<boolean>(false)
  const initData = { newUpdateAuthority: wallet.publicKey?.toBase58(), nft: '', allOrOne: "Update One" }
  const [data, setData] = useState<any>(initData)
  const [nfts, setNfts] = useState<any[]>([])
  const [lists, setLists] = useState<any[]>([])
  const [schema, setSchema] = useState<object>({})
  
  const GET_NFTS = gql`
    query GetNfts($owners: [PublicKey!], $updateAuthorities: [PublicKey!], $limit: Int!, $offset: Int!) {
      nfts(owners: $owners, updateAuthorities: $updateAuthorities, limit: $limit, offset: $offset) {
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
          updateAuthorities: [wallet.publicKey?.toBase58()],
          offset: 0,
          limit: 10000
        }
      })
      .then(res => {
        var mapResult = res.data.nfts.map((n: Nft) => {
          return { const: n.mintAddress, title: n.name }
        }, {})
        setNfts(mapResult)
        setSchema({
          type: 'object',
          properties: {
            newUpdateAuthority: {
              type: 'string'
            },
            nft: {
              type: 'string',
              title: 'Nft',
              oneOf: mapResult
            },
            
            allOrOne: {
              type: "string",
              enum: [
                "Update One",
                "Update All",
              ]
          },
          },
          required: ['uri']
        })
        console.log(mapResult)
      })
  } else {
    setNfts([])
    setSchema({
      type: 'object',
      properties: {
        newUpdateAuthority: {
          type: 'string'
        },
        nft: {
          type: 'string',
          title: 'Nft',
          enum: []
        },
        allOrOne: {
          type: "string",
          enum: [
            "Update One",
            "Update All",
          ]
      },
      },
      required: ['uri']
    })
  }
}, [wallet, GET_NFTS])

  const updateIt = async () => {
    console.log(data)


    if (data.newUpdateAuthority == ''){
      alert('update authority address needed')
      return
    }

    
    if (!data.allOrOne){
      alert('select one the box')
      return
    }


    if(data.allOrOne == "Update One" && data.nft == ""){
      alert('mint hash needed')
      return
    }


    setLoading(true)
    try {
      const metaplex = Metaplex.make(connection).use(
        walletAdapterIdentity(wallet)
      )

      console.log(data)

      if (data.allOrOne == "Update All"){
        console.log("update all")
        for (var i=0;i < nfts.length; i++){
          const nftPk = new PublicKey(nfts[i].const)
          console.log("nft: ", nftPk.toBase58())
          
          const nft = await metaplex.nfts().findByMint(nftPk).run()
          const newNft = await metaplex
            .nfts()
            .update(nft, {newUpdateAuthority: new PublicKey(data.newUpdateAuthority) })
            .run()
            toast(`updated: ${newNft.nft.mintAddress}`)
        }
        ga.event({action: 'update_ua',
        params: { mint: nfts[i].mintAddress }})
        toast(`done, updated: ${nfts[i].mintAddress}`)
        setLoading(false)
        return // Done
      }

      if (data.allOrOne == "Update One"){
        console.log("update one")
        const nftPk = new PublicKey(data.nft)
        console.log("nft: ", nftPk.toBase58())
        
        const nft = await metaplex.nfts().findByMint(nftPk).run()
        const newNft = await metaplex
          .nfts()
          .update(nft, {newUpdateAuthority: new PublicKey(data.newUpdateAuthority) })
          .run()
          toast(`updated: ${newNft.nft.mintAddress}`)
          ga.event({action: 'update_ua',
        params: { mint: data.nft }})
        toast(`done, updated: ${data.nft}`)
        setLoading(false)
      }
     
    } catch (e: any) {
      alert(`error: ${e.message}`)
      console.error(e.message)
      setLoading(false)
    }
    setLoading(false)
  }

  return (
    <>
      <div className='p-4 border border-dashed rounded-md'>
        <h2>Update Update Authority</h2>
        <JsonForms
          schema={schema}
          data={data}
          renderers={materialRenderers}
          cells={materialCells}
          onChange={({ errors, data }) => setData(data)}
        />

        <Button
          loading={loading}
          onClick={updateIt}
          className='btn btn-secondary'
        >
          Update It
        </Button>
      </div>
    </>
  )
}

export default UpdateUA
