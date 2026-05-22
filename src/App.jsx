import useWallet from './hooks/useWallet'
import useTokenBank from './hooks/useTokenBank'
import WalletConnect from './components/WalletConnect'
import TokenBank from './components/TokenBank'

export default function App() {
  const { account, chainId, error: walletError, connect, disconnect } = useWallet()
  const bank = useTokenBank(account, chainId)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">TokenBank</h1>
          <WalletConnect
            account={account}
            chainId={chainId}
            error={walletError}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {!account ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏦</div>
            <h2 className="text-2xl font-bold mb-2">欢迎使用 TokenBank</h2>
            <p className="text-gray-400 mb-6">连接钱包以存款和取款</p>
            <button
              onClick={connect}
              className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg transition-colors"
            >
              连接钱包开始
            </button>
          </div>
        ) : (
          <TokenBank bank={bank} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4 text-center text-gray-600 text-xs">
        TokenBank DApp · 请使用 Sepolia 测试网
      </footer>
    </div>
  )
}
