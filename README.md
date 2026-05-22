# TokenBank Frontend

基于 Viem 构建的 TokenBank 存款/取款前端 DApp。

## 功能

- 连接 MetaMask / OKX 等钱包
- 查看 MyToken (MTK) 余额
- 存入 Token 到 TokenBank 合约
- 从 TokenBank 提取存款
- 查看 Bank 总存款金额

## 技术栈

- **Vite** + **React** — 前端框架
- **Viem** v2 — 以太坊合约交互
- **Tailwind CSS** — 样式

## 合约

- TokenBank: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- MyToken: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

可通过 `.env` 文件自定义合约地址：

```env
VITE_TOKEN_BANK_ADDRESS=0x...
VITE_TOKEN_ADDRESS=0x...
```

## 本地运行

```bash
npm install --registry=https://registry.npmmirror.com
npm run dev
```

## 存款流程

1. 连接钱包，切换到 Sepolia 测试网
2. 确保钱包中有 MTK 代币
3. 输入存款金额，点击「授权」→ 确认交易
4. 授权完成后，点击「存款」→ 确认交易
5. 存款余额实时更新

## 取款流程

1. 切换到「取款」标签
2. 输入取款金额（不能超过存款余额）
3. 点击「取款」→ 确认交易
4. 代币返回钱包，存款余额更新
