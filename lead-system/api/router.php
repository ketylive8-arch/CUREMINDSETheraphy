<?php
/**
 * Front controller / router.
 * Run in dev:  php -S 0.0.0.0:8080 lead-system/api/router.php
 * In production put the API behind Apache/Nginx with public/ as web root.
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/leads.php';
require_once __DIR__ . '/agents.php';
require_once __DIR__ . '/hunter.php';

$path   = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'];

// --- Static files (SPA) -------------------------------------------------
if (!str_starts_with($path, '/api/')) {
    $public = realpath(__DIR__ . '/../public');
    $file = realpath($public . $path);
    // Serve an existing file inside public/ ...
    if ($file && str_starts_with($file, $public) && is_file($file)) {
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        $types = [
            'html' => 'text/html; charset=utf-8',
            'js'   => 'application/javascript; charset=utf-8',
            'css'  => 'text/css; charset=utf-8',
            'json' => 'application/json; charset=utf-8',
            'svg'  => 'image/svg+xml',
            'png'  => 'image/png',
            'ico'  => 'image/x-icon',
        ];
        header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
        send_security_headers();
        readfile($file);
        exit;
    }
    // ... otherwise the SPA entry point.
    send_security_headers();
    header('Content-Type: text/html; charset=utf-8');
    readfile($public . '/index.html');
    exit;
}

// --- API ----------------------------------------------------------------
send_security_headers();
try {
    // Routes with a numeric id: /api/leads/{id}/{action}
    if (preg_match('#^/api/leads/(\d+)/(refind|resend|followup|email)$#', $path, $m)) {
        $id = (int) $m[1];
        if ($method !== 'POST') {
            json_err('method not allowed', 405);
        }
        match ($m[2]) {
            'refind'   => handle_refind($id),
            'resend'   => handle_resend($id),
            'followup' => handle_followup($id),
            'email'    => handle_set_email($id),
        };
    }
    // Agent hub: /api/agents/{id}/{action} and /api/keys/{id}/revoke
    if (preg_match('#^/api/agents/(\d+)/(test|delete|update|run)$#', $path, $m) && $method === 'POST') {
        $id = (int) $m[1];
        match ($m[2]) {
            'test'   => handle_test_agent($id),
            'delete' => handle_delete_agent($id),
            'update' => handle_update_agent($id),
            'run'    => handle_run_agent_now($id),
        };
    }
    if (preg_match('#^/api/keys/(\d+)/revoke$#', $path, $m) && $method === 'POST') {
        handle_revoke_key((int) $m[1]);
    }

    $route = "$method $path";
    match ($route) {
        'POST /api/login'       => handle_login(),
        'POST /api/register'    => handle_register(),
        'POST /api/logout'      => handle_logout(),
        'GET /api/me'           => handle_me(),
        'GET /api/profile'      => handle_get_profile(),
        'POST /api/profile'     => handle_set_profile(),
        'GET /api/stats'        => handle_stats(),
        'GET /api/leads'        => handle_leads(),
        'POST /api/leads'       => handle_create_lead(),
        'GET /api/leads/export' => handle_export(),
        'GET /api/bounces'      => handle_bounces(),
        'GET /api/activity'     => handle_activity(),
        'GET /api/users'        => handle_users(),
        'POST /api/users'       => handle_create_user(),
        'GET /api/keys'         => handle_list_keys(),
        'POST /api/keys'        => handle_create_key(),
        'GET /api/agents'       => handle_list_agents(),
        'POST /api/agents'      => handle_create_agent(),
        'POST /api/hunt/run'    => handle_hunt_run(),
        'GET /api/hunt/categories' => handle_hunt_categories(),
        'GET /api/hunt/report'  => handle_hunt_report(),
        default                 => json_err('לא נמצא: ' . $path, 404),
    };
} catch (Throwable $e) {
    json_err('שגיאת שרת: ' . $e->getMessage(), 500);
}
