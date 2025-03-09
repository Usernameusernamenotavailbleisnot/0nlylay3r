# 0nlylay3r Network Automation Tool

## Overview

The 0nlylay3r Network Automation Tool is a comprehensive automation solution designed for interacting with the 0nlylay3r Ethereum network and bridging assets from Sepolia. This tool automates various blockchain operations including bridging between Sepolia and 0nlylay3r networks, token swaps, token transfers, smart contract deployment, ERC20 token creation, and NFT collection management.

## Features

- **Bridge Operations**: Automated bridging of ETH between Sepolia and 0nlylay3r networks using SuperBridge
- **Token Swaps**: Swap ETH for OFI tokens on 0nlylay3r DEX
- **Token Transfers**: Self-transfers to keep wallets active and test transaction functionalities
- **Smart Contract Deployment**: Deploy and interact with sample smart contracts
- **ERC20 Token Management**: Create, deploy, mint, and burn custom ERC20 tokens
- **NFT Collection Management**: Create NFT collections, mint NFTs with metadata, and burn tokens
- **Proxy Support**: Rotate through HTTP proxies for distributed operations
- **Gas Price Optimization**: Automatic gas price calculation with retry mechanisms
- **Detailed Logging**: Comprehensive color-coded console output for tracking operations

## Requirements

- Node.js 14.x or higher
- NPM 6.x or higher
- Ethereum wallet private keys with Sepolia ETH

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Usernameusernamenotavailbleisnot/0nlylay3r.git
   cd 0nlylay3r
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Add your private keys to `pk.txt`, one per line:
   ```
   0x1234567890abcdef...
   0x9876543210abcdef...
   ```

4. Optional: Add HTTP proxies to `proxy.txt`, one per line:
   ```
   http://username:password@ip:port
   http://username:password@ip:port
   ```

5. Configure the tool by editing `config.json` (see Configuration section below)

## Configuration

The tool is configured through the `config.json` file. Here's an explanation of the main configuration options:

```json
{
  "enable_transfer": true,          // Enable/disable token transfers
  "enable_contract_deploy": true,   // Enable/disable smart contract deployment
  "gas_price_multiplier": 1.2,      // Gas price multiplier for faster confirmations
  "max_retries": 5,                 // Maximum retry attempts for failed operations
  "base_wait_time": 10,             // Base wait time between retries (seconds)
  "transfer_amount_percentage": 90, // Percentage of balance to transfer in self-transfers

  "contract": {
    "contract_interactions": {
      "enabled": true,              // Enable/disable contract interactions after deployment
      "count": {                    // Number of interactions to perform
        "min": 3,
        "max": 8
      },
      "types": ["setValue", "increment", "decrement", "reset", "contribute"]  // Available interaction types
    }
  },

  "erc20": {
    "enable_erc20": true,           // Enable/disable ERC20 token operations
    "mint_amount": {                // Range for token minting amounts
      "min": 1000000,
      "max": 10000000
    },
    "burn_percentage": 10,          // Percentage of tokens to burn after minting
    "decimals": 18                  // Number of decimals for the ERC20 token
  },

  "nft": {
    "enable_nft": true,             // Enable/disable NFT collection operations
    "mint_count": {                 // Number of NFTs to mint per collection
      "min": 2,
      "max": 5
    },
    "burn_percentage": 20,          // Percentage of NFTs to burn after minting
    "supply": {                     // Range for NFT collection total supply
      "min": 100,
      "max": 500
    }
  },

  "bridge": {
    "enable_sepolia_to_0nlylay3r": true,     // Enable/disable Sepolia to 0nlylay3r bridging
    "enable_0nlylay3r_to_sepolia": true,     // Enable/disable 0nlylay3r to Sepolia bridging
    "sepolia_to_0nlylay3r": {
      "min_amount": 0.01,                    // Minimum amount to bridge (ETH)
      "max_amount": 0.02,                    // Maximum amount to bridge (ETH)
      "wait_for_confirmation": true,         // Wait for bridge confirmation
      "max_wait_time": 300000                // Maximum wait time for confirmation (ms)
    },
    "0nlylay3r_to_sepolia": {
      "min_amount": 0.001,                   // Minimum amount to bridge back (ETH)
      "max_amount": 0.002,                   // Maximum amount to bridge back (ETH)
      "wait_for_confirmation": false         // Don't wait for confirmation (takes days)
    },
    "max_retries": 3                         // Maximum bridge retry attempts
  },

  "swap": {
    "enable_swap": true,                     // Enable/disable token swap operations
    "swap_count": 3,                         // Number of swap operations to perform
    "swap_amount": {
      "min": 0.00001,                        // Minimum amount per swap (ETH)
      "max": 0.0001                          // Maximum amount per swap (ETH)
    },
    "delay": {
      "min": 5,                              // Minimum delay between swaps (seconds)
      "max": 30                              // Maximum delay between swaps (seconds)
    },
    "gas_price_multiplier": 1.1              // Gas price multiplier for swaps
  }
}
```

## Usage

To start the automation tool:

```bash
npm start
```

The tool will process each wallet from the `pk.txt` file, performing the enabled operations in sequence:

1. Bridging ETH between Sepolia and 0nlylay3r networks
2. Swapping ETH for OFI tokens on 0nlylay3r DEX
3. Performing token self-transfers
4. Deploying and interacting with smart contracts
5. Creating, minting, and burning ERC20 tokens
6. Creating NFT collections, minting NFTs, and burning tokens

After processing all wallets, the tool will wait for 8 hours before starting the next cycle.

## File Structure

```
0nlylay3r-automation/
├── index.js                # Main entry point
├── config.json             # Configuration file
├── pk.txt                  # Private keys (one per line)
├── proxy.txt               # Proxies (one per line)
├── package.json            # Node.js dependencies
├── utils/
│   └── constants.js        # Constants and templates
└── src/
    ├── bridge.js           # Bridge between Sepolia and 0nlylay3r
    ├── swap.js             # Token swap on 0nlylay3r DEX
    ├── transfer.js         # Token transfer functionality
    ├── ContractDeployer.js # Smart contract deployment
    ├── ERC20TokenDeployer.js # ERC20 token operations
    └── NFTManager.js       # NFT collection management
```

## How It Works

The tool is modular and each operation is handled by a specialized class:

- **BridgeManager**: Handles bridging ETH between Sepolia and 0nlylay3r networks
- **SwapManager**: Executes token swaps on 0nlylay3r DEX
- **TokenTransfer**: Handles token self-transfers
- **ContractDeployer**: Compiles and deploys smart contracts, then interacts with them
- **ERC20TokenDeployer**: Creates, deploys, mints, and burns ERC20 tokens
- **NFTManager**: Creates, deploys, mints, and burns NFT collections

All operations include:
- Proper nonce management to prevent transaction failures
- Gas price optimization for faster confirmations
- Exponential backoff retry mechanisms for failed operations
- Detailed logging with timestamp and wallet identification

### Common Issues

1. **Bridge Transactions Failing**:
   - Ensure your Sepolia wallet has sufficient funds
   - Check the transaction on Sepolia Explorer
   - Remember that 0nlylay3r to Sepolia withdrawals take several days to complete

2. **Swap Transactions Failing**:
   - Check if the DEX contract address is correct
   - Ensure liquidity exists for the token pair
   - Try increasing the gas limit in the swap.js file

3. **Transaction Errors**:
   - Ensure your wallet has sufficient funds
   - Check if the gas price is appropriate (adjust `gas_price_multiplier`)
   - Increase `max_retries` if network is congested

### Logs

The tool provides detailed color-coded console output:
- 🟢 Green: Successful operations
- 🔴 Red: Errors
- 🟡 Yellow: Warnings/Notices
- 🔵 Blue: Operation headings
- 🔷 Cyan: Informational messages

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This tool is for educational and testing purposes only. Use it responsibly and in accordance with the terms of service of the 0nlylay3r Ethereum Network and any other networks you interact with.
