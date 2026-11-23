const sepolia = '0xaa36a7';
let provider, signer, account;
const $ = id => document.getElementById(id);
const status = message => $('status').textContent = message;

document.querySelectorAll('.tab').forEach(tab => tab.onclick = () => {
  document.querySelectorAll('.tab,.panel').forEach(el => el.classList.remove('active'));
  tab.classList.add('active');
  $(tab.dataset.panel).classList.add('active');
  if (tab.dataset.panel === 'activity') renderActivity();
});

async function connect() {
  if (!window.ethereum) { status('Open this page in the MetaMask mobile browser to connect.'); return; }
  try {
    const chain = await window.ethereum.request({method:'eth_chainId'});
    if (chain !== sepolia) await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:sepolia}]});
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    signer = await provider.getSigner(); account = await signer.getAddress();
    const balance = await provider.getBalance(account);
    $('wallet').textContent = account.slice(0,6)+'…'+account.slice(-4);
    $('balance').textContent = Number(ethers.formatEther(balance)).toFixed(4)+' SepoliaETH';
    $('connect').textContent = 'Connected'; $('network').innerHTML = '<span class="dot" style="background:#53e0b5"></span><span>Sepolia connected</span>';
    status('Wallet connected.');
  } catch (e) { status(e.shortMessage || e.message || 'Wallet connection was cancelled.'); }
}
async function send(kind, toId, amountId) {
  if (!signer) await connect(); if (!signer) return;
  const to = $(toId).value.trim(), amount = $(amountId).value.trim();
  if (!ethers.isAddress(to)) { status('Enter a valid 0x address.'); return; }
  if (!amount || Number(amount) <= 0) { status('Enter an amount greater than zero.'); return; }
  try {
    status('Approve the transaction in MetaMask…');
    const tx = await signer.sendTransaction({to, value:ethers.parseEther(amount)});
    record(kind, amount, to, tx.hash); status('Submitted: '+tx.hash.slice(0,12)+'…');
    await tx.wait(); status('Confirmed on Sepolia.'); await connect();
  } catch (e) { status(e.shortMessage || e.message || 'Transaction was not submitted.'); }
}
function record(kind, amount, to, hash) { const items=JSON.parse(localStorage.getItem('sepolia-actions')||'[]'); items.unshift({kind,amount,to,hash,time:new Date().toLocaleString()}); localStorage.setItem('sepolia-actions',JSON.stringify(items.slice(0,12))); }
function renderActivity() { const items=JSON.parse(localStorage.getItem('sepolia-actions')||'[]'); $('activityList').innerHTML=items.length?items.map(x=>`<div><b>${x.kind}</b> · ${x.amount} ETH<br>${x.to}<small>${x.time}<br>${x.hash}</small></div>`).join(''):'<p class="hint">No transactions submitted from this device yet.</p>'; }
$('connect').onclick=connect; $('depositButton').onclick=()=>send('Store money','vault','depositAmount'); $('sendButton').onclick=()=>send('Transfer','recipient','sendAmount'); renderActivity();
