import {Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import React from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import idl from './gifportal.json';
import kp from './keypair.json';

const { SystemProgram } = web3;

const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);
const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl('devnet');

const opts = {
  skipPreflight: true,
  preflightCommitment: 'processed'
}

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;


const App = () => {
  const [wallet, setWallet] = React.useState(null);
  const [gif, setGif] = React.useState('');
  const [gifList, setGifList] = React.useState([]);
  const checkIfWalletIsConneced = async () => {
    try {
      const { solana } = window;
      if(solana && solana.isPhantom) {    
        console.log("Wallet found");
        const phantom = await solana.connect({
          onlyIfTrusted: true
        });
        setWallet(phantom.publicKey.toString());
        console.log('Connected to address:', phantom.publicKey.toString());
      } else {
        alert('Install phantom wallet');
      }
    } catch (error) {
      console.error(error);
    }
  }
  React.useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConneced();
    }
    window.addEventListener('load', onLoad);

    return () => window.removeEventListener('load', onLoad);
  }, [])

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      console.log('Got the account', account);
      setGifList(account.gifList);
    } catch (error) {
      console.log(error);
      setGifList(null);
    }
  }

  React.useEffect(() => {
    if (wallet) {
      console.log('Fetching GIF List .....');
      getGifList();
    }
  }, [wallet])

  const connectWallet = async () => {
    const { solana } = window;
    if(solana && solana.isPhantom) {
      const phantom  = await solana.connect();
      setWallet(phantom.publicKey.toString());
      console.log('Connected to address:', phantom.publicKey.toString());
    }
  }

  const sendGif = async () => {
    if (gif.length > 0) {
      try {
        const provider = getProvider();
        const program = new Program(idl, programID, provider); 
        await program.rpc.addGif(gif, {
          accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
          }
        })
        await getGifList();
        setGif('');
      } catch (error) {
        console.error(error);
      }
    } else {
      alert("Enter GIF link!");
    }
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(connection, window.solana, opts.preflightCommitment);
    return provider;
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [baseAccount]
      });
      console.log('Created a new BaseAccount address: ', baseAccount.publicKey.toString());
      getGifList();
    } catch (error) {
      console.error(error);
    }
  }

  const RenderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className='connected-container'>
          <button className='cta-button submit-gif-button' onClick={createGifAccount}>
            Initialize gif account (one time process)
          </button>
        </div>
      )
    }
    return (
      <div className='connected-container'>
        <form onSubmit={event => {
          event.preventDefault();
          sendGif();
        }}>
          <input type='text' value={gif} onChange={(e) => setGif(e.target.value)} placeholder='Enter gif link' />
          <button type='submit' className='cta-button submit-gif-button'>Submit</button>
        </form>
        <div className='gif-grid'>
          {
            gifList?.map((item, index) => {
              return (
                <div className='gif-item' key={index}>
                  <img src={item.gifLink} alt={item.gifLink} />
                </div>
              )
            })
          }
        </div>
      </div>
    )
  }


  return (
    <div className="App">
      <div className={wallet ? "authed-container" : "container"}>
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {
            !wallet && <button className="cta-button connect-wallet-button" onClick={connectWallet}>Connect Wallet</button>
          }
          {
            wallet && <RenderConnectedContainer />
          }
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
