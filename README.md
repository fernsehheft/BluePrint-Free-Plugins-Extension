# Modrinth Browser Extension for Pterodactyl

This Blueprint extension adds a "Plugins" tab to your server management interface, allowing you to browse and download plugins directly from Modrinth.

## Directory Structure

This extension follows the standard Blueprint extension structure:

```
ModrinthBrowser/
├── conf.yml                                 # Configuration & Metadata
├── app/
│   └── Http/
│       └── Controllers/
│           └── Extensions/
│               └── ModrinthBrowser/
│                   └── PluginController.php # Backend logic for downloads
├── resources/
│   └── scripts/
│       └── components/
│           └── server/
│               └── modrinth/
│                   └── ModrinthBrowserContainer.tsx # Frontend UI (React)
└── routes/
    └── server.php                           # Route definitions
```

## Installation

1. **Prerequisites**: Ensure you have [Blueprint](https://blueprint.zip) installed on your Pterodactyl instance.
2. **Upload**: Upload the `ModrinthBrowser` folder to your Pterodactyl root directory (or extensions directory if using a specific manager, but typically Blueprint extensions are installed via command).
   - *Note*: If manually placing files, ensure they merge with your Pterodactyl structure. However, proper Blueprint installation usually involves using the `blueprint -i` command if packaged, or placing in a staging area.
   - **Recommended**: Place this folder in your Pterodactyl root extensions folder (if applicable) or simply merge the `app`, `resources` folders into your Pterodactyl root if installing manually (NOT RECOMMENDED with Blueprint).
   
   **Correct Blueprint Method**:
   - Place the `ModrinthBrowser` folder in your Blueprint extensions directory (usually `.blueprint/extensions/ModrinthBrowser` or simply refer to Blueprint docs for "Development" placement).
   - Run `blueprint -i modrinthbrowser`

3. **Build**:
   ```bash
   blueprint -i modrinthbrowser
   ```

## Integration Details

- **Frontend**: The `ModrinthBrowserContainer.tsx` is a self-contained React component using Tailwind CSS and Styled Components to replicate the "Glassmorphism" design. It communicates with the Modrinth API for data and your Pterodactyl backend for downloads.
- **Backend**: The `PluginController.php` handles secure file downloads. It validates the input and streams the file from Modrinth to your server's `/plugins` directory using Pterodactyl's internal repositories.
- **Security**: The backend checks for `file.create` permissions before allowing a download.

## Requirements

- Pterodactyl Panel (compatible with Blueprint alpha-3 targets)
- PHP `guzzlehttp/guzzle` (Standard in Pterodactyl)
- Outbound network access to `api.modrinth.com` and `cdn.modrinth.com`
