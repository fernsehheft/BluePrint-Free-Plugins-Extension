<?php

namespace Pterodactyl\BlueprintFramework\Extensions\modrinthbrowser;

use Illuminate\Http\Request;
use Pterodactyl\Models\Server;
use Illuminate\Support\Facades\Http;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class PluginController extends Controller
{
    private DaemonFileRepository $fileRepository;

    public function __construct(DaemonFileRepository $fileRepository)
    {
        $this->fileRepository = $fileRepository;
    }

    /**
     * Download a plugin from Modrinth.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function download(Request $request)
    {
        // 1. Validate Input
        $request->validate([
            'downloadUrl' => 'required|url',
            'filename' => 'required|string|ends_with:.jar',
            'serverUuid' => 'required|string|exists:servers,uuid',
        ]);

        $server = Server::where('uuid', $request->input('serverUuid'))->firstOrFail();

        // 2. Verify Permission (Check if user can create files on this server)
        $this->authorize('file.create', $server);

        $url = $request->input('downloadUrl');
        $filename = $request->input('filename');

        try {
            // 3. Download File Content (using Laravel Http client)
            $response = Http::get($url);

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to download file from Modrinth.'
                ], 502);
            }

            $content = $response->body();

            // 4. Save to Server via Wings (DaemonFileRepository)
            // We save to /plugins/filename.jar
            $path = '/plugins/' . $filename;

            // Put content
            $this->fileRepository->setServer($server)->putContent($path, $content);

            return response()->json([
                'success' => true,
                'path' => $path
            ]);

        } catch (DaemonConnectionException $ex) {
            return response()->json([
                'success' => false,
                'message' => 'Could not connect to server daemon.',
                'error' => $ex->getMessage()
            ], 500);
        } catch (\Exception $ex) {
            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred.',
                'error' => $ex->getMessage()
            ], 500);
        }
    }
}
