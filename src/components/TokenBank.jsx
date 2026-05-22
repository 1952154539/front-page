import { useState } from 'react'

export default function TokenBank({ bank }) {
  const [amount, setAmount] = useState('')
  const [tab, setTab] = useState('deposit') // 'deposit' | 'withdraw'

  const {
    tokenBalance,
    depositedBalance,
    totalDeposits,
    tokenSymbol,
    allowance,
    loading,
    txHash,
    error,
    approve,
    deposit,
    withdraw,
    fetchBalances,
    formatBalance,
  } = bank

  const handleApprove = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    await approve(amount)
  }

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    await deposit(amount)
    setAmount('')
  }

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    await withdraw(amount)
    setAmount('')
  }

  const amountWei = amount ? (() => { try { return BigInt(Math.floor(parseFloat(amount) * 10 ** 18)) } catch { return 0n } })() : 0n
  const needApproval = tab === 'deposit' && amountWei > 0n && allowance < amountWei

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {/* Balances */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="text-gray-400 text-sm mb-1">钱包余额</div>
          <div className="text-2xl font-bold text-white">
            {formatBalance(tokenBalance)} <span className="text-sm text-gray-400">{tokenSymbol}</span>
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="text-gray-400 text-sm mb-1">存款余额</div>
          <div className="text-2xl font-bold text-green-400">
            {formatBalance(depositedBalance)} <span className="text-sm text-gray-400">{tokenSymbol}</span>
          </div>
        </div>
      </div>

      {/* Total deposits */}
      <div className="bg-gray-800/30 rounded-lg p-3 text-center border border-gray-700/30">
        <span className="text-gray-500 text-sm">Bank 总存款: </span>
        <span className="text-white font-medium">
          {formatBalance(totalDeposits)} {tokenSymbol}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => { setTab('deposit'); setAmount('') }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'deposit' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          存款
        </button>
        <button
          onClick={() => { setTab('withdraw'); setAmount('') }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'withdraw' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          取款
        </button>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <div>
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={tab === 'deposit' ? '输入存款金额' : '输入取款金额'}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            disabled={loading}
          />
          {tab === 'deposit' && (
            <p className="text-gray-500 text-xs mt-1">
              钱包余额: {formatBalance(tokenBalance)} {tokenSymbol}
            </p>
          )}
          {tab === 'withdraw' && (
            <p className="text-gray-500 text-xs mt-1">
              可提取: {formatBalance(depositedBalance)} {tokenSymbol}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {tab === 'deposit' && (
          <div className="flex gap-2">
            {needApproval && (
              <button
                onClick={handleApprove}
                disabled={loading || !amount}
                className="flex-1 py-3 rounded-lg bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium transition-colors"
              >
                {loading ? '处理中...' : '1. 授权'}
              </button>
            )}
            <button
              onClick={handleDeposit}
              disabled={loading || !amount || needApproval}
              className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium transition-colors"
            >
              {loading ? '处理中...' : needApproval ? '2. 存款' : '存款'}
            </button>
          </div>
        )}

        {tab === 'withdraw' && (
          <button
            onClick={handleWithdraw}
            disabled={loading || !amount}
            className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium transition-colors"
          >
            {loading ? '处理中...' : '取款'}
          </button>
        )}
      </div>

      {/* Transaction link */}
      {txHash && (
        <div className="text-center text-sm">
          <span className="text-gray-400">交易已发送: </span>
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 break-all font-mono"
          >
            {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </a>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Refresh */}
      <button
        onClick={fetchBalances}
        className="w-full py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
      >
        刷新余额
      </button>
    </div>
  )
}
