module.exports = {
    ENS_ABI: [
        {
            type: 'function',
            name: 'resolver',
            stateMutability: 'view',
            inputs: [
                { type: 'bytes32', name: 'node' },
            ],
            outputs: [
                { type: 'address', name: 'resolver' },
            ],
        },
        {
            type: 'function',
            name: 'ttl',
            stateMutability: 'view',
            inputs: [
                { type: 'bytes32', name: 'node' },
            ],
            outputs: [
                { type: 'uint64', name: 'ttl' },
            ],
        },
    ],
    RESOLVER_ABI: [
        {
            type: 'function',
            name: 'supportsInterface',
            stateMutability: 'view',
            inputs: [
                { type: 'bytes4', name: 'interfaceID' },
            ],
            outputs: [
                { type: 'bool', name: 'isSupported' },
            ],
        },
        {
            type: 'function',
            name: 'addr',
            stateMutability: 'view',
            inputs: [
                { type: 'bytes32', name: 'node' },
            ],
            outputs: [
                { type: 'address', name: 'value' },
            ],
        },
        {
            type: 'function',
            name: 'addr',
            stateMutability: 'view',
            inputs: [
                { type: 'bytes32', name: 'node' },
                { type: 'uint256', name: 'coinType' },
            ],
            outputs: [
                { type: 'bytes', name: 'value' },
            ],
        },
        {
            type: 'function',
            name: 'contenthash',
            stateMutability: 'view',
            inputs: [
                { type: 'bytes32', name: 'node' },
            ],
            outputs: [
                { type: 'bytes', name: 'value' },
            ],
        },
        {
            type: 'function',
            name: 'text',
            stateMutability: 'view',
            inputs: [
                { type: 'bytes32', name: 'node' },
                { type: 'string', name: 'key' },
            ],
            outputs: [
                { type: 'string', name: 'value' },
            ],
        },
        {
            type: 'function',
            name: 'name',
            stateMutability: 'view',
            inputs: [
                { type: 'bytes32', name: 'node' },
            ],
            outputs: [
                { type: 'string', name: 'value' },
            ],
        },
    ],
}
