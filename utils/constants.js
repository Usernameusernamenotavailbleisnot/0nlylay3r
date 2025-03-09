// Central constants file for the OnlyLayer Network Automation Tool
module.exports = {
    // Network information
    NETWORK: {
      NAME: "OnlyLayer",
      CHAIN_ID: 5820948,
      RPC_URL: "https://onlylayer.org",
      EXPLORER_URL: "https://onlyscan.info",
      CURRENCY_SYMBOL: "ETH"
    },
    
    // Bridge information
    BRIDGE: {
      API_URL: "https://api.superbridge.app/api/v2/bridge/routes",
      GRAFFITI: "superbridge",
      SEPOLIA: {
        CHAIN_ID: 11155111,
        RPC_URL: "https://ethereum-sepolia-rpc.publicnode.com",
        EXPLORER_URL: "https://sepolia.etherscan.io",
        CONTRACT_ADDRESS: "0x6847251B63976B2c143c321Dd61d4823D6Bd54A2",
        METHOD_ID: "0xe11013dd"
      },
      ONLYLAYER: {
        CHAIN_ID: 5820948,
        RPC_URL: "https://onlylayer.org",
        EXPLORER_URL: "https://onlyscan.info",
        CONTRACT_ADDRESS: "0x4200000000000000000000000000000000000010",
        METHOD_ID: "0xe11013dd"
      }
    },
    
    // Swap information
    SWAP: {
      CONTRACT_ADDRESS: "0x8D6E7213bad28E00156c7ecddEFac64Cc508CAD5",
      CONTRACT_ABI: [
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "amountOutMin",
              "type": "uint256"
            },
            {
              "internalType": "address[]",
              "name": "path",
              "type": "address[]"
            },
            {
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "deadline",
              "type": "uint256"
            }
          ],
          "name": "swapExactETHForTokens",
          "outputs": [
            {
              "internalType": "uint256[]",
              "name": "amounts",
              "type": "uint256[]"
            }
          ],
          "stateMutability": "payable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "amountOut",
              "type": "uint256"
            },
            {
              "internalType": "address[]",
              "name": "path",
              "type": "address[]"
            },
            {
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "deadline",
              "type": "uint256"
            }
          ],
          "name": "swapETHForExactTokens",
          "outputs": [
            {
              "internalType": "uint256[]",
              "name": "amounts",
              "type": "uint256[]"
            }
          ],
          "stateMutability": "payable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "token",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "amountTokenDesired",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "amountTokenMin",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "amountETHMin",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "deadline",
              "type": "uint256"
            }
          ],
          "name": "addLiquidityETH",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        }
      ],
      TOKEN_PATH: [
        "0xcF2D86B78E12A08EF3373eE3B0d1D2a1370a7B2F",  // WETH
        "0x676C1F954529dC32dA1B038D13Af1ea83cEdc772"   // OFI
      ]
    },
    
    // Gas optimization
    GAS: {
        PRICE_MULTIPLIER: 1.1,
        RETRY_INCREASE: 1.3,
        MIN_GWEI: 0.0001,
        MAX_GWEI: 200,
        DEFAULT_GAS: 150000,
      },
    
    // Retry and timeout settings
    RETRY: {
      MAX_RETRIES: 5,
      BASE_WAIT_TIME: 10,
      RETRY_DELAY_BASE: 5000,
      RETRY_DELAY_EXTRA: 5000,
      MEMPOOL_RETRY_MULTIPLIER: 3
    },
    
    // Token transfer
    TRANSFER: {
      AMOUNT_PERCENTAGE: 90
    },
    
    // Contract deployment
    CONTRACT: {
      SAMPLE_CONTRACT_SOURCE: `
      // SPDX-License-Identifier: MIT
      pragma solidity >=0.8.0 <0.9.0;
  
      contract InteractiveContract {
          address public owner;
          uint256 public value;
          uint256 public interactionCount;
          string public lastAction;
          mapping(address => uint256) public contributions;
          
          event ValueUpdated(address indexed by, uint256 newValue, string actionType);
          event Contributed(address indexed contributor, uint256 amount);
          
          constructor() {
              owner = msg.sender;
              value = 0;
              interactionCount = 0;
              lastAction = "Contract created";
          }
          
          function setValue(uint256 _value) public {
              value = _value;
              interactionCount++;
              lastAction = "setValue";
              emit ValueUpdated(msg.sender, _value, "setValue");
          }
          
          function increment() public {
              value++;
              interactionCount++;
              lastAction = "increment";
              emit ValueUpdated(msg.sender, value, "increment");
          }
          
          function decrement() public {
              if (value > 0) {
                  value--;
              }
              interactionCount++;
              lastAction = "decrement";
              emit ValueUpdated(msg.sender, value, "decrement");
          }
          
          function contribute() public payable {
              require(msg.value > 0, "Contribution must be greater than 0");
              contributions[msg.sender] += msg.value;
              interactionCount++;
              lastAction = "contribute";
              emit Contributed(msg.sender, msg.value);
          }
          
          function getStats() public view returns (uint256, uint256, string memory) {
              return (value, interactionCount, lastAction);
          }
          
          function reset() public {
              require(msg.sender == owner, "Only owner can reset");
              value = 0;
              interactionCount++;
              lastAction = "reset";
              emit ValueUpdated(msg.sender, 0, "reset");
          }
      }
      `
    },
    
    // ERC20 token generation
    ERC20: {
      TOKEN_NAME_PREFIXES: [
        'Moon', 'Doge', 'Shib', 'Pepe', 'Ape', 'Baby', 'Safe', 'Floki', 'Elon', 'Mars',
        'Space', 'Rocket', 'Diamond', 'Crypto', 'Meme', 'Chad', 'Bull', 'Super', 'Mega', 'Meta',
        'Ninja', 'Turbo', 'Lambo', 'Hodl', 'Pump', 'King', 'Based', 'Alpha', 'Sigma', 'Giga',
        'Wojak', 'Stonk', 'Bonk', 'Chungus', 'Gigachad', 'Frog', 'Fren', 'Wen', 'Wagmi', 'Ngmi'
      ],
      TOKEN_NAME_SUFFIXES: [
        'Coin', 'Token', 'Cash', 'Swap', 'Inu', 'Dao', 'Moon', 'Doge', 'Chain', 'Finance',
        'Protocol', 'Network', 'Exchange', 'Capital', 'Money', 'Rocket', 'Rise', 'Gains', 'Pump', 'Whale',
        'Bit', 'Satoshi', 'Elon', 'Mars', 'Galaxy', 'Star', 'Nova', 'Verse', 'World', 'Gem'
      ],
      CONTRACT_TEMPLATE: `
      // SPDX-License-Identifier: MIT
      pragma solidity >=0.8.0 <0.9.0;
  
      contract {{CONTRACT_NAME}} {
          string public name;
          string public symbol;
          uint8 public decimals;
          uint256 public totalSupply;
          
          address public owner;
          
          mapping(address => uint256) private _balances;
          mapping(address => mapping(address => uint256)) private _allowances;
          
          event Transfer(address indexed from, address indexed to, uint256 value);
          event Approval(address indexed owner, address indexed spender, uint256 value);
          event Mint(address indexed to, uint256 value);
          event Burn(address indexed from, uint256 value);
          
          modifier onlyOwner() {
              require(msg.sender == owner, "Only owner can call this function");
              _;
          }
          
          constructor(string memory _name, string memory _symbol, uint8 _decimals) {
              name = _name;
              symbol = _symbol;
              decimals = _decimals;
              totalSupply = 0;
              owner = msg.sender;
          }
          
          function balanceOf(address account) public view returns (uint256) {
              return _balances[account];
          }
          
          function transfer(address to, uint256 amount) public returns (bool) {
              _transfer(msg.sender, to, amount);
              return true;
          }
          
          function allowance(address owner, address spender) public view returns (uint256) {
              return _allowances[owner][spender];
          }
          
          function approve(address spender, uint256 amount) public returns (bool) {
              _approve(msg.sender, spender, amount);
              return true;
          }
          
          function transferFrom(address from, address to, uint256 amount) public returns (bool) {
              require(_allowances[from][msg.sender] >= amount, "ERC20: insufficient allowance");
              
              _allowances[from][msg.sender] -= amount;
              _transfer(from, to, amount);
              
              return true;
          }
          
          function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
              _approve(msg.sender, spender, _allowances[msg.sender][spender] + addedValue);
              return true;
          }
          
          function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
              uint256 currentAllowance = _allowances[msg.sender][spender];
              require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
              
              _approve(msg.sender, spender, currentAllowance - subtractedValue);
              return true;
          }
          
          function mint(address to, uint256 amount) public onlyOwner {
              require(to != address(0), "ERC20: mint to the zero address");
              
              totalSupply += amount;
              _balances[to] += amount;
              
              emit Transfer(address(0), to, amount);
              emit Mint(to, amount);
          }
          
          function burn(uint256 amount) public {
              require(_balances[msg.sender] >= amount, "ERC20: burn amount exceeds balance");
              
              _balances[msg.sender] -= amount;
              totalSupply -= amount;
              
              emit Transfer(msg.sender, address(0), amount);
              emit Burn(msg.sender, amount);
          }
          
          function _transfer(address from, address to, uint256 amount) internal {
              require(from != address(0), "ERC20: transfer from the zero address");
              require(to != address(0), "ERC20: transfer to the zero address");
              require(_balances[from] >= amount, "ERC20: transfer amount exceeds balance");
              
              _balances[from] -= amount;
              _balances[to] += amount;
              
              emit Transfer(from, to, amount);
          }
          
          function _approve(address owner, address spender, uint256 amount) internal {
              require(owner != address(0), "ERC20: approve from the zero address");
              require(spender != address(0), "ERC20: approve to the zero address");
              
              _allowances[owner][spender] = amount;
              
              emit Approval(owner, spender, amount);
          }
      }
      `
    },
    
    // NFT collection
    NFT: {
      NAME_PREFIXES: [
        'Crypto', 'Bored', 'Mutant', 'Azuki', 'Doodle', 'Pudgy', 'Cool', 'Lazy', 'Cyber', 'Meta',
        'Pixel', 'Art', 'Punk', 'Moon', 'Ape', 'Chimp', 'Digital', 'Virtual', 'Token', 'Chain'
      ],
      NAME_SUFFIXES: [
        'Apes', 'Monkeys', 'Punks', 'Cats', 'Dogs', 'Bears', 'Club', 'Society', 'Gang', 'Legends',
        'Collection', 'Worlds', 'Metaverse', 'Universe', 'Pets', 'Friends', 'Heroes', 'Squad', 'Crew', 'Team'
      ],
      CONTRACT_TEMPLATE: `
      // SPDX-License-Identifier: MIT
      pragma solidity >=0.8.0 <0.9.0;
  
      contract {{CONTRACT_NAME}} {
          // Contract owner
          address public owner;
          
          // Collection info
          string public name;
          string public symbol;
          uint256 public maxSupply;
          uint256 public totalSupply;
          
          // Token mappings
          mapping(uint256 => address) private _owners;
          mapping(address => uint256) private _balances;
          mapping(uint256 => string) private _tokenURIs;
          
          // Events
          event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
          event Mint(address indexed to, uint256 indexed tokenId, string tokenURI);
          event Burn(address indexed from, uint256 indexed tokenId);
          
          // Modifiers
          modifier onlyOwner() {
              require(msg.sender == owner, "Not the contract owner");
              _;
          }
          
          modifier tokenExists(uint256 tokenId) {
              require(_owners[tokenId] != address(0), "Token doesn't exist");
              _;
          }
          
          constructor(string memory _name, string memory _symbol, uint256 _maxSupply) {
              owner = msg.sender;
              name = _name;
              symbol = _symbol;
              maxSupply = _maxSupply;
              totalSupply = 0;
          }
          
          function mint(address to, uint256 tokenId, string memory tokenURI) public onlyOwner {
              require(to != address(0), "Cannot mint to zero address");
              require(_owners[tokenId] == address(0), "Token already exists");
              require(totalSupply < maxSupply, "Maximum supply reached");
              
              _owners[tokenId] = to;
              _balances[to]++;
              _tokenURIs[tokenId] = tokenURI;
              totalSupply++;
              
              emit Transfer(address(0), to, tokenId);
              emit Mint(to, tokenId, tokenURI);
          }
          
          function burn(uint256 tokenId) public tokenExists(tokenId) {
              address tokenOwner = _owners[tokenId];
              
              // Only token owner or contract owner can burn
              require(msg.sender == tokenOwner || msg.sender == owner, "Not authorized to burn");
              
              // Clear token data
              delete _tokenURIs[tokenId];
              delete _owners[tokenId];
              _balances[tokenOwner]--;
              totalSupply--;
              
              emit Transfer(tokenOwner, address(0), tokenId);
              emit Burn(tokenOwner, tokenId);
          }
          
          function tokenURI(uint256 tokenId) public view tokenExists(tokenId) returns (string memory) {
              return _tokenURIs[tokenId];
          }
          
          function ownerOf(uint256 tokenId) public view tokenExists(tokenId) returns (address) {
              return _owners[tokenId];
          }
          
          function balanceOf(address _owner) public view returns (uint256) {
              require(_owner != address(0), "Zero address has no balance");
              return _balances[_owner];
          }
          
          function tokensOfOwner(address _owner) public view returns (uint256[] memory) {
              uint256 tokenCount = _balances[_owner];
              uint256[] memory tokenIds = new uint256[](tokenCount);
              
              uint256 counter = 0;
              for (uint256 i = 0; i < maxSupply && counter < tokenCount; i++) {
                  if (_owners[i] == _owner) {
                      tokenIds[counter] = i;
                      counter++;
                  }
              }
              
              return tokenIds;
          }
      }
      `
    }
  };
