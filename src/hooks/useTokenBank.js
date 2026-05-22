import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createPublicClient, createWalletClient, custom, http, parseUnits, formatUnits } from 'viem'
import { sepolia, hardhat } from 'viem/chains'

import TokenBankABI from '../abi/TokenBank.json'
import MyTokenABI from '../abi/MyToken.json'

// ========== CONFIGURE THESE ADDRESSES ==========
const TOKEN_BANK_ADDRESS = import.meta.env.VITE_TOKEN_BANK_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'
const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://localhost:8545'
// ==============================================

const isLocalhost = RPC_URL.includes('localhost') || RPC_URL.includes('127.0.0.1')

export default function useTokenBank(account) {
  const [tokenBalance, setTokenBalance] = useState(0n)
  const [depositedBalance, setDepositedBalance] = useState(0n)
  const [totalDeposits, setTotalDeposits] = useState(0n)
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [tokenDecimals, setTokenDecimals] = useState(18)
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState('')
  const [allowance, setAllowance] = useState(0n)
  const fetchRef = useRef(null)

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: isLocalhost ? hardhat : sepolia,
        transport: http(RPC_URL),
      }),
    [],
  )

  const walletClient = useMemo(
    () =>
      account
        ? createWalletClient({
            chain: isLocalhost ? hardhat : sepolia,
            account,
            transport: custom(window.ethereum),
          })
        : null,
    [account],
  )

  const fetchBalances = useCallback(async () => {
    if (!account) return
    try {
      const [bal, dep, total, symbol, decimals, allow] = await Promise.all([
        publicClient.readContract({
          address: TOKEN_ADDRESS,
          abi: MyTokenABI,
          functionName: 'balanceOf',
          args: [account],
          blockTag: 'latest',
        }),
        publicClient.readContract({
          address: TOKEN_BANK_ADDRESS,
          abi: TokenBankABI,
          functionName: 'balances',
          args: [account],
          blockTag: 'latest',
        }),
        publicClient.readContract({
          address: TOKEN_BANK_ADDRESS,
          abi: TokenBankABI,
          functionName: 'totalDeposits',
          blockTag: 'latest',
        }),
        publicClient.readContract({
          address: TOKEN_ADDRESS,
          abi: MyTokenABI,
          functionName: 'symbol',
          blockTag: 'latest',
        }),
        publicClient.readContract({
          address: TOKEN_ADDRESS,
          abi: MyTokenABI,
          functionName: 'decimals',
          blockTag: 'latest',
        }),
        publicClient.readContract({
          address: TOKEN_ADDRESS,
          abi: MyTokenABI,
          functionName: 'allowance',
          args: [account, TOKEN_BANK_ADDRESS],
          blockTag: 'latest',
        }),
      ])
      setTokenBalance(bal)
      setDepositedBalance(dep)
      setTotalDeposits(total)
      setTokenSymbol(symbol)
      setTokenDecimals(Number(decimals))
      setAllowance(allow)
      setError('')
    } catch (err) {
      console.error('fetchBalances error:', err)
      setError('读取链上数据失败: ' + err.message)
    }
  }, [account, publicClient])

  // Keep fetchRef updated so async operations always use latest fetchBalances
  useEffect(() => {
    fetchRef.current = fetchBalances
  }, [fetchBalances])

  // Auto-fetch on account/chain change
  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  const executeWrite = useCallback(
    async (writeFn) => {
      if (!walletClient) return
      setLoading(true)
      setError('')
      setTxHash('')
      try {
        const hash = await writeFn(walletClient)
        setTxHash(hash)
        await publicClient.waitForTransactionReceipt({ hash })
        await fetchRef.current()
      } catch (err) {
        const msg = err.message || ''
        if (msg.includes('User rejected') || msg.includes('User denied')) {
          setError('用户取消了交易')
        } else {
          setError(msg)
        }
      } finally {
        setLoading(false)
      }
    },
    [walletClient, publicClient],
  )

  const approve = useCallback(
    async (amount) => {
      const amountWei = parseUnits(amount, tokenDecimals)
      await executeWrite(
        (wc) =>
          wc.writeContract({
            address: TOKEN_ADDRESS,
            abi: MyTokenABI,
            functionName: 'approve',
            args: [TOKEN_BANK_ADDRESS, amountWei],
          }),
      )
    },
    [tokenDecimals, executeWrite],
  )

  const deposit = useCallback(
    async (amount) => {
      const amountWei = parseUnits(amount, tokenDecimals)
      await executeWrite(
        (wc) =>
          wc.writeContract({
            address: TOKEN_BANK_ADDRESS,
            abi: TokenBankABI,
            functionName: 'deposit',
            args: [amountWei],
          }),
      )
    },
    [tokenDecimals, executeWrite],
  )

  const withdraw = useCallback(
    async (amount) => {
      const amountWei = parseUnits(amount, tokenDecimals)
      await executeWrite(
        (wc) =>
          wc.writeContract({
            address: TOKEN_BANK_ADDRESS,
            abi: TokenBankABI,
            functionName: 'withdraw',
            args: [amountWei],
          }),
      )
    },
    [tokenDecimals, executeWrite],
  )

  const withdrawAll = useCallback(async () => {
    await executeWrite((wc) =>
      wc.writeContract({
        address: TOKEN_BANK_ADDRESS,
        abi: TokenBankABI,
        functionName: 'withdrawAll',
      }),
    )
  }, [executeWrite])

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
    withdrawAll,
    fetchBalances,
    formatBalance,
  }
}
