'use strict'
const _ = require('lodash');
const ethjs = require('ethereumjs-util');
const Web3 = require('web3');
const createWeb3Provider = require('create-web3-provider');
const ENS_ADDRESSES = {
	'1': '0x314159265dd8dbb310642f98f50c066173c1259b',
	'3': '0x112234455c3a32fd11230c42e7bccd4a84e02010',
	'4': '0xe7410170f87102df0055eb195163a03b7f2bff4a'
};
const RESOLVER_FN_SIG = '0x0178b8bf';
const ADDR_FN_SIG = '0x3b3b57de';
const TTL_FN_SIG = '0x16a25cbd';

module.exports = {
	resolve: resolve,
	hash: hash,
	cache: {},
	minTTL: 60 * 60 * 1000,
	maxTTL: 0xffffffffffffffff
};

function getWeb3(opts={}) {
	if (opts.web3)
		return opts.web3;
	const provider = opts.provider || createWeb3Provider({
		uri: opts.providerURI,
		network: opts.network,
		infuraKey: opts.infuraKey,
		net: opts.net
	});
	return new Web3(provider);
}

async function resolve(name, opts={}) {
	const web3 = getWeb3(opts)
	const node = hash(name);
	const chainId = await web3.eth.net.getId();
	if (!(chainId in ENS_ADDRESSES))
		throw new Error(`ENS is not supported on network id ${chainId}`);
	// Try the cache first.
	const cached = _.get(module.exports.cache, [_.toString(chainId), node]);
	if (cached && cached.expires > _.now())
		return cached.address;

	const ens = ENS_ADDRESSES[chainId];
	const resolver = extractBytes(await call(web3, ens,
			encodeCallData(RESOLVER_FN_SIG, node),
		opts.block), 20);
	if (/^0x0+$/.test(resolver) || !ethjs.isValidAddress(resolver))
		throw new Error(`No resolver for ENS address: '${name}'`);
	let addr = extractBytes(await call(web3, resolver,
			encodeCallData(ADDR_FN_SIG, node),
		opts.block), 20);
	if (!ethjs.isValidAddress(addr))
		throw new Error(`Failed to resolve ENS address: '${name}'`);
	 addr = ethjs.toChecksumAddress(addr);
	// Get the TTL.
	let ttl = opts.ttl;
	if (!_.isNumber(ttl)) {
		ttl = extractBytes(await call(web3, ens,
			encodeCallData(TTL_FN_SIG, node),
			opts.block), 8);
		ttl = _.clamp(parseInt(ttl.substr(2), 16) * 1000,
			module.exports.minTTL, module.exports.maxTTL);
	}
	// Cache it.
	if (ttl > 0 && !opts.block) {
		_.set(module.exports.cache, [_.toString(chainId), node],
			{address: addr, expires: _.now() + ttl});
	}
	return addr;
}

function extractBytes(raw, size) {
	return '0x'+raw.substr(raw.length-size*2);
}

function encodeCallData(sig, arg) {
	return sig + arg.substr(2);
}

function call(web3, contract, data, block) {
	const opts = {
		data: data,
		value: '0x0',
		to: contract
	};
	return web3.eth.call(opts, block);
}

function hash(name) {
	if (!_.isString(name))
		throw new Error('ENS name must be a string');
	let hb = Buffer.alloc(32);
	const labels = _.reverse(_.filter(name.split('.')));
	for (let label of labels) {
		const lh = ethjs.keccak256(Buffer.from(label));
		hb = ethjs.keccak256(Buffer.concat([hb, lh]));
	}
	return '0x'+hb.toString('hex');
}
