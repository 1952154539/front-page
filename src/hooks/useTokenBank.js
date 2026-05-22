import { useState, useEffect, useCallback } from 'react'
import { createPublicClient, createWalletClient, custom, http, parseUnits, formatUnits } from 'viem'

import TokenBankABI from '../abi/TokenBank.json'
import MyTokenABI from '../abi/MyToken.json'

// ========== CONFIGURE THESE ADDRESSES ==========
const TOKEN_BANK_ADDRESS = import.meta.env.VITE_TOKEN_BANK_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'
const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
// ==============================================

export default function useTokenBank(account, chainId) {
  const [tokenBalance, setTokenBalance] = useState(0n)
  const [depositedBalance, setDepositedBalance] = useState(0n)
  const [totalDeposits, setTotalDeposits] = useState(0n)
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [tokenDecimals, setTokenDecimals] = useState(18)
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState('')
  const [allowance, setAllowance] = useState(0n)

  const publicClient = createPublicClient({
    transport: http(),
  })

  const walletClient = account
    ? createWalletClient({
        account,
        transport: custom(window.ethereum),
      })
    : null

  const fetchBalances = useCallback(async () => {
    if (!account) return
    try {
      const [bal, dep, total, symbol, decimals, allow] = await Promise.all([
        publicClient.readContract({
          address: TOKEN_ADDRESS,
          abi: MyTokenABI,
          functionName: 'balanceOf',
          args: [account],
        }),
        publicClient.readContract({
          address: TOKEN_BANK_ADDRESS,
          abi: TokenBankABI,
          functionName: 'balances',
          args: [account],
        }),
        publicClient.readContract({
          address: TOKEN_BANK_ADDRESS,
          abi: TokenBankABI,
          functionName: 'totalDeposits',
        }),
        publicClient.readContract({
          address: TOKEN_ADDRESS,
          abi: MyTokenABI,
          functionName: 'symbol',
        }),
        publicClient.readContract({
          address: TOKEN_ADDRESS,
          abi: MyTokenABI,
          functionName: 'decimals',
        }),
        publicClient.readContract({
          address: TOKEN_ADDRESS,
          abi: MyTokenABI,
          functionName: 'allowance',
          args: [account, TOKEN_BANK_ADDRESS],
        }),
      ])
      setTokenBalance(bal)
      setDepositedBalance(dep)
      setTotalDeposits(total)
      setTokenSymbol(symbol)
      setTokenDecimals(decimals)
      setAllowance(allow)
      setError('')
    } catch (err) {
      setError('读取链上数据失败: ' + err.message)
    }
  }, [account, publicClient])

  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  const approve = useCallback(
    async (amount) => {
      if (!walletClient) return
      setLoading(true)
      setError('')
      setTxHash('')
      try {
        const amountWei = parseUnits(amount, tokenDecimals)
        const hash = await walletClient.writeContract({
          address: TOKEN_ADDRESS,
          abi: MyTokenABI,
          functionName: 'approve',
          args: [TOKEN_BANK_ADDRESS, amountWei],
        })
        setTxHash(hash)
        await publicClient.waitForTransactionReceipt({ hash })
        await fetchBalances()
      } catch (err) {
        if (err.message.includes('User rejected') || err.message.includes('User denied')) {
          setError('用户取消了交易')
        } else {
          setError('授权失败: ' + err.message)
        }
      } finally {
        setLoading(false)
      }
    },
    [walletClient, tokenDecimals, publicClient, fetchBalances],
  )

  const deposit = useCallback(
    async (amount) => {
      if (!walletClient) return
      setLoading(true)
      setError('')
      setTxHash('')
      try {
        const amountWei = parseUnits(amount, tokenDecimals)
        const hash = await walletClient.writeContract({
          address: TOKEN_BANK_ADDRESS,
          abi: TokenBankABI,
          functionName: 'deposit',
          args: [amountWei],
        })
        setTxHash(hash)
        await publicClient.waitForTransactionReceipt({ hash })
        await fetchBalances()
      } catch (err) {
        if (err.message.includes('User rejected') || err.message.includes('User denied')) {
          setError('用户取消了交易')
        } else {
          setError('存款失败: ' + err.message)
        }
      } finally {
        setLoading(false)
      }
    },
    [walletClient, tokenDecimals, publicClient, fetchBalances],
  )

  const withdraw = useCallback(
    async (amount) => {
      if (!walletClient) return
      setLoading(true)
      setError('')
      setTxHash('')
      try {
        const amountWei = parseUnits(amount, tokenDecimals)
        const hash = await walletClient.writeContract({
          address: TOKEN_BANK_ADDRESS,
          abi: TokenBankABI,
          functionName: 'withdraw',
          args: [amountWei],
        })
        setTxHash(hash)
        await publicClient.waitForTransactionReceipt({ hash })
        await fetchBalances()
      } catch (err) {
        if (err.message.includes('User rejected') || err.message.includes('User denied')) {
          setError('用户取消了交易')
        } else {
          setError('取款失败: ' + err.message)
        }
      } finally {
        setLoading(false)
      }
    },
    [walletClient, tokenDecimals, publicClient, fetchBalances],
  )

  const formatBalance = useCallback(
    (wei) => formatUnits(wei, tokenDecimals),
    [tokenDecimals],
  )

  return {
    tokenBalance,
    depositedBalance,
    totalDeposits,
    tokenSymbol,
    tokenDecimals,
    allowance,
    loading,
    txHash,
    error,
    approve,
    deposit,
    withdraw,
    fetchBalances,
    formatBalance,
  }
}
