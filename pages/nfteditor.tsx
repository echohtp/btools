import { NextPage } from 'next'
import Head from 'next/head'
import { Navbar } from '../components/navbar'
import { useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey , Connection, clusterApiUrl} from '@solana/web3.js'
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
import { Metaplex, Nft } from "@metaplex-foundation/js-next";
import styles from "../styles/Home.module.css";


enum transactionState {
  NONE,
  SENDING,
  DONE
}

const NFTEditor: NextPage = () => {
  const { publicKey, signTransaction, connected } = useWallet()
  const conn = new Connection(clusterApiUrl("mainnet-beta"));

  const mx = Metaplex.make(conn);

  const [address, setAddress] = useState(
    "An3At62iswbrQgNxMnZFkwc3Nhh1kcGy2u7h4rEE2d3d"
  );
  const [nft, setNft] = useState<Nft[]>([]);
  const fetchNft = async () => {
    const nft = await mx.nfts().printNewEdition(new PublicKey(address));
    // setNft(nft);
  };

  
  const [nfts, setNfts] = useState<Nft[]>([])
  
  const [txState, setTxState] = useState<transactionState>(
    transactionState.NONE
  )

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
    }
  }, [publicKey?.toBase58()])

  return (
    <div>
      <Head>
        <title>NFT Editor</title>
        <meta name='description' content='Edit your NFTs!' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Navbar />

      <div className='container pl-4'>
      <h1 className={styles.title}>NFT Mint Address</h1>
          <div className={styles.nftForm}>
            <input
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
            <button onClick={fetchNft}>Fetch</button>
          </div>
          {
          nft.map((n)=>(
            <div className={styles.nftPreview}>
              <h1>{n.name}</h1>
            </div>
          ))}
      </div>

      <footer></footer>
    </div>
  )
}

export default NFTEditor
