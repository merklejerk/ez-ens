![npm package](https://badge.fury.io/js/ez-ens.svg)

# ez-ens
Simple, zero-configuration Ethereum Name Service resolver with promises.

Works on main, ropsten, and rinkeby Ethereum networks.

## Installation
```bash
npm install ez-ens
# or
yarn install ez-ens
```

## Sample Usage
```js
const ens = require('ez-ens');
// Resolve 'ethereum.eth' on the mainnet.
await ens.resolve('ethereum.eth') // '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
// Resolve 'ethereum.eth' on ropsten.
await ens.resolve('ethereum.eth', {network: ropsten});
// Resolve 'ethereum.eth' using the provider at http://localhost:8545.
await ens.resolve('ethereum.eth', {providerURI: 'http://localhost:8545'});
// Resolve 'ethereum.eth' using an existing web3 instance (lower overhead).
await ens.resolve('ethereum.eth', {web3: new Web3(...)});
// Resolve 'ethereum.eth' on the mainnet at a specific block number.
await ens.resolve('ethereum.eth', {block: 3013041});
// Resolve 'ethereum.eth' on the mainnet and override the TTL (cache duration).
await ens.resolve('ethereum.eth', {ttl: 3000});

// Full resolve() options.
ens.resolve({
	// Manually specify how long, in ms, to keep the record in the cache.
	// If not set, the TTL specified by the registrar will be used.
	ttl: Number,
	// Block number to evaluate the ENS record at. Defaults to latest.
	block: Number,
	// Network to use. Either 'main', 'ropsten', or 'rinkeby'.
	// Defaults to 'main'
	network: String,
	// Custom provider URI. May be an http://, https://, ws://, or IPC path.
	providerURI: String,
	// If providerURI is an IPC path, set this to `require('net')`
	net: Object,
	// Custom provider instance to use (e.g., web3.currentProvider)
	provider: Object,
	// Custom Web3 instance to use. Lightest option if making lots of calls.
	web3: Object,
	// Custom infura API key, if not using a custom provider URI or provider.
	infuraKey: String
});
```

## Minimum ENS cache duration
Once an address is resolved, the address will be cached for future calls.
Each address record has a TTL, or time-to-live, defined, which specifies how long
the cache should be retained. However, many ENS registrations unintentionally
leave the TTL at the default of `0`, which would imply no caching.
So, by default, cache TTLs are clamped to be at least one hour. You can
configure this behavior yourself by setting the
`ens.minTTL` property to the minimum number of *milliseconds* to
keep a cache entry. The maximum TTL can also be specified with the `ens.maxTTL`
property.

#### Example
```js
const ens = require('ez-ens');
// Set the minimum TTL to 10 seconds.
ens.minTTL = 10 * 1000;
// Set the maximum TTL to 8 hours.
ens.maxTTL = 8 * 60 * 60 * 1000
```
