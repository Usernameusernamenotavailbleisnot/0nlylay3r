const { Web3 } = require('web3');
const axios = require('axios');
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

class BridgeManager {
    constructor(privateKey, config = {}) {
        // Default bridge configuration
        this.defaultConfig = {
            enable_sepolia_to_onlylayer: true,
            enable_onlylayer_to_sepolia: true,
            sepolia_to_onlylayer: {
                min_amount: 0.01,
                max_amount: 0.02,
                wait_for_confirmation: true,
                max_wait_time: 300000
            },
            onlylayer_to_sepolia: {
                min_amount: 0.001,
                max_amount: 0.002,
                wait_for_confirmation: false
            },
            max_retries: 3
        };
        
        // Load configuration
        this.config = { ...this.defaultConfig, ...config.bridge };
        
        // Setup web3 connections
        this.sepoliaWeb3 = new Web3(constants.BRIDGE.SEPOLIA.RPC_URL);
        this.onlyLayerWeb3 = new Web3(constants.NETWORK.RPC_URL);
        
        // Setup account
        if (!privateKey.startsWith('0x')) {
            privateKey = '0x' + privateKey;
        }
        this.sepoliaAccount = this.sepoliaWeb3.eth.accounts.privateKeyToAccount(privateKey);
        this.onlyLayerAccount = this.onlyLayerWeb3.eth.accounts.privateKeyToAccount(privateKey);
        
        this.walletNum = null;
        
        // Add nonce tracking to avoid transaction issues
        this.sepoliaNonce = null;
        this.onlyLayerNonce = null;
    }
    
    setWalletNum(num) {
        this.walletNum = num;
    }
    
    // Get the next nonce for Sepolia
    async getSepoliaNonce() {
        if (this.sepoliaNonce === null) {
            this.sepoliaNonce = await this.sepoliaWeb3.eth.getTransactionCount(this.sepoliaAccount.address);
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Initial Sepolia nonce: ${this.sepoliaNonce}`));
        } else {
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Using tracked Sepolia nonce: ${this.sepoliaNonce}`));
        }
        return this.sepoliaNonce;
    }
    
    // Update nonce after a Sepolia transaction is sent
    incrementSepoliaNonce() {
        if (this.sepoliaNonce !== null) {
            this.sepoliaNonce++;
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Incremented Sepolia nonce to: ${this.sepoliaNonce}`));
        }
    }
    
    // Get the next nonce for OnlyLayer
    async getOnlyLayerNonce() {
        if (this.onlyLayerNonce === null) {
            this.onlyLayerNonce = await this.onlyLayerWeb3.eth.getTransactionCount(this.onlyLayerAccount.address);
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Initial OnlyLayer nonce: ${this.onlyLayerNonce}`));
        } else {
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Using tracked OnlyLayer nonce: ${this.onlyLayerNonce}`));
        }
        return this.onlyLayerNonce;
    }
    
    // Update nonce after an OnlyLayer transaction is sent
    incrementOnlyLayerNonce() {
        if (this.onlyLayerNonce !== null) {
            this.onlyLayerNonce++;
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Incremented OnlyLayer nonce to: ${this.onlyLayerNonce}`));
        }
    }
    
    // Get gas price for Sepolia
    async getSepoliaGasPrice() {
        try {
            const gasPrice = await this.sepoliaWeb3.eth.getGasPrice();
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Sepolia gas price: ${this.sepoliaWeb3.utils.fromWei(gasPrice, 'gwei')} gwei`));
            return gasPrice.toString(); // Return as string to avoid BigInt serialization issues
        } catch (error) {
            console.log(chalk.yellow(`${getTimestamp(this.walletNum)} ⚠ Error getting Sepolia gas price: ${error.message}`));
            const fallbackGasPrice = this.sepoliaWeb3.utils.toWei('10', 'gwei');
            return fallbackGasPrice.toString(); // Return as string
        }
    }
    
    // Get gas price for OnlyLayer
    async getOnlyLayerGasPrice() {
        try {
            const gasPrice = await this.onlyLayerWeb3.eth.getGasPrice();
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ OnlyLayer gas price: ${this.onlyLayerWeb3.utils.fromWei(gasPrice, 'gwei')} gwei`));
            return gasPrice.toString(); // Return as string to avoid BigInt serialization issues
        } catch (error) {
            console.log(chalk.yellow(`${getTimestamp(this.walletNum)} ⚠ Error getting OnlyLayer gas price: ${error.message}`));
            const fallbackGasPrice = this.onlyLayerWeb3.utils.toWei('0.001', 'gwei');
            return fallbackGasPrice.toString(); // Return as string
        }
    }
    
    // Get bridge route from API
    async getBridgeRoute(fromChainId, toChainId, amount) {
        try {
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Fetching bridge route from chain ${fromChainId} to ${toChainId}...`));
            
            // Always get current gas prices from RPC endpoints
            let fromGasPrice, toGasPrice;
            
            if (fromChainId === constants.BRIDGE.SEPOLIA.CHAIN_ID) {
                // For Sepolia to OnlyLayer
                const sepoliaGasPrice = await this.sepoliaWeb3.eth.getGasPrice();
                fromGasPrice = sepoliaGasPrice.toString();
                console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Sepolia gas price: ${this.sepoliaWeb3.utils.fromWei(fromGasPrice, 'gwei')} gwei`));
                
                const onlyLayerGasPrice = await this.onlyLayerWeb3.eth.getGasPrice();
                toGasPrice = onlyLayerGasPrice.toString();
                console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ OnlyLayer gas price: ${this.onlyLayerWeb3.utils.fromWei(toGasPrice, 'gwei')} gwei`));
            } else {
                // For OnlyLayer to Sepolia
                const onlyLayerGasPrice = await this.onlyLayerWeb3.eth.getGasPrice();
                fromGasPrice = onlyLayerGasPrice.toString();
                console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ OnlyLayer gas price: ${this.onlyLayerWeb3.utils.fromWei(fromGasPrice, 'gwei')} gwei`));
                
                const sepoliaGasPrice = await this.sepoliaWeb3.eth.getGasPrice();
                toGasPrice = sepoliaGasPrice.toString();
                console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Sepolia gas price: ${this.sepoliaWeb3.utils.fromWei(toGasPrice, 'gwei')} gwei`));
            }
            
            // API request body
            const requestBody = {
                host: "only-layer-dxypre7nhx-2ded73e84a7ab687.testnets.rollbridge.app",
                amount: amount.toString(),
                fromChainId: fromChainId.toString(),
                toChainId: toChainId.toString(),
                fromTokenAddress: "0x0000000000000000000000000000000000000000",
                toTokenAddress: "0x0000000000000000000000000000000000000000",
                fromTokenDecimals: 18,
                toTokenDecimals: 18,
                fromGasPrice: fromGasPrice,
                toGasPrice: toGasPrice,
                graffiti: constants.BRIDGE.GRAFFITI,
                recipient: this.sepoliaAccount.address,
                sender: this.sepoliaAccount.address,
                forceViaL1: false
            };
            
            // Required headers for the bridge API
            const headers = {
                'accept': 'application/json, text/plain, */*',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'en-US,en;q=0.6',
                'content-type': 'application/json',
                'dnt': '1',
                'origin': 'https://only-layer-dxypre7nhx-2ded73e84a7ab687.testnets.rollbridge.app',
                'priority': 'u=1, i',
                'referer': 'https://only-layer-dxypre7nhx-2ded73e84a7ab687.testnets.rollbridge.app/',
                'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Brave";v="134"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'sec-gpc': '1',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
            };
            
            // Log the request body for debugging
           // console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ API Request Body:`), {
           // //    amount: requestBody.amount,
            //    fromChainId: requestBody.fromChainId,
           //     toChainId: requestBody.toChainId,
            //    fromGasPrice: requestBody.fromGasPrice,
            //    toGasPrice: requestBody.toGasPrice
           // });
            
            // Make API request with the required headers
            const response = await axios.post(constants.BRIDGE.API_URL, requestBody, { headers });
            
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Received bridge route response`));
            
            if (response.status === 200 && response.data && response.data.results && response.data.results.length > 0) {
                return response.data.results[0];
            } else {
                throw new Error(`Invalid API response: ${JSON.stringify(response.data)}`);
            }
        } catch (error) {
            console.log(chalk.red(`${getTimestamp(this.walletNum)} ✗ Error fetching bridge route: ${error.message}`));
            throw error;
        }
    }
    
    // Bridge from Sepolia to OnlyLayer
    async bridgeSepoliaToOnlyLayer() {
        if (!this.config.enable_sepolia_to_onlylayer) {
            console.log(chalk.yellow(`${getTimestamp(this.walletNum)} ⚠ Sepolia to OnlyLayer bridge disabled in config`));
            return false;
        }
        
        try {
            console.log(chalk.blue.bold(`${getTimestamp(this.walletNum)} Starting Sepolia to OnlyLayer bridge...`));
            
            // Get Sepolia balance
            const balance = await this.sepoliaWeb3.eth.getBalance(this.sepoliaAccount.address);
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Sepolia balance: ${this.sepoliaWeb3.utils.fromWei(balance, 'ether')} ETH`));
            
            if (BigInt(balance) <= BigInt(0)) {
                console.log(chalk.yellow(`${getTimestamp(this.walletNum)} ⚠ No Sepolia ETH to bridge`));
                return false;
            }
            
            // Determine amount to bridge
            const minAmount = this.sepoliaWeb3.utils.toWei(this.config.sepolia_to_onlylayer.min_amount.toString(), 'ether');
            const maxAmount = this.sepoliaWeb3.utils.toWei(this.config.sepolia_to_onlylayer.max_amount.toString(), 'ether');
            
            // Check if balance is enough for minimum amount
            if (BigInt(balance) < BigInt(minAmount)) {
                console.log(chalk.yellow(`${getTimestamp(this.walletNum)} ⚠ Sepolia balance below minimum bridge amount`));
                return false;
            }
            
            // Calculate amount to bridge (between min and max)
            let amountToBridge;
            if (BigInt(balance) > BigInt(maxAmount)) {
                amountToBridge = maxAmount;
            } else {
                amountToBridge = BigInt(balance) > BigInt(minAmount) ? balance : minAmount;
            }
            
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Will bridge ${this.sepoliaWeb3.utils.fromWei(amountToBridge.toString(), 'ether')} ETH from Sepolia to OnlyLayer`));
            
            // Get bridge route from API
            const route = await this.getBridgeRoute(
                constants.BRIDGE.SEPOLIA.CHAIN_ID,
                constants.NETWORK.CHAIN_ID,
                amountToBridge.toString()
            );
            
            if (!route || !route.result || !route.result.initiatingTransaction) {
                throw new Error("Invalid bridge route response");
            }
            
            // Extract transaction details
            const txData = route.result.initiatingTransaction;
            
            // Get nonce
            const nonce = await this.getSepoliaNonce();
            
            // Get current gas price and apply multiplier - directly from RPC
            const rawGasPrice = await this.sepoliaWeb3.eth.getGasPrice();
            const multiplier = this.config.gas_price_multiplier || 1.1;
            const adjustedGasPrice = (BigInt(rawGasPrice) * BigInt(Math.floor(multiplier * 100)) / BigInt(100)).toString();
            
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Sepolia gas price: ${this.sepoliaWeb3.utils.fromWei(rawGasPrice, 'gwei')} gwei, adjusted to: ${this.sepoliaWeb3.utils.fromWei(adjustedGasPrice, 'gwei')} gwei`));
            
            // Prepare transaction with all values as strings or numbers (not BigInt)
            const tx = {
                from: this.sepoliaAccount.address,
                to: txData.to,
                data: txData.data,
                value: txData.value.toString(), // Convert to string
                nonce: nonce,
                chainId: parseInt(txData.chainId),
                gasPrice: adjustedGasPrice // String from calculation above
            };
            
            // Estimate gas
            try {
                const estimatedGas = await this.sepoliaWeb3.eth.estimateGas({
                    from: tx.from,
                    to: tx.to,
                    data: tx.data,
                    value: tx.value
                });
                tx.gas = Math.floor(Number(estimatedGas) * 1.5); // Add 50% buffer like in your example
                console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Estimated gas: ${estimatedGas}, with buffer: ${tx.gas}`));
            } catch (error) {
                console.log(chalk.yellow(`${getTimestamp(this.walletNum)} ⚠ Gas estimation failed: ${error.message}, using default gas limit`));
                tx.gas = 200000; // Default gas limit
            }
            
            // Log transaction details, carefully converting any potential BigInt values to strings
            //console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Transaction details:`), {
            //    to: tx.to,
            //    value: tx.value,
            //    gasPrice: tx.gasPrice,
            //    gas: tx.gas,
            //    nonce: tx.nonce,
            //    chainId: tx.chainId
            //});
            
            // Sign transaction
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Signing transaction...`));
            const signedTx = await this.sepoliaWeb3.eth.accounts.signTransaction(tx, this.sepoliaAccount.privateKey);
            
            // Increment nonce before sending
            this.incrementSepoliaNonce();
            
            // Send transaction
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Sending transaction...`));
            const receipt = await this.sepoliaWeb3.eth.sendSignedTransaction(signedTx.rawTransaction);
            
            console.log(chalk.green(`${getTimestamp(this.walletNum)} ✓ Bridge transaction sent: ${receipt.transactionHash}`));
            console.log(chalk.green(`${getTimestamp(this.walletNum)} ✓ View transaction: ${constants.BRIDGE.SEPOLIA.EXPLORER_URL}/tx/${receipt.transactionHash}`));
            
            // Wait for confirmation if enabled
            if (this.config.sepolia_to_onlylayer.wait_for_confirmation) {
                console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Waiting for bridge confirmation (max ${this.config.sepolia_to_onlylayer.max_wait_time / 1000}s)...`));
                
                // Here we would implement a polling mechanism to check when funds arrive on OnlyLayer
                // For now, just add a simple wait
                await new Promise(resolve => setTimeout(resolve, Math.min(30000, this.config.sepolia_to_onlylayer.max_wait_time)));
                
                // Check OnlyLayer balance after wait
                const newBalance = await this.onlyLayerWeb3.eth.getBalance(this.onlyLayerAccount.address);
                console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ OnlyLayer balance after bridge: ${this.onlyLayerWeb3.utils.fromWei(newBalance, 'ether')} ETH`));
            }
            
            return true;
        } catch (error) {
            console.log(chalk.red(`${getTimestamp(this.walletNum)} ✗ Error bridging from Sepolia to OnlyLayer: ${error.message}`));
            return false;
        }
    }
    
    // Bridge from OnlyLayer to Sepolia
    async bridgeOnlyLayerToSepolia() {
        if (!this.config.enable_onlylayer_to_sepolia) {
            console.log(chalk.yellow(`${getTimestamp(this.walletNum)} ⚠ OnlyLayer to Sepolia bridge disabled in config`));
            return false;
        }
        
        try {
            console.log(chalk.blue.bold(`${getTimestamp(this.walletNum)} Starting OnlyLayer to Sepolia bridge...`));
            
            // Get OnlyLayer balance
            const balance = await this.onlyLayerWeb3.eth.getBalance(this.onlyLayerAccount.address);
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ OnlyLayer balance: ${this.onlyLayerWeb3.utils.fromWei(balance, 'ether')} ETH`));
            
            if (BigInt(balance) <= BigInt(0)) {
                console.log(chalk.yellow(`${getTimestamp(this.walletNum)} ⚠ No OnlyLayer ETH to bridge`));
                return false;
            }
            
            // Determine amount to bridge
            const minAmount = this.onlyLayerWeb3.utils.toWei(this.config.onlylayer_to_sepolia.min_amount.toString(), 'ether');
            const maxAmount = this.onlyLayerWeb3.utils.toWei(this.config.onlylayer_to_sepolia.max_amount.toString(), 'ether');
            
            // Check if balance is enough for minimum amount
            if (BigInt(balance) < BigInt(minAmount)) {
                console.log(chalk.yellow(`${getTimestamp(this.walletNum)} ⚠ OnlyLayer balance below minimum bridge amount`));
                return false;
            }
            
            // Calculate amount to bridge (between min and max)
            let amountToBridge;
            if (BigInt(balance) > BigInt(maxAmount)) {
                amountToBridge = maxAmount;
            } else {
                amountToBridge = BigInt(balance) > BigInt(minAmount) ? balance : minAmount;
            }
            
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Will bridge ${this.onlyLayerWeb3.utils.fromWei(amountToBridge.toString(), 'ether')} ETH from OnlyLayer to Sepolia`));
            
            // Get bridge route from API
            const route = await this.getBridgeRoute(
                constants.NETWORK.CHAIN_ID,
                constants.BRIDGE.SEPOLIA.CHAIN_ID,
                amountToBridge.toString()
            );
            
            if (!route || !route.result || !route.result.initiatingTransaction) {
                throw new Error("Invalid bridge route response");
            }
            
            // Extract transaction details
            const txData = route.result.initiatingTransaction;
            
            // Get nonce
            const nonce = await this.getOnlyLayerNonce();
            
            // Get current gas price and apply multiplier - directly from RPC
            const rawGasPrice = await this.onlyLayerWeb3.eth.getGasPrice();
            const multiplier = this.config.gas_price_multiplier || 1.1;
            const adjustedGasPrice = (BigInt(rawGasPrice) * BigInt(Math.floor(multiplier * 100)) / BigInt(100)).toString();
            
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ OnlyLayer gas price: ${this.onlyLayerWeb3.utils.fromWei(rawGasPrice, 'gwei')} gwei, adjusted to: ${this.onlyLayerWeb3.utils.fromWei(adjustedGasPrice, 'gwei')} gwei`));
            
            // Create transaction object
            const tx = {
                from: this.onlyLayerAccount.address,
                to: txData.to,
                data: txData.data,
                value: txData.value.toString(), // Ensure value is a string
                nonce: nonce,
                chainId: parseInt(txData.chainId),
                gasPrice: adjustedGasPrice
            };
            
            // Estimate gas
            try {
                const estimatedGas = await this.onlyLayerWeb3.eth.estimateGas({
                    from: tx.from,
                    to: tx.to,
                    data: tx.data,
                    value: tx.value
                });
                tx.gas = Math.floor(Number(estimatedGas) * 1.5); // Add 50% buffer
                console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Estimated gas: ${estimatedGas}, with buffer: ${tx.gas}`));
            } catch (error) {
                console.log(chalk.yellow(`${getTimestamp(this.walletNum)} ⚠ Gas estimation failed: ${error.message}, using default gas limit`));
                tx.gas = 300000; // Default gas limit
            }
            
            // Log transaction details
            //console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Transaction details:`), {
            //    to: tx.to,
            //    value: tx.value,
            //    gasPrice: tx.gasPrice,
             //   gas: tx.gas,
            //    nonce: tx.nonce,
             //   chainId: tx.chainId
           // });
            
            // Sign transaction
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Signing transaction...`));
            const signedTx = await this.onlyLayerWeb3.eth.accounts.signTransaction(tx, this.onlyLayerAccount.privateKey);
            
            // Increment nonce before sending
            this.incrementOnlyLayerNonce();
            
            // Send transaction
            console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Sending transaction...`));
            const receipt = await this.onlyLayerWeb3.eth.sendSignedTransaction(signedTx.rawTransaction);
            
            console.log(chalk.green(`${getTimestamp(this.walletNum)} ✓ Bridge transaction sent: ${receipt.transactionHash}`));
            console.log(chalk.green(`${getTimestamp(this.walletNum)} ✓ View transaction: ${constants.NETWORK.EXPLORER_URL}/tx/${receipt.transactionHash}`));
            
            // Wait for confirmation if enabled
            if (this.config.onlylayer_to_sepolia.wait_for_confirmation) {
                console.log(chalk.cyan(`${getTimestamp(this.walletNum)} ℹ Waiting for bridge confirmation...`));
                
                // OnlyLayer to Sepolia takes much longer (days), so this would need to be implemented differently
                console.log(chalk.yellow(`${getTimestamp(this.walletNum)} ⚠ Note: OnlyLayer to Sepolia bridging can take several days to complete`));
                console.log(chalk.yellow(`${getTimestamp(this.walletNum)} ⚠ Steps: 1) Prove withdrawal 2) Wait challenge period 3) Finalize withdrawal`));
            }
            
            return true;
        } catch (error) {
            console.log(chalk.red(`${getTimestamp(this.walletNum)} ✗ Error bridging from OnlyLayer to Sepolia: ${error.message}`));
            return false;
        }
    }
    
    // Execute all bridge operations
    async executeBridgeOperations() {
        try {
            // Reset nonce tracking at the start of operations
            this.sepoliaNonce = null;
            this.onlyLayerNonce = null;
            
            // Perform Sepolia to OnlyLayer bridge
            if (this.config.enable_sepolia_to_onlylayer) {
                await this.bridgeSepoliaToOnlyLayer();
            }
            
            // Small delay between operations
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Perform OnlyLayer to Sepolia bridge
            if (this.config.enable_onlylayer_to_sepolia) {
                await this.bridgeOnlyLayerToSepolia();
            }
            
            return true;
        } catch (error) {
            console.log(chalk.red(`${getTimestamp(this.walletNum)} ✗ Error executing bridge operations: ${error.message}`));
            return false;
        }
    }
}

module.exports = BridgeManager;
