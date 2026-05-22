import { useState, useEffect, useCallback } from 'react'

export default function useWallet() {
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [error, setError] = useState('')

  const updateChain = useCallback(async (ethereum) => {
    try {
      const id = await ethereum.request({ method: 'eth_chainId' })
      setChainId(Number(id))
    } catch {
      // ignore
    }
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

    // Listen for account changes
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        setAccount(accounts[0])
      }
    }
    // Listen for chain changes
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

  return { account, chainId, error, connect, disconnect }
}
