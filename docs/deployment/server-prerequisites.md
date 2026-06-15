# Server Prerequisites

Install and configure the base system before deploying the application.

## Create a Service User

Application services run under an unprivileged user, not root.

```bash
sudo adduser --system --group rri
```

## Install System Packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y \
  python3.11-full \
  python3.11-dev \
  libmariadb-dev \
  pkg-config \
  libssl-dev \
  zlib1g-dev \
  nginx \
  redis-server \
  certbot \
  python3-certbot-nginx \
  unattended-upgrades
```

**What each package is for**:

| Package | Needed For |
|---|---|
| `python3.11-full` | Django runtime (Python 3.11) |
| `python3.11-dev` | Compiling mysqlclient pip package |
| `libmariadb-dev` | MariaDB client library for mysqlclient |
| `pkg-config` | Build tool mysqlclient needs to find MariaDB headers |
| `libssl-dev`, `zlib1g-dev` | Native compilation dependencies |
| `nginx` | Reverse proxy / SSL termination |
| `redis-server` | Cache backend (dramatically improves performance) |
| `certbot`, `python3-certbot-nginx` | Free SSL certificates (Let's Encrypt) |
| `unattended-upgrades` | Automatic security updates |

### Verification

```bash
python3.11 --version  # Expected: Python 3.11.x
nginx -v              # Expected: nginx/1.24.x
redis-server --version  # Expected: Redis 7.x
```

## Install Node.js 22 LTS

The frontend uses Next.js 16, which requires Node.js 18.18 or later. Node.js 22 LTS is the recommended version.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### Verification

```bash
node --version   # Expected: v22.x
npm --version    # Expected: 10.x
```

## Configure Firewall

Allow only SSH, HTTP, and HTTPS. Block everything else, including the application ports (3000, 3306, 6379) — those are accessed locally via Nginx.

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
# Expected: 22, 80, 443 ALLOW IN (all other ports blocked)
```

## Configure Unattended Upgrades

```bash
sudo dpkg-reconfigure --priority=low unattended-upgrades
# Select "Yes" when prompted
```

## Set Up MariaDB

### Install and secure

MariaDB was installed with the system packages above. Secure the installation:

```bash
sudo mysql_secure_installation
```

Follow the prompts:
- Enter current password for root (press Enter — none set)
- Switch to unix_socket authentication: **No** (keep password auth)
- Change root password: **Yes** (set a strong password)
- Remove anonymous users: **Yes**
- Disallow root login remotely: **Yes**
- Remove test database and access to it: **Yes**
- Reload privilege tables now: **Yes**

### Create application database and user

```bash
sudo mysql <<'EOF'
CREATE DATABASE rri_imprint
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'rri_user'@'localhost'
  IDENTIFIED BY '<generate-a-strong-password>';

GRANT ALL PRIVILEGES
  ON rri_imprint.*
  TO 'rri_user'@'localhost';

FLUSH PRIVILEGES;
EOF
```

Store the password securely — you will need it for the `.env` file.

### Verification

```bash
mysql -u rri_user -p -e "USE rri_imprint; SELECT 'connected' AS status;"
# Expected: +-----------+
#           | status    |
#           +-----------+
#           | connected |
#           +-----------+
```

## Set Up Redis

Redis was installed with the system packages above. Start and enable it:

```bash
sudo systemctl enable --now redis-server
sudo systemctl status redis-server
# Expected: Active: active (running)
```

### Verification

```bash
redis-cli ping
# Expected: PONG
```

## Summary — What You Have After This Step

- [x] Service user `rri` created
- [x] Python 3.11, Node.js 22, Nginx, MariaDB, Redis installed
- [x] Firewall configured (22, 80, 443 open)
- [x] Unattended security upgrades enabled
- [x] MariaDB database `rri_imprint` and user `rri_user` created
- [x] Redis running and accepting connections

Next step: `backend-deployment.md`
