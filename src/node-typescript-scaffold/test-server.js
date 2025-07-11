#!/usr/bin/env node

import { spawn } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';

// Test the MCP server by sending a simple request
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list'
};

server.stdin.write(JSON.stringify(request) + '\n');
server.stdin.end();

let output = '';
server.stdout.on('data', (data) => {
  output += data.toString();
});

server.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

server.on('close', (code) => {
  console.log('Server output:', output);
  console.log('Exit code:', code);
});

setTimeout(() => {
  server.kill();
}, 5000);