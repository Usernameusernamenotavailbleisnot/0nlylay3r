const { Web3 } = require('web3');
const chalk = require('chalk');
const constants = require('../utils/constants');

function getTimestamp(walletNum = null) {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { hour12: false });
    if (walletNum !== null) {
        return `[${timestamp} - Wallet ${walletNum}]`;
    }
    return `[${timestamp}]`;
}

class SwapManager {
    constructor(privateKey, config = {}) {
        // Default swap configuration
        this.defaultConfig = {
            enable_swap: true,
            swap_count: 3,
            swap_amount: {
                min: 0.00001,
                max: 0.0001
            },
            delay: {
                min: 5,
                max: 30
            },
            gas_price_multiplier: 1.1
        };
        
        // Load configuration, merging with defaults
        this.config = { ...this.defaultConfig, ...config.swap };
        
        // Setup web3 connection to OnlyLayer
        this.rpcUrl = constants.NETWORK.RPC_URL;
        this.web3 = new Web3(this.rpcUrl);
        
        // Contract address and ABI for OnlyLayer DEX
        this.contractAddress = constants.SWAP.CONTRACT_ADDRESS;
        this.contractABI = constants.SWAP.CONTRACT_ABI;
        
        // Setup account
        if (!privateKey.startsWith('0x')) {
            privateKey = '0x' + privateKey;
        }
        this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
        
        this.walletNum = null;
        
        // Add nonce tracking to avoid transaction issues
        this.currentNonce = null;
    }
    
    setWalletNum(num) {
        this.walletNum = num;
    }
    
    // Get the next nonce, considering pending transactions
    async getNonce() {
        if (this.currentNonce === null) {
            // If this is the first transaction, get the nonce from the network
            this.currentNonce = await this.web3.eth.getTransactionCount(this.account.address);
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Initial nonce from network: ${this.currentNonce}`));
        } else {
            // For subsequent transactions, use the tracked nonce
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Using tracked nonce: ${this.currentNonce}`));
        }
        
        return this.currentNonce;
    }
    
    // Update nonce after a transaction is sent
    incrementNonce() {
        if (this.currentNonce !== null) {
            this.currentNonce++;
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Incremented nonce to: ${this.currentNonce}`));
        }
    }
    
    // Swap ETH for tokens - FIXED VERSION
    async swapETHForTokens(swapNumber) {
        try {
            console.log(chalk.blue.bold(`${getTimestamp(this.walletNum)} Performing swap #${swapNumber}...`));
            
            // Create contract instance
            const contract = new this.web3.eth.Contract(
                this.contractABI,
                this.contractAddress
            );
            
            // Generate random amount within configured range
            const min = this.config.swap_amount.min;
            const max = this.config.swap_amount.max;
            const randomAmount = min + Math.random() * (max - min);
            const roundedAmount = parseFloat(randomAmount.toFixed(7));
            
            // Convert to wei
            const amountInWei = this.web3.utils.toWei(roundedAmount.toString(), 'ether');
            
            // Prepare parameters for swap
            // Set amountOutMin very low to avoid failures due to price impact
            const amountOutMin = this.web3.utils.toWei('0', 'ether'); // Set to 0 to accept any output amount
            const path = constants.SWAP.TOKEN_PATH; // Token swap path
            const recipient = this.account.address; // Recipient address
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes deadline
            
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Swapping ${roundedAmount} ETH to tokens`));
            
            // Get nonce
            const nonce = await this.getNonce();
            
            // Get gas price
            const gasPrice = await this.web3.eth.getGasPrice();
            const multiplier = this.config.gas_price_multiplier || 1.1;
            const adjustedGasPrice = (BigInt(gasPrice) * BigInt(Math.floor(multiplier * 100)) / BigInt(100)).toString();
            
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Gas price: ${this.web3.utils.fromWei(gasPrice, 'gwei')} gwei, adjusted to: ${this.web3.utils.fromWei(adjustedGasPrice, 'gwei')} gwei`));
            
            // Use higher gas for swap transactions
            const gasLimit = 500000;
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Using fixed gas limit: ${gasLimit}`));
            
            try {
                // Direct raw transaction approach
                const data = contract.methods.swapExactETHForTokens(
                    amountOutMin,
                    path,
                    recipient,
                    deadline
                ).encodeABI();
                
                // Create transaction
                const tx = {
                    from: this.account.address,
                    to: this.contractAddress,
                    data: data,
                    value: amountInWei.toString(),
                    gas: gasLimit,
                    gasPrice: adjustedGasPrice,
                    nonce: nonce,
                    chainId: constants.NETWORK.CHAIN_ID
                };
                
                // Sign transaction
                console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Signing transaction...`));
                const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.account.privateKey);
                
                // Increment nonce before sending
                this.incrementNonce();
                
                // Send transaction
                console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Sending transaction...`));
                const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
                
                console.log(chalk.green(`${getTimestamp(this.walletNum)} ✓ Swap #${swapNumber} successful! Hash: ${receipt.transactionHash}`));
                console.log(chalk.green(`${getTimestamp(this.walletNum)} ✓ View transaction: ${constants.NETWORK.EXPLORER_URL}/tx/${receipt.transactionHash}`));
                
                return true;
            } catch (txError) {
                console.log(chalk.red(`${getTimestamp(this.walletNum)} ✗ Transaction error: ${txError.message}`));
                
                // Try alternative swap function if available
                console.log(chalk.yellow(`${getTimestamp(this.walletNum)} ⚠ Trying alternative swap function...`));
                
                try {
                    // Some routers use different function names or parameters
                    // Try with swapETHForExactTokens
                    const amountOut = this.web3.utils.toWei('1', 'ether'); // Target amount of output tokens
                    
                    const altData = contract.methods.swapETHForExactTokens(
                        amountOut,
                        path,
                        recipient,
                        deadline
                    ).encodeABI();
                    
                    const altTx = {
                        from: this.account.address,
                        to: this.contractAddress,
                        data: altData,
                        value: amountInWei.toString(),
                        gas: gasLimit,
                        gasPrice: adjustedGasPrice,
                        nonce: nonce,
                        chainId: constants.NETWORK.CHAIN_ID
                    };
                    
                    // Sign and send
                    const altSignedTx = await this.web3.eth.accounts.signTransaction(altTx, this.account.privateKey);
                    const altReceipt = await this.web3.eth.sendSignedTransaction(altSignedTx.rawTransaction);
                    
                    console.log(chalk.green(`${getTimestamp(this.walletNum)} ✓ Alternative swap #${swapNumber} successful! Hash: ${altReceipt.transactionHash}`));
                    console.log(chalk.green(`${getTimestamp(this.walletNum)} ✓ View transaction: ${constants.NETWORK.EXPLORER_URL}/tx/${altReceipt.transactionHash}`));
                    
                    return true;
                } catch (altError) {
                    console.log(chalk.red(`${getTimestamp(this.walletNum)} ✗ Alternative swap also failed: ${altError.message}`));
                    return false;
                }
            }
        } catch (error) {
            console.log(chalk.red(`${getTimestamp(this.walletNum)} ✗ Error in swap #${swapNumber}: ${error.message}`));
            return false;
        }
    }
    
    // Execute all swap operations
    async executeSwapOperations() {
        if (!this.config.enable_swap) {
            console.log(chalk.yellow(`${getTimestamp(this.walletNum)} ⚠ Swap operations disabled in config`));
            return true;
        }
        
        console.log(chalk.blue.bold(`${getTimestamp(this.walletNum)} Starting swap operations...`));
        
        try {
            // Reset nonce tracking at the start of operations
            this.currentNonce = null;
            
            // Get OnlyLayer balance
            const balance = await this.web3.eth.getBalance(this.account.address);
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ OnlyLayer balance: ${this.web3.utils.fromWei(balance, 'ether')} ETH`));
            
            // Check if balance is sufficient for at least one swap
            const minSwapAmount = this.web3.utils.toWei(this.config.swap_amount.min.toString(), 'ether');
            
            if (BigInt(balance) < BigInt(minSwapAmount)) {
                console.log(chalk.yellow(`${getTimestamp(this.walletNum)} ⚠ Insufficient balance for swap operations`));
                return false;
            }
            
            // Determine how many swaps to perform
            const swapCount = this.config.swap_count;
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Will perform ${swapCount} swap operations`));
            
            // Perform swaps
            let successCount = 0;
            for (let i = 1; i <= swapCount; i++) {
                const success = await this.swapETHForTokens(i);
                if (success) successCount++;
                
                // If not the last swap, add delay
                if (i < swapCount) {
                    const minDelay = this.config.delay.min;
                    const maxDelay = this.config.delay.max;
                    const randomDelay = Math.floor(minDelay + Math.random() * (maxDelay - minDelay));
                    
                    console.log(chalk.yellow(`${getTimestamp(this.walletNum)} ⚠ Waiting ${randomDelay} seconds before next swap...`));
                    await new Promise(resolve => setTimeout(resolve, randomDelay * 1000));
                }
            }
            
            console.log(chalk.green(`${getTimestamp(this.walletNum)} ✓ Swap operations completed! (${successCount}/${swapCount} successful)`));
            return true;
        } catch (error) {
            console.log(chalk.red(`${getTimestamp(this.walletNum)} ✗ Error in swap operations: ${error.message}`));
            return false;
        }
    }
}

module.exports = SwapManager;