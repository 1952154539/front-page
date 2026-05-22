import useWallet from './hooks/useWallet'
import useTokenBank from './hooks/useTokenBank'
import WalletConnect from './components/WalletConnect'
import TokenBank from './components/TokenBank'

const ANVIL_CHAIN_ID = 31337

export default function App() {
  const { account, chainId, error: walletError, switching, connect, disconnect, switchToAnvil } = useWallet()
  const bank = useTokenBank(account)

  const needSwitch = account && chainId !== null && chainId !== ANVIL_CHAIN_ID

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
        ) : needSwitch ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold mb-2">网络不匹配</h2>
            <p className="text-gray-400 mb-6">请切换到 Anvil 本地区块链网络 (Chain ID: 31337)</p>
            <button
              onClick={switchToAnvil}
              disabled={switching}
              className="px-8 py-3 rounded-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium text-lg transition-colors"
            >
              {switching ? '切换中...' : '切换网络'}
            </button>
          </div>
        ) : (
          <TokenBank bank={bank} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4 text-center text-gray-600 text-xs">
        TokenBank DApp · Anvil 本地链
      </footer>
    </div>
  )
}
