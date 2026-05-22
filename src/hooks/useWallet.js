import { useState, useEffect, useCallback } from 'react'

const ANVIL_CHAIN_ID = 31337
const ANVIL_CHAIN = {
  chainId: '0x7A69', // 31337 in hex
  chainName: 'Anvil Local',
  rpcUrls: ['http://localhost:8545'],
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
}

export default function useWallet() {
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [error, setError] = useState('')
  const [switching, setSwitching] = useState(false)

  const updateChain = useCallback(async (ethereum) => {
    try {
      const id = await ethereum.request({ method: 'eth_chainId' })
      setChainId(Number(id))
    } catch {
      // ignore
    }
  }, [])

  const switchToAnvil = useCallback(async () => {
    if (!window.ethereum) return
    setSwitching(true)
    setError('')
    try {
      // Try switching first (fast path if chain already added)
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ANVIL_CHAIN.chainId }],
      })
    } catch (switchErr) {
      // 4902 = chain not added yet, add it
      if (switchErr.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [ANVIL_CHAIN],
          })
        } catch (addErr) {
          setError('添加网络失败: ' + addErr.message)
          setSwitching(false)
          return
        }
      } else {
        setError('切换网络失败: ' + switchErr.message)
        setSwitching(false)
        return
      }
    }
    setChainId(ANVIL_CHAIN_ID)
    setSwitching(false)
  }, [])

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('请安装 MetaMask 或 OKX 钱包')
      return
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAccount(accounts[0])
      setError('')
      await updateChain(window.ethereum)
    } catch (err) {
      if (err.code === 4001) {
        setError('用户拒绝了连接请求')
      } else {
        setError('连接钱包失败: ' + err.message)
      }
    }
  }, [updateChain])

  const disconnect = useCallback(() => {
    setAccount(null)
    setChainId(null)
  }, [])

  useEffect(() => {
    const { ethereum } = window
    if (!ethereum) return

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        setAccount(accounts[0])
      }
    }
    const handleChainChanged = (id) => {
      setChainId(Number(id))
    }

    ethereum.on('accountsChanged', handleAccountsChanged)
    ethereum.on('chainChanged', handleChainChanged)

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged)
      ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [disconnect])

  return { account, chainId, error, switching, connect, disconnect, switchToAnvil }
}
