<?php
/**
 * Script d'import des outils IA depuis ai_tools_seed.json
 * À placer dans le dossier backend/ et exécuter UNE SEULE FOIS
 * URL: http://localhost/referentiel-ai/backend/import_tools.php
 */

require_once __DIR__ . '/config/db.php';
$pdo = DB::connect();

$jsonFile = __DIR__ . '/ai_tools_seed.json';

if (!file_exists($jsonFile)) {
    die(json_encode(["error" => "Fichier ai_tools_seed.json introuvable."]));
}

$outils = json_decode(file_get_contents($jsonFile), true);

if (!$outils) {
    die(json_encode(["error" => "Fichier JSON invalide."]));
}

$success = 0;
$skipped = 0;
$errors  = [];

foreach ($outils as $outil) {
    try {
        // Vérifier si l'outil existe déjà (par slug)
        $check = $pdo->prepare("SELECT id FROM ai_tools WHERE slug = ?");
        $check->execute([$outil['slug']]);
        if ($check->fetch()) {
            $skipped++;
            continue;
        }

        // Insérer l'outil
        $stmt = $pdo->prepare("
            INSERT INTO ai_tools 
                (name, slug, short_description, long_description, website_url, trial_url,
                 logo_url, gdpr_compliant, has_api, has_mobile_app, status, submitted_by, average_rating)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $outil['name'],
            $outil['slug'],
            $outil['short_description'],
            $outil['long_description'],
            $outil['website_url'],
            $outil['trial_url']    ?? null,
            $outil['logo_url']     ?? null,
            $outil['gdpr_compliant'],
            $outil['has_api'],
            $outil['has_mobile_app'],
            $outil['status']       ?? 'approved',
            $outil['submitted_by'] ?? 1,
            $outil['average_rating'] ?? 0.00,
        ]);

        $toolId = $pdo->lastInsertId();

        // Insérer les catégories
        if (!empty($outil['categories'])) {
            $stmtCat = $pdo->prepare(
                "INSERT IGNORE INTO tool_categories (tool_id, category_id) VALUES (?, ?)"
            );
            foreach ($outil['categories'] as $catId) {
                $stmtCat->execute([$toolId, $catId]);
            }
        }

        // Insérer les pricing models
        if (!empty($outil['pricing'])) {
            $stmtPrice = $pdo->prepare(
                "INSERT IGNORE INTO tool_pricing (tool_id, pricing_id) VALUES (?, ?)"
            );
            foreach ($outil['pricing'] as $priceId) {
                $stmtPrice->execute([$toolId, $priceId]);
            }
        }

        // Insérer les langues
        if (!empty($outil['languages'])) {
            $stmtLang = $pdo->prepare(
                "INSERT IGNORE INTO tool_languages (tool_id, language_id) VALUES (?, ?)"
            );
            foreach ($outil['languages'] as $langId) {
                $stmtLang->execute([$toolId, $langId]);
            }
        }

        $success++;

    } catch (PDOException $e) {
        $errors[] = "Erreur pour '{$outil['name']}': " . $e->getMessage();
    }
}

echo json_encode([
    "status"  => "terminé",
    "importés" => $success,
    "ignorés (déjà existants)" => $skipped,
    "erreurs" => $errors,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);