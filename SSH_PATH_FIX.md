# SSH Path Configuration

## Problem: npm/node not found in SSH session

SSH non-interactive sessions don't load `.bashrc` or `.bash_profile`, so `npm` isn't in PATH.

## Solution Options:

### Option 1: Use Full Paths (Recommended)

Once you know where Node.js is installed, update the workflow:

```bash
# Example if node is at /opt/plesk/node/20/bin/
export PATH=/opt/plesk/node/20/bin:$PATH

# Or use full paths directly:
/opt/plesk/node/20/bin/npm install --production
/opt/plesk/node/20/bin/npm run migrate
```

### Option 2: Source Profile

```bash
source ~/.bashrc || source ~/.bash_profile
npm install --production
```

### Option 3: Use Node Version Manager

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use default
npm install --production
```

## Find Node.js Location:

```bash
# SSH into server
ssh a2359932@access-5017128307.webspace-host.com

# Find node
which node
which npm

# Check common locations
ls /opt/plesk/node/
ls ~/.nvm/versions/node/
ls /usr/local/bin/
```

## Tell Me the Output

Once you run the above commands, tell me the path and I'll update the workflow!

