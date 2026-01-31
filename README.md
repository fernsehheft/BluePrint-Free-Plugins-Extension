# Modrinth Browser Extension for Pterodactyl

An open-source **Blueprint extension** for Pterodactyl that adds a **Plugins tab** to your server panel, allowing you to browse, search, and install plugins directly from **Modrinth** — without leaving the dashboard.

No manual downloads. No messy uploads. Just click, install, and restart.

---

## Features

* 📚 Browse plugins from Modrinth directly inside your Pterodactyl Panel
* 🔍 Search and filter by project, version, and loader (later on also Bukkit, Spigot, CurseForge, etc.)
* ⬇️ One-click download & install
* 🔒 Permission-aware backend handling
* 🎨 Modern React-based UI
* 🆓 Free and open source

---

## Folder Structure

This extension follows the standard Blueprint extension layout:

```
ModrinthBrowser/
├── conf.yml
├── app/
│   └── Http/
│       └── Controllers/
│           └── Extensions/
│               └── ModrinthBrowser/
│                   └── PluginController.php
├── resources/
│   └── scripts/
│       └── components/
│           └── server/
│               └── modrinth/
│                   └── ModrinthBrowserContainer.tsx
└── routes/
    └── server.php
```

### What lives where?

* `conf.yml` → Extension metadata & configuration
* `PluginController.php` → Download & validation logic
* `ModrinthBrowserContainer.tsx` → Frontend UI
* `server.php` → Route definitions

---

## Requirements

Make sure your system meets these requirements:

* Pterodactyl Panel (Blueprint compatible)
* Blueprint installed
* PHP 8+
* Outbound network access to:

  * `api.modrinth.com`
  * `cdn.modrinth.com`

---

## Installation (Recommended Method)

This is the official and supported installation method using Blueprint packages.

---

### 1️⃣ Download the Latest LTS Release

1. Open the GitHub repository
2. Go to **Releases**
3. Download the latest **LTS** file:

```
modrinthbrowser.blueprint
```

If the filename contains a version number, you may rename it to the above for simplicity.

---

### 2️⃣ Upload to Your Pterodactyl Directory

Upload the `.blueprint` file to your Pterodactyl root directory:

```
/var/www/pterodactyl
```

You can use:

* SFTP
* SCP
* File manager
* FTP (not recommended)

Example (via SCP):

```
scp modrinthbrowser.blueprint user@server:/var/www/pterodactyl/
```

---

### 3️⃣ Install the Extension

SSH into your server and run:

```
cd /var/www/pterodactyl
blueprint -i modrinthbrowser.blueprint
```

After installation, clear cache and rebuild assets if required:

```
php artisan optimize:clear
php artisan view:clear
```

Then restart your panel services if needed.

---

## Uninstallation

To remove the extension, run:

```
cd /var/www/pterodactyl
blueprint -remove modrinthbrowser.blueprint
```

Then clear the cache again:

```
php artisan optimize:clear
```

---

## Updating the Extension

Updating is done by reinstalling the newest release.

---

### Recommended Update Process

1. Remove the old version

```
blueprint -remove modrinthbrowser.blueprint
```

2. Download the latest LTS release from GitHub

3. Upload the new `.blueprint` file to `/var/www/pterodactyl`

4. Install again

```
blueprint -i modrinthbrowser.blueprint
```

5. Clear cache

```
php artisan optimize:clear
```

6. Restart services

---

## Integration Details

### Frontend

The interface is built with React and Tailwind CSS and lives in:

```
resources/scripts/components/server/modrinth/ModrinthBrowserContainer.tsx
```

It communicates with the Modrinth API and the backend controller.

### Backend

```
app/Http/Controllers/Extensions/ModrinthBrowser/PluginController.php
```

Responsibilities:

* Validates download requests
* Verifies permissions
* Streams files securely
* Places plugins in the correct server directory

### Security

* Checks `file.create` permission
* Validates project and version IDs
* Prevents path traversal
* Uses Pterodactyl internal storage APIs

---

## 🛠️ Development & Local Testing

For development installs, you may place the extension inside Blueprint’s development directory:

```
.blueprint/extensions/ModrinthBrowser
```

Then run:

```
blueprint -i modrinthbrowser
```

This allows hot reloading during development.

---

## Contributing

Contributions are welcome.

You can help by:

* Reporting bugs
* Improving documentation
* Submitting pull requests
* Adding features

Please follow standard GitHub contribution workflows.

---

## License

This project is released under an open-source license.

See the `LICENSE` file for details.

---

## Acknowledgements

* Modrinth API
* Pterodactyl Team
* Blueprint Framework Developers
* Community Contributors
