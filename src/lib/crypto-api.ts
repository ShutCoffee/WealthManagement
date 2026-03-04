
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY
const BASE_URL = 'https://api.coingecko.com/api/v3'

interface TokenBalance {
  type: string
  id: string
  attributes: {
    address: string
    name: string
    symbol: string
    decimals: number
    image_url: string
    coingecko_coin_id: string | null
    balance: string
    price_usd: string
    value_usd: string
  }
}

interface WalletResponse {
  data: {
    attributes: {
      total_value_usd: string
    }
    relationships: {
      tokens: {
        data: TokenBalance[]
      }
    }
  }
}

/**
 * Fetch wallet balance using CoinGecko Onchain API
 * Note: This requires a paid API key or using the specific Onchain API endpoint if available for free.
 * The user specified using COINGECKO_API_KEY.
 */
export async function getWalletValue(address: string, network = 'eth'): Promise<{ totalValue: number, tokens: any[] }> {
  if (!COINGECKO_API_KEY) {
    console.error('COINGECKO_API_KEY is not set')
    return { totalValue: 0, tokens: [] }
  }

  try {
    // Trying the Onchain API endpoint structure
    // Documentation: https://docs.coingecko.com/v3.0.1/reference/onchain-wallet-token-balances
    const url = `${BASE_URL}/onchain/networks/${network}/wallets/${address}/tokens?x_cg_pro_api_key=${COINGECKO_API_KEY}`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`CoinGecko API error: ${response.status} ${errorText}`)
      throw new Error(`Failed to fetch wallet data: ${response.statusText}`)
    }

    const data = await response.json()
    
    // The response structure for onchain wallet tokens usually contains a list of tokens.
    // We need to sum up the value_usd of each token if a total isn't provided.
    // Based on similar APIs, it returns a list of tokens in `data`.
    
    const tokens = data.data || []
    let totalValue = 0

    const parsedTokens = tokens.map((token: any) => {
      const attr = token.attributes
      const value = parseFloat(attr.value_usd || '0')
      totalValue += value
      return {
        name: attr.name,
        symbol: attr.symbol,
        balance: attr.balance, // This might be raw or formatted, usually raw string
        decimals: attr.decimals,
        price: parseFloat(attr.price_usd || '0'),
        value: value,
        imageUrl: attr.image_url
      }
    })

    return {
      totalValue,
      tokens: parsedTokens
    }

  } catch (error) {
    console.error('Failed to get wallet value:', error)
    return { totalValue: 0, tokens: [] }
  }
}

