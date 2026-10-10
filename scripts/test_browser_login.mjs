import { spawn } from 'child_process';
import http from 'http';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.msgId = 0;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve);
      this.ws.addEventListener('error', reject);
    });

    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) {
          reject(new Error(msg.error.message));
        } else {
          resolve(msg.result);
        }
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.msgId;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    return res.result?.value;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  console.log('Starting Chrome headless instance for live browser testing...');
  const chromeProc = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--window-size=1280,900',
      'about:blank',
    ]
  );

  try {
    await sleep(2000);
    const tabs = await fetchJson('http://127.0.0.1:9222/json');
    const pageTab = tabs.find((t) => t.type === 'page') || tabs[0];
    console.log('Connected to tab:', pageTab.id, pageTab.url);

    const client = new CDPClient(pageTab.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');

    console.log('Navigating to http://localhost:5173...');
    await client.send('Page.navigate', { url: 'http://localhost:5173' });
    await sleep(2000);

    // Ensure localStorage is cleared to test login page
    await client.eval(`
      localStorage.clear();
      window.location.reload();
    `);
    await sleep(2000);

    // 1. Verify Login Page elements are rendered
    const loginHeader = await client.eval(`document.querySelector('h2')?.innerText`);
    console.log('1. Login Card Header:', loginHeader);
    if (!loginHeader || !loginHeader.includes('Manager Sign-In')) {
      throw new Error('Login page header not found!');
    }

    // 2. Test Store 7 Demo Sign-In
    console.log('2. Testing Store 7 Demo Sign-In (clicking Store 7 card)...');
    await client.eval(`
      const buttons = Array.from(document.querySelectorAll('button'));
      const st7Btn = buttons.find(b => b.innerText.includes('Store 7'));
      if (st7Btn) st7Btn.click();
      else throw new Error('Store 7 button not found');
    `);
    await sleep(2000);

    let textAfterSt7 = await client.eval(`document.body.innerText`);
    const loggedInSt7 = textAfterSt7.includes('STORE_007') || textAfterSt7.includes('Koramangala');
    console.log('   Store 7 Dashboard Loaded Successfully:', loggedInSt7);
    if (!loggedInSt7) throw new Error('Store 7 sign-in failed!');

    // 3. Test Switch Manager / Sign Out
    console.log('3. Switching to Store 3...');
    await client.eval(`
      localStorage.clear();
      window.location.reload();
    `);
    await sleep(2000);

    // 4. Test Store 3 Demo Sign-In
    console.log('4. Testing Store 3 Demo Sign-In (clicking Store 3 card)...');
    await client.eval(`
      const buttons = Array.from(document.querySelectorAll('button'));
      const st3Btn = buttons.find(b => b.innerText.includes('Store 3'));
      if (st3Btn) st3Btn.click();
      else throw new Error('Store 3 button not found');
    `);
    await sleep(2000);

    let textAfterSt3 = await client.eval(`document.body.innerText`);
    const loggedInSt3 = textAfterSt3.includes('STORE_003') || textAfterSt3.includes('Domlur');
    console.log('   Store 3 Dashboard Loaded Successfully:', loggedInSt3);
    if (!loggedInSt3) throw new Error('Store 3 sign-in failed!');

    // 5. Test Switch Manager to Store 12
    console.log('5. Switching to Store 12...');
    await client.eval(`
      localStorage.clear();
      window.location.reload();
    `);
    await sleep(2000);

    // 6. Test Store 12 Demo Sign-In
    console.log('6. Testing Store 12 Demo Sign-In (clicking Store 12 card)...');
    await client.eval(`
      const buttons = Array.from(document.querySelectorAll('button'));
      const st12Btn = buttons.find(b => b.innerText.includes('Store 12'));
      if (st12Btn) st12Btn.click();
      else throw new Error('Store 12 button not found');
    `);
    await sleep(2000);

    let textAfterSt12 = await client.eval(`document.body.innerText`);
    const loggedInSt12 = textAfterSt12.includes('STORE_012') || textAfterSt12.includes('Marathahalli');
    console.log('   Store 12 Dashboard Loaded Successfully:', loggedInSt12);
    if (!loggedInSt12) throw new Error('Store 12 sign-in failed!');

    // Reset localStorage so the reviewer lands fresh on the login page
    await client.eval(`
      localStorage.clear();
      window.location.reload();
    `);
    await sleep(1000);

    client.close();
    console.log('\n[SUCCESS] All 3 demo sign-in options verified working end-to-end in real Chrome browser!');
  } finally {
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error('\n[FAIL] Browser login verification failed:', err);
  process.exit(1);
});
