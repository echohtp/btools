import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui'

import Link from 'next/link';
import { useState } from 'react';

export const Navbar = (props) => {
  const [active, setActive] = useState(false);

  const handleClick = () => {
    setActive(!active);
  };

  return (
    
      <nav className='flex flex-wrap items-center p-3 '>
        <Link href='/'>
          <a className='inline-flex items-center p-2 mr-4 '>
            <span>🍌</span>
            <span className='text-xl font-bold tracking-wide '>
              tools
            </span>
          </a>
        </Link>
        <Link href='multisend'>
            <button className='font-bold tracking-wide uppercase'>
              Multi Send
            </button>
        </Link>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <Link href='txbuilder'>
            <button className='font-bold tracking-wide uppercase'>
              TX Builder
            </button>
        </Link>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <Link href='gatedentry'>
            <button className='font-bold tracking-wide uppercase'>
              Gated Entry
            </button>
        </Link>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <Link href='minthash'>
            <button className='font-bold tracking-wide uppercase'>
              Mint Hash Getter
            </button>
        </Link>
        <button
          className='inline-flex p-3 ml-auto rounded outline-none lg:hidden'
          onClick={handleClick}
        >
          <svg
            className='w-6 h-6'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 6h16M4 12h16M4 18h16'
            />
          </svg>
        </button>
        {/*Note that in this div we will use a ternary operator to decide whether or not to display the content of the div  */}
        <div
          className={`${
            active ? '' : 'hidden'
          }   w-full lg:inline-flex lg:flex-grow lg:w-auto`}
        >
          <div className='flex flex-col items-start w-full lg:inline-flex lg:flex-row lg:ml-auto lg:w-auto lg:items-center lg:h-auto'>

          {props.sending && 
          <div className='inline-block mr-4 border border-gray-400 rounded-lg indicator'>
                {props.sending.length > 0 && (
                  <span className='indicator-item badge badge-secondary'>
                    {props.sending.length}
                  </span>
                )}
                <div className=''>
                  {' '}
                  <label
                    htmlFor='my-drawer'
                    className='bg-white rounded-lg btn-ghost w-14 btn'
                  >
                    <span>🛒</span>
                  </label>
                </div>
              </div>
            }

          <div className="bg-black"><WalletMultiButton /></div>
          </div>
        </div>
      </nav>
    
  );
};
