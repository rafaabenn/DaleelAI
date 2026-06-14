<?php
// =====================================================================
// Daleel AI - Tool Controller
// =====================================================================

class ToolController {

    public static function getTools($filters) {
        $q = isset($filters['q']) ? trim($filters['q']) : '';
        $category_slug = isset($filters['category']) ? trim($filters['category']) : '';
        $pricing_id = isset($filters['pricing']) ? (int)$filters['pricing'] : 0;
        $language_id = isset($filters['language']) ? (int)$filters['language'] : 0;
        $gdpr = isset($filters['gdpr']) && $filters['gdpr'] === '1' ? 1 : 0;
        $api = isset($filters['api']) && $filters['api'] === '1' ? 1 : 0;
        $mobile = isset($filters['mobile']) && $filters['mobile'] === '1' ? 1 : 0;

        $pdo = DB::connect();

        try {
            $sql = "
                SELECT t.*,
                    (CASE
                        WHEN :q1 = '' THEN 80
                        WHEN t.name = :q2 THEN 100
                        WHEN t.name LIKE :q3 THEN 85
                        WHEN t.short_description LIKE :q4 THEN 60
                        WHEN t.long_description LIKE :q5 THEN 30
                        ELSE 0
                    END) AS score_relevance,
                    (t.average_rating * 20) AS score_rating,
                    (100 * EXP(-0.005 * GREATEST(DATEDIFF(NOW(), t.created_at), 0))) AS score_freshness,
                    (LEAST(
                        (COALESCE((SELECT COUNT(*) FROM clicks_logs WHERE tool_id = t.id), 0) +
                         COALESCE((SELECT COUNT(*) FROM favorites WHERE tool_id = t.id), 0) * 4) * 5,
                        100
                    )) AS score_popularity
                FROM ai_tools t
                WHERE t.status = 'approved'
            ";

            $params = [
                'q1' => $q,
                'q2' => $q,
                'q3' => '%' . $q . '%',
                'q4' => '%' . $q . '%',
                'q5' => '%' . $q . '%'
            ];

            if ($category_slug !== '') {
                $sql .= " AND t.id IN (
                    SELECT tc.tool_id
                    FROM tool_categories tc
                    JOIN categories c ON c.id = tc.category_id
                    WHERE c.slug = :category_slug
                )";
                $params['category_slug'] = $category_slug;
            }

            if ($pricing_id > 0) {
                $sql .= " AND t.id IN (SELECT tool_id FROM tool_pricing WHERE pricing_id = :pricing_id)";
                $params['pricing_id'] = $pricing_id;
            }

            if ($language_id > 0) {
                $sql .= " AND t.id IN (SELECT tool_id FROM tool_languages WHERE language_id = :language_id)";
                $params['language_id'] = $language_id;
            }

            if ($gdpr) {
                $sql .= " AND t.gdpr_compliant = 1";
            }
            if ($api) {
                $sql .= " AND t.has_api = 1";
            }
            if ($mobile) {
                $sql .= " AND t.has_mobile_app = 1";
            }

            $sql .= "
                ORDER BY (
                    score_relevance * 0.35 +
                    score_rating * 0.25 +
                    score_freshness * 0.20 +
                    score_popularity * 0.20
                ) DESC, t.name ASC
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $tools = $stmt->fetchAll();

            foreach ($tools as &$tool) {
                self::attachGlobalScore($tool);
                $tool['categories'] = self::getToolCategories($pdo, (int)$tool['id']);
                $tool['pricings'] = self::getToolPricings($pdo, (int)$tool['id']);
                $tool['languages'] = self::getToolLanguages($pdo, (int)$tool['id']);
            }

            echo json_encode(['success' => true, 'count' => count($tools), 'tools' => $tools]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la recherche : ' . $e->getMessage()]);
        }
    }

    public static function getFilters() {
        $pdo = DB::connect();

        try {
            $pricings = $pdo->query("SELECT * FROM pricing_models ORDER BY id")->fetchAll();

            echo json_encode([
                'success' => true,
                'categories' => $pdo->query("SELECT * FROM categories ORDER BY name")->fetchAll(),
                'pricing_models' => $pricings,
                'pricings' => $pricings,
                'languages' => $pdo->query("SELECT * FROM languages ORDER BY name")->fetchAll()
            ]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Impossible de charger les filtres : ' . $e->getMessage()]);
        }
    }

    public static function getToolDetail($tool_id, $user_id = 0) {
        if ($tool_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Identifiant d outil invalide.']);
            return;
        }

        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("
                SELECT t.*,
                    80 AS score_relevance,
                    (t.average_rating * 20) AS score_rating,
                    (100 * EXP(-0.005 * GREATEST(DATEDIFF(NOW(), t.created_at), 0))) AS score_freshness,
                    (LEAST(
                        (COALESCE((SELECT COUNT(*) FROM clicks_logs WHERE tool_id = t.id), 0) +
                         COALESCE((SELECT COUNT(*) FROM favorites WHERE tool_id = t.id), 0) * 4) * 5,
                        100
                    )) AS score_popularity
                FROM ai_tools t
                WHERE t.id = ? AND t.status = 'approved'
            ");
            $stmt->execute([$tool_id]);
            $tool = $stmt->fetch();

            if (!$tool) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Outil introuvable ou non publie.']);
                return;
            }

            self::attachGlobalScore($tool);
            $tool['categories'] = self::getToolCategories($pdo, $tool_id);
            $tool['pricings'] = self::getToolPricings($pdo, $tool_id);
            $tool['languages'] = self::getToolLanguages($pdo, $tool_id);

            $rev_stmt = $pdo->prepare("
                SELECT r.*, u.username
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                WHERE r.tool_id = ? AND r.status = 'approved'
                ORDER BY r.created_at DESC
            ");
            $rev_stmt->execute([$tool_id]);
            $tool['reviews'] = $rev_stmt->fetchAll();

            $tool['is_favorited'] = false;
            if ($user_id > 0) {
                $fav_stmt = $pdo->prepare("SELECT 1 FROM favorites WHERE user_id = ? AND tool_id = ?");
                $fav_stmt->execute([$user_id, $tool_id]);
                $tool['is_favorited'] = (bool)$fav_stmt->fetch();
            }

            echo json_encode(['success' => true, 'tool' => $tool]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la recuperation des details : ' . $e->getMessage()]);
        }
    }

    // ─── AI Validation (Gemini) with server-side rate limiting ──────────
    public static function aiValidate($data, $user_id) {
        require_once __DIR__ . '/../config/ai.php';

        if (!defined('GROQ_API_KEY') || GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
            http_response_code(503);
            echo json_encode(['success' => false, 'message' => 'Service de validation IA non configuré (clé manquante).']);
            return;
        }

        $pdo = DB::connect();

        // Server-side rate limiting: max 3 failed attempts, then 1-hour block
        $rl_stmt = $pdo->prepare("SELECT attempt_count, blocked_until FROM ai_validation_rate_limits WHERE user_id = ?");
        $rl_stmt->execute([$user_id]);
        $rl = $rl_stmt->fetch();
        $currentAttempts = 0;

        if ($rl) {
            if ($rl['blocked_until'] !== null) {
                $blockedUntil = new \DateTime($rl['blocked_until']);
                $now = new \DateTime();
                if ($now < $blockedUntil) {
                    $diff = $now->diff($blockedUntil);
                    $minutesLeft = max(1, ($diff->h * 60) + $diff->i + ($diff->s > 0 ? 1 : 0));
                    http_response_code(429);
                    echo json_encode([
                        'success'       => false,
                        'message'       => "Vous avez atteint la limite de tentatives. Veuillez réessayer dans environ {$minutesLeft} minute(s).",
                        'blocked_until' => $rl['blocked_until']
                    ]);
                    return;
                }
                // Block expired — reset counter
                $pdo->prepare("UPDATE ai_validation_rate_limits SET attempt_count = 0, blocked_until = NULL WHERE user_id = ?")
                    ->execute([$user_id]);
                $currentAttempts = 0;
            } else {
                $currentAttempts = (int)$rl['attempt_count'];
            }
        }

        $name       = trim($data['name'] ?? '');
        $website    = trim($data['website_url'] ?? '');
        $trial      = trim($data['trial_url'] ?? '');
        $logo       = trim($data['logo_url'] ?? '');
        $short_desc = trim($data['short_description'] ?? '');
        $long_desc  = trim($data['long_description'] ?? $data['full_description'] ?? '');
        $gdpr_lbl   = !empty($data['gdpr_compliant']) ? 'Oui' : 'Non';
        $api_lbl    = !empty($data['has_api'])         ? 'Oui' : 'Non';
        $mobile_lbl = !empty($data['has_mobile_app'])  ? 'Oui' : 'Non';

        $catIds = $data['categories'] ?? [];
        $prcIds = $data['pricings']   ?? [];
        $lngIds = $data['languages']  ?? [];

        $fetchNames = function($ids, $table, $col) use ($pdo) {
            if (empty($ids)) return [];
            $ph = implode(',', array_fill(0, count($ids), '?'));
            $s  = $pdo->prepare("SELECT $col FROM $table WHERE id IN ($ph)");
            $s->execute(array_map('intval', $ids));
            return array_column($s->fetchAll(), $col);
        };

        $catNames = $fetchNames($catIds, 'categories',     'name');
        $prcNames = $fetchNames($prcIds, 'pricing_models', 'name');
        $lngNames = $fetchNames($lngIds, 'languages',      'name');

        $prompt = "Tu es un validateur expert pour DaleelAI, une plateforme académique de référencement d'outils IA.\n\n"
            . "Analyse cette soumission d'outil IA.\n\n"
            . "Données :\n"
            . "Nom : {$name}\n"
            . "URL officielle : {$website}\n"
            . "URL essai : {$trial}\n"
            . "Logo : {$logo}\n"
            . "Description courte : {$short_desc}\n"
            . "Description complète : {$long_desc}\n"
            . "Catégories : " . implode(', ', $catNames) . "\n"
            . "Prix : " . implode(', ', $prcNames) . "\n"
            . "Langues : " . implode(', ', $lngNames) . "\n"
            . "RGPD : {$gdpr_lbl}\n"
            . "API : {$api_lbl}\n"
            . "Application mobile : {$mobile_lbl}\n\n"
            . "Ta mission :\n"
            . "1. Vérifie si l'outil semble réel et cohérent.\n"
            . "2. Vérifie si le nom correspond au domaine officiel.\n"
            . "3. Vérifie si la description courte est claire, professionnelle et entre 20 et 250 caractères.\n"
            . "4. Vérifie si la description complète est utile, précise et contient au moins 80 caractères.\n"
            . "5. Vérifie si les catégories, prix et langues semblent cohérents.\n"
            . "6. Détecte les textes de test, placeholders, informations vagues ou incohérentes.\n"
            . "7. Si quelque chose doit être corrigé, explique clairement quoi modifier à l'utilisateur.\n\n"
            . "Réponds uniquement en JSON valide avec cette structure exacte :\n\n"
            . '{"valid":true,"status":"accepted_for_admin_review","summary":"...","corrections":[],"improved_values":{"short_description":"...","long_description":"..."}}' . "\n\n"
            . "ou si invalide :\n\n"
            . '{"valid":false,"status":"needs_correction","summary":"...","corrections":[{"field":"nom_champ","reason":"...","suggestion":"..."}],"improved_values":{"short_description":"...","long_description":"..."}}';

        $apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

        $body = json_encode([
            'model'           => GROQ_MODEL,
            'messages'        => [
                ['role' => 'system', 'content' => 'Tu es un validateur expert pour DaleelAI. Réponds uniquement en JSON valide, sans markdown ni texte autour.'],
                ['role' => 'user',   'content' => $prompt]
            ],
            'response_format' => ['type' => 'json_object'],
            'temperature'     => 0.2
        ]);

        $ch = curl_init($apiUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $body,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . GROQ_API_KEY
            ],
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_SSL_VERIFYPEER => false, // certificats CA manquants sur Windows/WAMP en dev
            CURLOPT_SSL_VERIFYHOST => false,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (!$response || $httpCode !== 200) {
            http_response_code(503);
            echo json_encode(['success' => false, 'message' => 'Service IA temporairement indisponible (code ' . $httpCode . '). Réessayez dans quelques instants.']);
            return;
        }

        $raw     = json_decode($response, true);
        $jsonTxt = $raw['choices'][0]['message']['content'] ?? '';
        $result  = json_decode($jsonTxt, true);

        // Unparseable Gemini response → block submission per spec (no fallback pass-through)
        if (!$result || !array_key_exists('valid', $result)) {
            http_response_code(503);
            echo json_encode(['success' => false, 'message' => 'La validation IA est temporairement indisponible. Réessayez dans quelques instants.']);
            return;
        }

        if (!(bool)$result['valid']) {
            $newAttempts = $currentAttempts + 1;
            $blockedUntilVal = $newAttempts >= 3 ? (new \DateTime('+1 hour'))->format('Y-m-d H:i:s') : null;

            $pdo->prepare("
                INSERT INTO ai_validation_rate_limits (user_id, attempt_count, blocked_until)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE attempt_count = VALUES(attempt_count), blocked_until = VALUES(blocked_until)
            ")->execute([$user_id, $newAttempts, $blockedUntilVal]);

            echo json_encode([
                'success'         => true,
                'valid'           => false,
                'attempt'         => $newAttempts,
                'status'          => $result['status'] ?? 'needs_correction',
                'summary'         => $result['summary'] ?? '',
                'corrections'     => $result['corrections'] ?? [],
                'improved_values' => $result['improved_values'] ?? []
            ]);
        } else {
            // Reset rate limit counter on successful validation
            $pdo->prepare("
                INSERT INTO ai_validation_rate_limits (user_id, attempt_count, blocked_until)
                VALUES (?, 0, NULL)
                ON DUPLICATE KEY UPDATE attempt_count = 0, blocked_until = NULL
            ")->execute([$user_id]);

            echo json_encode([
                'success'         => true,
                'valid'           => true,
                'attempt'         => $currentAttempts + 1,
                'status'          => $result['status'] ?? 'accepted_for_admin_review',
                'summary'         => $result['summary'] ?? '',
                'corrections'     => [],
                'improved_values' => $result['improved_values'] ?? []
            ]);
        }
    }

    // ─── Submit Tool (saves into tool_submissions, not ai_tools) ───────
    public static function submitTool($data, $user_id) {
        $name       = trim($data['name'] ?? '');
        $short_desc = trim($data['short_description'] ?? '');
        $long_desc  = trim($data['long_description'] ?? $data['full_description'] ?? '');
        $website_url= trim($data['website_url'] ?? '');
        $trial_url  = trim($data['trial_url'] ?? '');
        $logo_url   = trim($data['logo_url'] ?? '');
        $gdpr       = !empty($data['gdpr_compliant']) ? 1 : 0;
        $api        = !empty($data['has_api'])         ? 1 : 0;
        $mobile     = !empty($data['has_mobile_app'])  ? 1 : 0;
        $categories = $data['categories'] ?? ($data['category_id'] ? [$data['category_id']] : []);
        $pricings   = $data['pricings']   ?? ($data['pricing_model_id'] ? [$data['pricing_model_id']] : []);
        $languages  = $data['languages']  ?? [];
        $ai_summary = trim($data['ai_summary'] ?? '');

        if ($name === '' || $short_desc === '' || $long_desc === '' || $website_url === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Champs obligatoires manquants (nom, descriptions, URL).']);
            return;
        }

        $pdo = DB::connect();

        try {
            // Block duplicates in published catalogue
            $dup = $pdo->prepare("SELECT id FROM ai_tools WHERE LOWER(name) = LOWER(?) OR website_url = ?");
            $dup->execute([$name, $website_url]);
            if ($dup->fetch()) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Cet outil existe déjà dans le catalogue publié.']);
                return;
            }

            // Block duplicate pending submissions from same user
            $dupSub = $pdo->prepare("SELECT id FROM tool_submissions WHERE user_id = ? AND (LOWER(name) = LOWER(?) OR website_url = ?) AND status IN ('pending','processing')");
            $dupSub->execute([$user_id, $name, $website_url]);
            if ($dupSub->fetch()) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Vous avez déjà une soumission en attente pour cet outil.']);
                return;
            }

            $ins = $pdo->prepare("
                INSERT INTO tool_submissions
                    (user_id, name, short_description, long_description, website_url,
                     trial_url, logo_url, gdpr_compliant, has_api, has_mobile_app,
                     categories_ids, pricings_ids, languages_ids, ai_summary)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $ins->execute([
                $user_id, $name, $short_desc, $long_desc, $website_url,
                $trial_url !== '' ? $trial_url : null,
                $logo_url  !== '' ? $logo_url  : null,
                $gdpr, $api, $mobile,
                json_encode(array_values(array_map('intval', array_filter($categories)))),
                json_encode(array_values(array_map('intval', array_filter($pricings)))),
                json_encode(array_values(array_map('intval', array_filter($languages)))),
                $ai_summary
            ]);

            $submission_id = (int)$pdo->lastInsertId();

            try {
                $pdo->prepare("INSERT INTO notifications (user_id, tool_id, type, message) VALUES (?, 0, 'submission_status', ?)")
                    ->execute([$user_id, "Votre soumission '{$name}' a été envoyée et attend la validation d'un administrateur."]);
                $admins = $pdo->query("SELECT id FROM users WHERE role_id = 1")->fetchAll();
                $an = $pdo->prepare("INSERT INTO notifications (user_id, tool_id, type, message) VALUES (?, 0, 'admin_message', ?)");
                foreach ($admins as $a) { $an->execute([$a['id'], "Nouvelle soumission en attente : '{$name}'."]); }
            } catch (\PDOException $ignored) {}

            http_response_code(201);
            echo json_encode([
                'success'       => true,
                'message'       => "Votre soumission pour '{$name}' a été envoyée à l'administrateur pour validation.",
                'submission_id' => $submission_id,
            ]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la soumission : ' . $e->getMessage()]);
        }
    }

    public static function getMySubmissions($user_id) {
        $pdo = DB::connect();
        try {
            $stmt = $pdo->prepare("
                SELECT *, submitted_at AS created_at
                FROM tool_submissions
                WHERE user_id = ?
                ORDER BY submitted_at DESC
            ");
            $stmt->execute([$user_id]);
            $submissions = $stmt->fetchAll();
            foreach ($submissions as &$s) {
                $s['category_ids'] = json_decode($s['categories_ids'] ?? '[]', true) ?: [];
                $s['pricing_ids']  = json_decode($s['pricings_ids']   ?? '[]', true) ?: [];
                $s['language_ids'] = json_decode($s['languages_ids']  ?? '[]', true) ?: [];
            }
            unset($s);
            echo json_encode(['success' => true, 'submissions' => $submissions]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Impossible de récupérer vos soumissions : ' . $e->getMessage()]);
        }
    }

    public static function resubmitTool($data, $user_id) {
        $tool_id = isset($data['tool_id']) ? (int)$data['tool_id'] : 0;
        $name = isset($data['name']) ? trim($data['name']) : '';
        $short_desc = isset($data['short_description']) ? trim($data['short_description']) : '';
        $long_desc = isset($data['long_description']) ? trim($data['long_description']) : (isset($data['full_description']) ? trim($data['full_description']) : '');
        $website_url = isset($data['website_url']) ? trim($data['website_url']) : '';
        $trial_url = isset($data['trial_url']) ? trim($data['trial_url']) : '';
        $logo_url = isset($data['logo_url']) ? trim($data['logo_url']) : '';
        $gdpr = isset($data['gdpr_compliant']) && $data['gdpr_compliant'] ? 1 : 0;
        $api = isset($data['has_api']) && $data['has_api'] ? 1 : 0;
        $mobile = isset($data['has_mobile_app']) && $data['has_mobile_app'] ? 1 : 0;
        $categories = isset($data['categories']) ? $data['categories'] : (isset($data['category_id']) ? [$data['category_id']] : []);
        $pricings = isset($data['pricings']) ? $data['pricings'] : (isset($data['pricing_model_id']) ? [$data['pricing_model_id']] : []);
        $languages = isset($data['languages']) ? $data['languages'] : [];

        if ($tool_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Soumission a corriger introuvable.']);
            return;
        }

        $ai_summary = isset($data['ai_summary']) ? trim($data['ai_summary']) : null;
        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("SELECT id, name FROM tool_submissions WHERE id = ? AND user_id = ? AND status IN ('processing','rejected')");
            $stmt->execute([$tool_id, $user_id]);
            $existing = $stmt->fetch();

            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Aucune soumission modifiable trouvée pour votre compte.']);
                return;
            }

            $upd = $pdo->prepare("
                UPDATE tool_submissions
                SET name = ?, short_description = ?, long_description = ?, website_url = ?,
                    trial_url = ?, logo_url = ?, gdpr_compliant = ?, has_api = ?, has_mobile_app = ?,
                    categories_ids = ?, pricings_ids = ?, languages_ids = ?,
                    ai_summary = ?, status = 'pending', admin_comment = NULL, updated_at = NOW()
                WHERE id = ? AND user_id = ?
            ");
            $upd->execute([
                $name, $short_desc, $long_desc, $website_url,
                $trial_url !== '' ? $trial_url : null,
                $logo_url  !== '' ? $logo_url  : null,
                $gdpr, $api, $mobile,
                json_encode(array_values(array_map('intval', array_filter($categories)))),
                json_encode(array_values(array_map('intval', array_filter($pricings)))),
                json_encode(array_values(array_map('intval', array_filter($languages)))),
                $ai_summary,
                $tool_id, $user_id
            ]);

            try {
                $pdo->prepare("INSERT INTO notifications (user_id, tool_id, type, message) VALUES (?, 0, 'submission_status', ?)")
                    ->execute([$user_id, "Votre correction pour '{$name}' a été renvoyée à l'administrateur."]);
            } catch (\PDOException $ignored) {}

            echo json_encode(['success' => true, 'message' => "Correction envoyée. L'outil est de nouveau en attente de validation.", 'submission_id' => $tool_id]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la correction : ' . $e->getMessage()]);
        }
    }

    public static function updateStatus($data) {
        $tool_id = isset($data['tool_id']) ? (int)$data['tool_id'] : 0;
        $status = isset($data['status']) ? trim($data['status']) : '';
        $allowedStatuses = ['pending', 'approved', 'rejected', 'processing'];

        if ($tool_id <= 0 || !in_array($status, $allowedStatuses, true)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Donnees invalides. Statut attendu : pending, approved, rejected ou processing.']);
            return;
        }

        $pdo = DB::connect();

        try {
            $toolStmt = $pdo->prepare("SELECT name, submitted_by FROM ai_tools WHERE id = ?");
            $toolStmt->execute([$tool_id]);
            $tool = $toolStmt->fetch();

            $stmt = $pdo->prepare("UPDATE ai_tools SET status = ? WHERE id = ?");
            $stmt->execute([$status, $tool_id]);

            if ($tool && !empty($tool['submitted_by'])) {
                $notificationMessage = "Le statut de votre soumission '" . $tool['name'] . "' est maintenant : " . $status . ".";
                $notifStmt = $pdo->prepare("INSERT INTO notifications (user_id, tool_id, type, message) VALUES (?, ?, 'submission_status', ?)");
                $notifStmt->execute([$tool['submitted_by'], $tool_id, $notificationMessage]);
            }

            echo json_encode(['success' => true, 'message' => "Statut mis a jour : $status", 'tool_id' => $tool_id, 'status' => $status]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function getNotifications($user_id) {
        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("SELECT n.* FROM notifications n WHERE n.user_id = ? ORDER BY n.created_at DESC");
            $stmt->execute([$user_id]);
            echo json_encode(['success' => true, 'notifications' => $stmt->fetchAll()]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Impossible de recuperer les notifications : ' . $e->getMessage()]);
        }
    }

    public static function markNotificationRead($data, $user_id) {
        $notification_id = isset($data['notification_id']) ? (int)$data['notification_id'] : 0;
        if ($notification_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Identifiant de notification invalide.']);
            return;
        }

        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("UPDATE notifications SET status = 'read' WHERE id = ? AND user_id = ?");
            $stmt->execute([$notification_id, $user_id]);
            echo json_encode(['success' => true, 'message' => 'Notification marquee comme lue.']);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Impossible de mettre a jour la notification : ' . $e->getMessage()]);
        }
    }

    public static function toggleFavorite($tool_id, $user_id) {
        if ($tool_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Identifiant d outil manquant.']);
            return;
        }

        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("SELECT 1 FROM favorites WHERE user_id = ? AND tool_id = ?");
            $stmt->execute([$user_id, $tool_id]);

            if ($stmt->fetch()) {
                $del_stmt = $pdo->prepare("DELETE FROM favorites WHERE user_id = ? AND tool_id = ?");
                $del_stmt->execute([$user_id, $tool_id]);
                echo json_encode(['success' => true, 'is_favorited' => false, 'message' => 'Retire de vos favoris.']);
            } else {
                $add_stmt = $pdo->prepare("INSERT INTO favorites (user_id, tool_id) VALUES (?, ?)");
                $add_stmt->execute([$user_id, $tool_id]);
                echo json_encode(['success' => true, 'is_favorited' => true, 'message' => 'Ajoute a vos favoris avec succes.']);
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la modification des favoris : ' . $e->getMessage()]);
        }
    }

    public static function getFavorites($user_id) {
        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("
                SELECT t.*
                FROM ai_tools t
                JOIN favorites f ON t.id = f.tool_id
                WHERE f.user_id = ? AND t.status = 'approved'
                ORDER BY f.created_at DESC
            ");
            $stmt->execute([$user_id]);
            $tools = $stmt->fetchAll();

            foreach ($tools as &$tool) {
                $tool['categories'] = self::getToolCategories($pdo, (int)$tool['id']);
            }

            echo json_encode(['success' => true, 'tools' => $tools]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Impossible de recuperer les favoris : ' . $e->getMessage()]);
        }
    }

    public static function submitReview($data, $user_id) {
        $tool_id = isset($data['tool_id']) ? (int)$data['tool_id'] : 0;
        $rating = isset($data['rating']) ? (int)$data['rating'] : 0;
        $comment = isset($data['comment']) ? trim($data['comment']) : '';

        if ($tool_id <= 0 || $rating < 1 || $rating > 5 || $comment === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Veuillez saisir une note de 1 a 5 et un commentaire.']);
            return;
        }

        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("SELECT id FROM reviews WHERE user_id = ? AND tool_id = ?");
            $stmt->execute([$user_id, $tool_id]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Vous avez deja evalue cet outil.']);
                return;
            }

            $pdo->beginTransaction();

            $ins_stmt = $pdo->prepare("INSERT INTO reviews (user_id, tool_id, rating, comment, status) VALUES (?, ?, ?, ?, 'pending')");
            $ins_stmt->execute([$user_id, $tool_id, $rating, $comment]);

            $calc_stmt = $pdo->prepare("SELECT AVG(rating) AS avg_rating FROM reviews WHERE tool_id = ? AND status = 'approved'");
            $calc_stmt->execute([$tool_id]);
            $res = $calc_stmt->fetch();
            $avg = $res['avg_rating'] !== null ? round((float)$res['avg_rating'], 2) : 0.00;

            $upd_stmt = $pdo->prepare("UPDATE ai_tools SET average_rating = ? WHERE id = ?");
            $upd_stmt->execute([$avg, $tool_id]);

            $pdo->commit();

            echo json_encode(['success' => true, 'message' => 'Merci pour votre evaluation. Votre avis a ete publie.', 'average_rating' => $avg]);
        } catch (\PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la soumission de l avis : ' . $e->getMessage()]);
        }
    }

    private static function attachGlobalScore(array &$tool): void {
        $tool['score_relevance'] = isset($tool['score_relevance']) ? (float)$tool['score_relevance'] : 0.0;
        $tool['score_rating'] = isset($tool['score_rating']) ? (float)$tool['score_rating'] : 0.0;
        $tool['score_freshness'] = isset($tool['score_freshness']) ? (float)$tool['score_freshness'] : 0.0;
        $tool['score_popularity'] = isset($tool['score_popularity']) ? (float)$tool['score_popularity'] : 0.0;
        $tool['global_score'] = round(
            ($tool['score_relevance'] * 0.35) +
            ($tool['score_rating'] * 0.25) +
            ($tool['score_freshness'] * 0.20) +
            ($tool['score_popularity'] * 0.20),
            1
        );
    }

    private static function getToolCategories($pdo, $tool_id): array {
        $stmt = $pdo->prepare("
            SELECT c.*
            FROM categories c
            JOIN tool_categories tc ON c.id = tc.category_id
            WHERE tc.tool_id = ?
            ORDER BY c.name
        ");
        $stmt->execute([$tool_id]);
        return $stmt->fetchAll();
    }

    private static function getToolPricings($pdo, $tool_id): array {
        $stmt = $pdo->prepare("
            SELECT p.*
            FROM pricing_models p
            JOIN tool_pricing tp ON p.id = tp.pricing_id
            WHERE tp.tool_id = ?
            ORDER BY p.id
        ");
        $stmt->execute([$tool_id]);
        return $stmt->fetchAll();
    }

    private static function getToolLanguages($pdo, $tool_id): array {
        $stmt = $pdo->prepare("
            SELECT l.*
            FROM languages l
            JOIN tool_languages tl ON l.id = tl.language_id
            WHERE tl.tool_id = ?
            ORDER BY l.name
        ");
        $stmt->execute([$tool_id]);
        return $stmt->fetchAll();
    }

    public static function logClick($tool_id, $user_id) {
        if ($tool_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID outil invalide.']);
            return;
        }
        $pdo = DB::connect();
        try {
            $stmt = $pdo->prepare("INSERT INTO clicks_logs (tool_id, user_id, action_type) VALUES (?, ?, 'click')");
            $stmt->execute([$tool_id, $user_id > 0 ? $user_id : null]);
            echo json_encode(['success' => true]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function getRecommended($user_id) {
        $pdo = DB::connect();
        try {
            // Top catégories : favoris (poids 3) + clics des 30 derniers jours (poids 1)
            $catStmt = $pdo->prepare("
                SELECT category_id, SUM(w) AS total_weight
                FROM (
                    SELECT tc.category_id, 3 AS w
                    FROM favorites f
                    JOIN tool_categories tc ON tc.tool_id = f.tool_id
                    WHERE f.user_id = :uid1
                    UNION ALL
                    SELECT tc.category_id, 1 AS w
                    FROM clicks_logs cl
                    JOIN tool_categories tc ON tc.tool_id = cl.tool_id
                    WHERE cl.user_id = :uid2
                    AND cl.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                ) interactions
                GROUP BY category_id
                ORDER BY total_weight DESC
                LIMIT 3
            ");
            $catStmt->execute([':uid1' => $user_id, ':uid2' => $user_id]);
            $topCategories = $catStmt->fetchAll();

            if (empty($topCategories)) {
                echo json_encode(['success' => true, 'tools' => [], 'has_profile' => false]);
                return;
            }

            $categoryIds = array_column($topCategories, 'category_id');
            $placeholders = implode(',', array_fill(0, count($categoryIds), '?'));
            $params = array_merge($categoryIds, [$user_id]);

            $toolStmt = $pdo->prepare("
                SELECT DISTINCT t.*,
                    80 AS score_relevance,
                    (t.average_rating * 20) AS score_rating,
                    (100 * EXP(-0.005 * GREATEST(DATEDIFF(NOW(), t.created_at), 0))) AS score_freshness,
                    (LEAST(
                        (COALESCE((SELECT COUNT(*) FROM clicks_logs WHERE tool_id = t.id), 0) +
                         COALESCE((SELECT COUNT(*) FROM favorites WHERE tool_id = t.id), 0) * 4) * 5,
                        100
                    )) AS score_popularity
                FROM ai_tools t
                JOIN tool_categories tc ON tc.tool_id = t.id
                WHERE t.status = 'approved'
                AND tc.category_id IN ($placeholders)
                AND t.id NOT IN (
                    SELECT tool_id FROM favorites WHERE user_id = ?
                )
                ORDER BY (
                    (t.average_rating * 20) * 0.40 +
                    (100 * EXP(-0.005 * GREATEST(DATEDIFF(NOW(), t.created_at), 0))) * 0.30 +
                    (LEAST(
                        (COALESCE((SELECT COUNT(*) FROM clicks_logs WHERE tool_id = t.id), 0) +
                         COALESCE((SELECT COUNT(*) FROM favorites WHERE tool_id = t.id), 0) * 4) * 5,
                        100
                    )) * 0.30
                ) DESC
                LIMIT 6
            ");
            $toolStmt->execute($params);
            $tools = $toolStmt->fetchAll();

            foreach ($tools as &$tool) {
                self::attachGlobalScore($tool);
                $tool['categories'] = self::getToolCategories($pdo, (int)$tool['id']);
                $tool['pricings']   = self::getToolPricings($pdo, (int)$tool['id']);
                $tool['languages']  = self::getToolLanguages($pdo, (int)$tool['id']);
                $tool['is_favorited'] = false;
            }

            echo json_encode([
                'success'              => true,
                'tools'                => $tools,
                'has_profile'          => true,
                'based_on_categories'  => count($topCategories)
            ]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
