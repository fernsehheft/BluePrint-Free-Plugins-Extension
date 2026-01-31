# Modrinth Browser Extension for Pterodactyl

This is an open-source **Blueprint extension** for Pterodactyl that adds a handy **Plugins** tab right inside your server panel. With it, you can browse, search, and install plugins straight from **Modrinth** — no need to leave the dashboard.

No more downloading files by hand or uploading things manually. Just pick what you need, hit install, and you’re set.

---

## Features

* 📚 Browse Modrinth plugins directly from your Pterodactyl Panel.
* 🔍 Search and filter by project name, Minecraft version, and loader (support for more like Bukkit, Spigot, CurseForge coming soon).
* ⬇️ One-click download & install.
* 🔒 Backend checks server permissions before installing.
* 🎨 Modern React-based UI for a smooth experience.
* 🆓 100% free and open source.

---

## Folder Structure

The extension uses the usual Blueprint project structure:

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

### Quick Overview:

* `conf.yml`: Extension metadata & config
* `PluginController.php`: Handles download & validation
* `ModrinthBrowserContainer.tsx`: UI code (React)
* `server.php`: Blueprint routes

---

## Requirements

To get this extension running, you'll need:

* The Pterodactyl Panel with Blueprint support
* Blueprint installed
* PHP 8 or newer
* Outbound network access to:
  * `api.modrinth.com`
  * `cdn.modrinth.com`

---

## Installation (Recommended)

The installation works best with the Blueprint package manager.

---

### 1️⃣ Download the Latest LTS Release

1. Go to this repo’s GitHub Releases page.
2. Download the most recent **LTS** release:
    ```
    modrinthbrowser.blueprint
    ```
    If the download has a version in the filename, you can rename it to the above if you prefer.

---

### 2️⃣ Upload to Your Pterodactyl Directory

Put the `modrinthbrowser.blueprint` file in your Pterodactyl root folder:

```
/var/www/pterodactyl
```

You can upload using SFTP, SCP, your file manager, or (less ideally) FTP.

Example:
```
scp modrinthbrowser.blueprint user@server:/var/www/pterodactyl/
```

---

### 3️⃣ Install the Extension

1. SSH into your server.
2. Run:
    ```
    cd /var/www/pterodactyl
    blueprint -i modrinthbrowser.blueprint
    ```
3. After installing, clear caches and rebuild assets if necessary:
    ```
    php artisan optimize:clear
    php artisan view:clear
    ```
4. If your setup requires it, restart your panel services.

---

## Uninstalling

To remove the extension, run:
```
cd /var/www/pterodactyl
blueprint -remove modrinthbrowser.blueprint
```

Don't forget to clear the cache afterwards:
```
php artisan optimize:clear
```

---

## Updating

Just uninstall the old version and install the new one. Here’s a quick process:

### Recommended Update Process

1. Remove the old version:
    ```
    blueprint -remove modrinthbrowser.blueprint
    ```
2. Download the latest LTS release from GitHub.
3. Upload the new file to `/var/www/pterodactyl`.
4. Install again:
    ```
    blueprint -i modrinthbrowser.blueprint
    ```
5. Clear cache:
    ```
    php artisan optimize:clear
    ```
6. Restart your panel services if needed.

---

## How it Works

### Frontend

The panel interface lives here:
```
resources/scripts/components/server/modrinth/ModrinthBrowserContainer.tsx
```
It’s all React + Tailwind, talking to the backend and Modrinth’s API.

### Backend

This is the controller doing the heavy lifting:
```
app/Http/Controllers/Extensions/ModrinthBrowser/PluginController.php
```
It:
* Checks and validates requests
* Verifies your user/server has the right permissions
* Streams plugin files securely
* Drops them in the correct server folder

### Security

* Enforces `file.create` permission checks.
* Validates all project/version IDs.
* Prevents directory traversal attacks.
* Uses Pterodactyl’s built-in storage APIs.

---

## 🛠️ Developing & Local Testing

To run locally, you can place the extension here:

```
.blueprint/extensions/ModrinthBrowser
```

Then use:

```
blueprint -i modrinthbrowser
```

You’ll get hot reloads for most changes.

---

## Contributing

Pull requests, bug reports, and feature ideas are all welcome! Contributions of any size help keep this project healthy.

Typical ways to help:
* Reporting bugs
* Fixing typos or improving docs
* Submitting pull requests
* Suggesting new features

Please follow the usual GitHub process and check for open issues first.

---

## License

Open source, of course! See the `LICENSE` file for specifics.

---

## Acknowledgements

* Modrinth API & team
* The Pterodactyl contributors
* Blueprint Framework maintainers
* Everyone else who’s pitched in along the way!
