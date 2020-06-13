'use strict'
const _ = require('lodash');
const ethjs = require('ethereumjs-util');
const hashObject = require('object-hash');
const Web3 = require('web3');
const createWeb3Provider = require('create-web3-provider');
const { ENS_ABI, RESOLVER_ABI } = require('./abis');

const ENS_ADDRESSES = {
	'1': '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
	'3': '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
	'4': '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
	'42': '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
	'6824': '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
};
const WEB3_CACHE = {};
const NULL_ADDRESS = ethjs.bufferToHex(Buffer.alloc(20));

module.exports = {
	resolve,
	nameToNode,
	getTextRecord,
	getBlockchainAddress,
	getContentHash,
	getCanonicalName,
	minTTL: 60 * 60 * 1000,
	maxTTL: Number.MAX_SAFE_INTEGER
};

function getWeb3(opts={}) {
	if (opts.web3) {
		return opts.web3;
	}
	// Try to reuse an existing web3 instance, if possible.
	const key = hashObject(opts);
	if (key in WEB3_CACHE) {
		return WEB3_CACHE[key];
	}
	const provider = opts.provider || createWeb3Provider({
		uri: opts.providerURI,
		network: opts.network,
		infuraKey: opts.infuraKey,
		net: opts.net
	});
	const inst = new Web3(provider);
	return WEB3_CACHE[key] = inst;
}

async function queryRegistry(name, opts, cache, cachePath, queryResolver) {
	const web3 = getWeb3(opts);
	const chainId = await web3.eth.getChainId();
	const node = nameToNode(name);
	cachePath = [chainId, node, ...cachePath];

	const cached = getCachedValue(cache, cachePath);
	if (cached) {
		return cached.value;
	}

	if (!(chainId in ENS_ADDRESSES)) {
		throw new Error(`ENS is not supported on network id ${chainId}`);
	}

	const ens = new web3.eth.Contract(ENS_ABI, ENS_ADDRESSES[chainId]);
	const resolverAddress = await ens.methods.resolver(node).call({ block: opts.block });
	if (resolverAddress === NULL_ADDRESS) {
		throw new Error(`No resolver for ENS address: '${name}'`);
	}

	const value = await queryResolver(
		node,
		new web3.eth.Contract(RESOLVER_ABI, resolverAddress),
	);

	const ttl = _.clamp(
		_.isNumber(opts.ttl) ? ttl : await ens.methods.ttl(node) * 1000,
		module.exports.minTTL,
		module.exports.maxTTL,
	);

	if (!opts.block) {
		cacheValue(cache, cachePath, value, ttl);
	}
	return value;
}

function getCachedValue(cache, cachePath) {
	const cached = _.get(cache, cachePath);
	if (cached && cached.expires > _.now()) {
		return cached.value;
	}
}

function cacheValue(cache, cachePath, value, ttl) {
	if (ttl > 0) {
		_.set(
			cache,
			cachePath,
			{ value: value, expires: _.now() + ttl },
		);
	}
}

async function resolve(name, opts={}) {
	if (/^0x[a-f0-9]+$/i.test(name) && ethjs.isValidAddress(name)) {
		return ethjs.toChecksumAddress(name);
	}

	return queryRegistry(name, opts, resolve.cache, [], async (node, resolver) => {
		return resolver.methods.addr(node).call({ block: opts.block });
	});
}

async function getTextRecord(name, key, opts={}) {
	return queryRegistry(name, opts, getTextRecord.cache, [key], async (node, resolver) => {
		const isSupported =
			await resolver.methods.supportsInterface('0x59d1d43c').call({ block: opts.block });
		if (!isSupported) {
			throw new Error(`Resolver for ${name} does not support text records.`);
		}
		return resolver.methods.text(node, key).call({ block: opts.block });
	});
}

async function getBlockchainAddress(name, coinType, opts={}) {
	coinType = coinType.toString(10);

	return queryRegistry(name, opts, getTextRecord.cache, [coinType], async (node, resolver) => {
		const isSupported =
			await resolver.methods.supportsInterface('0xf1cb7e06').call({ block: opts.block });
		if (!isSupported) {
			throw new Error(`Resolver for ${name} does not support blockchain addresses.`);
		}
		return resolver.methods.addr(node, coinType).call({ block: opts.block });
	});
}

async function getContentHash(name, opts={}) {
	return queryRegistry(name, opts, getContentHash.cache, [], async (node, resolver) => {
		const isSupported =
			await resolver.methods.supportsInterface('0xbc1c58d1').call({ block: opts.block });
		if (!isSupported) {
			throw new Error(`Resolver for ${name} does not support content hashes.`);
		}
		return resolver.methods.contenthash(node).call({ block: opts.block });
	});
}

async function getCanonicalName(name, opts={}) {
	return queryRegistry(name, opts, getCanonicalName.cache, [], async (node, resolver) => {
		const isSupported =
			await resolver.methods.supportsInterface('0x691f3431').call({ block: opts.block });
		if (!isSupported) {
			throw new Error(`Resolver for ${name} does not support canonical names.`);
		}
		return resolver.methods.name(node).call({ block: opts.block });
	});
}

function nameToNode(name) {
	name = name.toLowerCase();
	if (!_.isString(name)) {
		throw new Error('ENS name must be a string');
	}
	let hb = Buffer.alloc(32);
	const labels = _.reverse(_.filter(name.split('.')));
	for (let label of labels) {
		const lh = ethjs.keccak256(Buffer.from(label));
		hb = ethjs.keccak256(Buffer.concat([hb, lh]));
	}
	return '0x' + hb.toString('hex');
}
