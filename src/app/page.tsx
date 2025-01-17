"use client"
import React, { useState, useEffect } from 'react';
import Onboard from '@web3-onboard/core'
import injectedModule from '@web3-onboard/injected-wallets'
import { ethers } from 'ethers'




const WalletConnect = () => {
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('');
  const [chainId, setChainId] = useState('');
  const [error, setError] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState(null);
  const [provider, setProvider] = useState<any>(null)
  const [flowWalletProvider, setFlowWalletProvider] = useState(null)

  const setupEventListeners = () => {
    // 监听钱包公告事件
    window.addEventListener(
      'eip6963:announceProvider',
      ((event: CustomEvent) => {
        const { info, provider } = event.detail;
        console.log('Wallet announced:', info.name);
        if (info.rdns == 'com.flowfoundation.wallet') {
          setFlowWalletProvider(provider)
        }

      }) as EventListener
    );
  }


  useEffect(() => {
    setupEventListeners()
  }, [])




  // connect wallet
  const connectWallet = async () => {
    try {
      const injected = injectedModule()

      const onboard = Onboard({
        wallets: [injected],
        chains: [
          {
            id: '747',
            token: 'FLOW',
            label: 'Flow EVM Mainnet',
            rpcUrl: 'https://mainnet.evm.nodes.onflow.org'
          },
          {
            id: '545',
            token: 'FLOW',
            label: 'Flow EVM Testnet',
            rpcUrl: 'https://testnet.evm.nodes.onflow.org'
          }
        ]
      })
      const wallets = await onboard.connectWallet()
      console.log(wallets)

      if (wallets[0]) {
        //@ts-ignore
        setAccount(wallets[0].address)
        // create an ethers provider with the last connected wallet provider
        const ethersProvider = new ethers.BrowserProvider(flowWalletProvider!)
        setProvider(ethersProvider)

        // request user to connect wallet
        const { address } = wallets[0].accounts[0]

        const chainId = wallets[0].chains[0].id
        const balance = await ethersProvider.getBalance(address)

        setAccount(address);
        setChainId(parseInt(chainId).toString());
        setBalance(ethers.formatEther(balance).toString());
        setError('');
      }
    } catch (err: any) {
      setError('Connect wallet failed:' + err.message);
    }
  };





  // send transaction
  const sendTransaction = async (to: string, amount: string) => {
    try {
      // const wallets = await onboard.connectWallet()

      // const ethersProvider = new ethers.BrowserProvider(wallets[0].provider, 'any')

      const signer = await provider.getSigner()

      const txn = await signer.sendTransaction({
        to: to,
        value: ethers.parseEther(amount)
      })

      const receipt = await txn.wait()
      console.log(receipt)
      return receipt

    } catch (err: any) {
      setError('Send transaction failed:' + err.message);
    }
  };



  const signMessage = async (message: string) => {
    try {

      const signer = await provider.getSigner()
      const signature = await signer.signMessage(message)
      setSignature(signature);

      return signature
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  return (
    <div>
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p>Address：{account}</p>
          <p>Balance：{balance} FLOW</p>
          <p>Chain ID: {chainId}</p>


          <div>
            <input type="text" placeholder="Enter the recipient address" onChange={e => setToAddress(e.target.value)} />
            <br />
            <button onClick={() => sendTransaction(toAddress, '0.01')}>
              send 0.01 FLOW to {toAddress}
            </button>
          </div>

          <div>
            <input type="text" placeholder="Enter the message to sign" onChange={e => setMessage(e.target.value)} />
            <br />
            <button onClick={() => signMessage(message)}>
              Sign Message
            </button>
            <br />
            <p>Signature: {JSON.stringify(signature)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;