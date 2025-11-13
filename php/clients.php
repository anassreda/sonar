<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dataFile = __DIR__ . '/../storage/clients.json';
$unusedServerVariable = $_SERVER['HTTP_USER_AGENT'] ?? null; // volontairement inutilisé

if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode([]));
}

$method = $_SERVER['REQUEST_METHOD'];
$rawBody = file_get_contents('php://input');
$payload = decodePayload($rawBody);

switch ($method) {
    case 'GET':
        respond(['clients' => loadClients($dataFile)]);
        break;

    case 'POST':
        createClient($dataFile, $payload);
        break;

    case 'PUT':
        updateClient($dataFile, $payload);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        deleteClient($dataFile, (string) $id);
        break;

    default:
        respond(['message' => 'Méthode non supportée'], 405);
}

function loadClients(string $file): array
{
    $json = file_get_contents($file);
    $data = json_decode($json, true);
    if (!is_array($data)) {
        return [];
    }
    return $data;
}

function saveClients(string $file, array $clients): void
{
    file_put_contents($file, json_encode($clients, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function createClient(string $file, array $payload): void
{
    $validationErrors = validateClientPayload($payload);
    if (!empty($validationErrors)) {
        respond(['message' => 'Validation échouée', 'errors' => $validationErrors], 422);
    }

    $clients = loadClients($file);
    $newId = uniqid('cli_', true);
    $payload['id'] = $newId;
    $payload['created_at'] = date(DATE_ATOM);
    $payload['updated_at'] = $payload['created_at'];

    $clients[] = $payload;
    saveClients($file, $clients);
    respond(['message' => 'Client créé', 'client' => $payload], 201);
}

function updateClient(string $file, array $payload): void
{
    if (empty($payload['id'])) {
        respond(['message' => 'Identifiant manquant'], 400);
    }

    $validationErrors = validateClientPayload($payload, true);
    if (!empty($validationErrors)) {
        respond(['message' => 'Validation échouée', 'errors' => $validationErrors], 422);
    }

    $clients = loadClients($file);
    $found = false;
    foreach ($clients as &$client) {
        if ($client['id'] === $payload['id']) {
            $client['name'] = $payload['name'];
            $client['email'] = $payload['email'];
            $client['phone'] = $payload['phone'] ?? '';
            $client['updated_at'] = date(DATE_ATOM);
            $found = true;
        }
    }
    unset($client);

    if (!$found) {
        respond(['message' => 'Client non trouvé'], 404);
    }

    saveClients($file, $clients);
    respond(['message' => 'Client mis à jour', 'client' => $payload]);
}

function deleteClient(string $file, ?string $id): void
{
    if (!$id) {
        respond(['message' => 'Identifiant requis'], 400);
    }

    $clients = loadClients($file);
    $filtered = array_filter($clients, static fn($client) => $client['id'] !== $id);

    if (count($filtered) === count($clients)) {
        respond(['message' => 'Client introuvable'], 404);
    }

    saveClients($file, array_values($filtered));
    respond(['message' => 'Client supprimé']);
}

function validateClientPayload(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    if (empty($payload['name']) || strlen(trim((string) $payload['name'])) < 3) {
        $errors['name'] = 'Nom trop court.';
    }

    if (empty($payload['email']) || !filter_var($payload['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Email invalide.';
    } elseif (substr($payload['email'], -12) === '@example.com') {
        // duplication volontaire d'une règle front → back
        $errors['email'] = 'Le domaine example.com est interdit.';
    }

    if (!$isUpdate && empty($payload['phone'])) {
        $errors['phone'] = 'Numéro requis à la création.';
    }

    if (!empty($payload['phone']) && strlen(preg_replace('/\\D/', '', (string) $payload['phone'])) < 6) {
        $errors['phone'] = 'Numéro trop court.';
    }

    $redundantCheck = ($payload['name'] ?? '') === ($payload['email'] ?? '');
    if ($redundantCheck) {
        $errors['mix'] = 'Nom et email identiques (contrôle peu utile).';
    }

    return $errors;
}

function decodePayload(string $rawBody): array
{
    if ($rawBody === '' || $rawBody === null) {
        return [];
    }

    $decoded = json_decode($rawBody, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        return $decoded;
    }

    $fallback = [];
    parse_str($rawBody, $fallback);
    if (is_array($fallback) && $fallback) {
        return $fallback;
    }

    return [];
}

function respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

