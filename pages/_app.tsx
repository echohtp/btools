import { ApolloProvider } from '@apollo/client'
import { ApolloClient, gql, InMemoryCache } from '@apollo/client'

import '../styles/globals.css'
// import '../styles/tailwind.css'
import '../styles/main.css'
import type { AppProps } from 'next/app'
import React, { FC, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    LedgerWalletAdapter,
    PhantomWalletAdapter,
    SlopeWalletAdapter,
    SolflareWalletAdapter,
    SolletExtensionWalletAdapter,
    SolletWalletAdapter,
    TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import client from '../client'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

import * as ga from '../lib/ga'
import { ToastContainer } from 'react-toastify'

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

function MyApp({ Component, pageProps }: AppProps) {

    const router = useRouter()
   // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
   const network = WalletAdapterNetwork.Mainnet;

   // You can also provide a custom RPC endpoint.
   const endpoint = useMemo(() => clusterApiUrl(network), [network]);

   // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
   // Only the wallets you configure here will be compiled into your application, and only the dependencies
   // of wallets that your users connect to will be loaded.
   const wallets = useMemo(
       () => [
           new PhantomWalletAdapter(),
           new SlopeWalletAdapter(),
           new SolflareWalletAdapter({ network }),
           new TorusWalletAdapter(),
           new LedgerWalletAdapter(),
           new SolletWalletAdapter({ network }),
           new SolletExtensionWalletAdapter({ network }),
       ],
       [network]
   );

   useEffect(() => {
    const handleRouteChange = (url: string) => {
      ga.pageview(url)
    }
    //When the component is mounted, subscribe to router changes
    //and log those page views
    router.events.on('routeChangeComplete', handleRouteChange)

    // If the component is unmounted, unsubscribe
    // from the event with the `off` method
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return (
    <ApolloProvider client={client}>
    <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
                <ToastContainer/>
                <Component {...pageProps} />
            </WalletModalProvider>
        </WalletProvider>
    </ConnectionProvider>
    </ApolloProvider>
);

}

export default MyApp
