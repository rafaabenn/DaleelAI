<?php
// =====================================================================
// Daleel AI - Chatbot Controller (Local Intelligent NLP Recommender)
// =====================================================================

class ChatbotController {

    /**
     * Retrieves active chat sessions for the logged-in user.
     */
    public static function getConversations($user_id) {
        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("SELECT * FROM chatbot_conversations WHERE user_id = ? ORDER BY created_at DESC");
            $stmt->execute([$user_id]);
            $convs = $stmt->fetchAll();

            echo json_encode([
                'success' => true,
                'conversations' => $convs
            ]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur lors du chargement de l\'historique : ' . $e->getMessage()]);
        }
    }

    /**
     * Retrieves messages within a specific conversation.
     */
    public static function getMessages($conversation_id, $user_id) {
        if ($conversation_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Identifiant de conversation manquant.']);
            return;
        }

        $pdo = DB::connect();

        try {
            // Security check: ensure conversation belongs to current user
            $stmt = $pdo->prepare("SELECT user_id FROM chatbot_conversations WHERE id = ?");
            $stmt->execute([$conversation_id]);
            $conv = $stmt->fetch();

            if (!$conv || (int)$conv['user_id'] !== (int)$user_id) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Accès non autorisé à cette conversation.']);
                return;
            }

            $msg_stmt = $pdo->prepare("SELECT * FROM chatbot_messages WHERE conversation_id = ? ORDER BY created_at ASC");
            $msg_stmt->execute([$conversation_id]);
            $messages = $msg_stmt->fetchAll();

            echo json_encode([
                'success' => true,
                'messages' => $messages
            ]);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la lecture des messages : ' . $e->getMessage()]);
        }
    }

    /**
     * Receives user prompt, runs the Intelligent Suggestion Engine, and saves the discussion.
     */
    public static function sendMessage($data, $user_id) {
        $message = isset($data['message']) ? trim($data['message']) : '';
        $conv_id = isset($data['conversation_id']) ? (int)$data['conversation_id'] : 0;

        if (empty($message)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Le message ne peut pas être vide.']);
            return;
        }

        $pdo = DB::connect();

        try {
            $pdo->beginTransaction();

            // 1. Create a new conversation if it does not exist
            if ($conv_id <= 0) {
                $title = mb_substr($message, 0, 30);
                if (mb_strlen($message) > 30) $title .= '...';
                
                $ins_conv = $pdo->prepare("INSERT INTO chatbot_conversations (user_id, title) VALUES (?, ?)");
                $ins_conv->execute([$user_id, $title]);
                $conv_id = $pdo->lastInsertId();
            } else {
                // Verify conversation ownership
                $stmt = $pdo->prepare("SELECT user_id FROM chatbot_conversations WHERE id = ?");
                $stmt->execute([$conv_id]);
                $conv = $stmt->fetch();
                if (!$conv || (int)$conv['user_id'] !== (int)$user_id) {
                    $pdo->rollBack();
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Accès interdit.']);
                    return;
                }
            }

            // 2. Save User Message
            $ins_msg = $pdo->prepare("INSERT INTO chatbot_messages (conversation_id, sender, message) VALUES (?, 'user', ?)");
            $ins_msg->execute([$conv_id, $message]);

            // 3. EXECUTE THE INTELLIGENT OFFLINE NLP RECOMMENDATION ENGINE
            // We analyze search terms and map them to pricing, categories, and tags.
            $prompt_lower = mb_strtolower($message);

            // Setup criteria
            $pricing_filter = null; // pricing_models.id
            $category_filter = null; // categories.id
            $language_filter = null; // languages.id
            $gdpr_filter = false;
            $api_filter = false;

            // Detect economic model intent
            if (strpos($prompt_lower, 'gratuit') !== false || strpos($prompt_lower, 'free') !== false) {
                $pricing_filter = [1, 2, 4]; // Gratuit, Freemium, Essai Gratuit
            } else if (strpos($prompt_lower, 'payant') !== false || strpos($prompt_lower, 'abonnement') !== false) {
                $pricing_filter = [3]; // Payant
            }

            // Detect category intent (semantic keywords)
            if (strpos($prompt_lower, 'code') !== false || strpos($prompt_lower, 'developpe') !== false || strpos($prompt_lower, 'programmation') !== false || strpos($prompt_lower, 'script') !== false) {
                $category_filter = 3; // Développement
            } else if (strpos($prompt_lower, 'image') !== false || strpos($prompt_lower, 'photo') !== false || strpos($prompt_lower, 'dessin') !== false || strpos($prompt_lower, 'visuel') !== false || strpos($prompt_lower, 'design') !== false) {
                $category_filter = 2; // Vision
            } else if (strpos($prompt_lower, 'texte') !== false || strpos($prompt_lower, 'rediger') !== false || strpos($prompt_lower, 'ecrire') !== false || strpos($prompt_lower, 'tradui') !== false || strpos($prompt_lower, 'nlp') !== false || strpos($prompt_lower, 'langue') !== false) {
                $category_filter = 1; // Traitement du langage
            } else if (strpos($prompt_lower, 'productivite') !== false || strpos($prompt_lower, 'recherche') !== false || strpos($prompt_lower, 'note') !== false || strpos($prompt_lower, 'memoire') !== false) {
                $category_filter = 4; // Productivité & Recherche
            } else if (strpos($prompt_lower, 'musique') !== false || strpos($prompt_lower, 'audio') !== false || strpos($prompt_lower, 'chanson') !== false || strpos($prompt_lower, 'voix') !== false || strpos($prompt_lower, 'synthese vocale') !== false) {
                $category_filter = 5; // Audio
            }

            // Detect extra criteria
            if (strpos($prompt_lower, 'rgpd') !== false || strpos($prompt_lower, 'gdpr') !== false || strpos($prompt_lower, 'donnee') !== false) {
                $gdpr_filter = true;
            }
            if (strpos($prompt_lower, 'api') !== false || strpos($prompt_lower, 'developpeur') !== false) {
                $api_filter = true;
            }

            // Detect language intent
            if (strpos($prompt_lower, 'francais') !== false || strpos($prompt_lower, 'français') !== false || strpos($prompt_lower, ' en fr') !== false) {
                $language_filter = 1; // Français
            } else if (strpos($prompt_lower, 'anglais') !== false || strpos($prompt_lower, 'english') !== false || strpos($prompt_lower, ' en ang') !== false) {
                $language_filter = 2; // Anglais
            } else if (strpos($prompt_lower, 'arabe') !== false || strpos($prompt_lower, 'arabic') !== false) {
                $language_filter = 3; // Arabe
            }

            // Query database for matched tools
            $sql = "SELECT t.* FROM ai_tools t WHERE t.status = 'approved'";
            $params = [];

            if ($category_filter !== null) {
                $sql .= " AND t.id IN (SELECT tool_id FROM tool_categories WHERE category_id = :cat)";
                $params['cat'] = $category_filter;
            }

            if ($pricing_filter !== null) {
                $sql .= " AND t.id IN (SELECT tool_id FROM tool_pricing WHERE pricing_id IN (" . implode(',', $pricing_filter) . "))";
            }

            if ($language_filter !== null) {
                $sql .= " AND t.id IN (SELECT tool_id FROM tool_languages WHERE language_id = :lang)";
                $params['lang'] = $language_filter;
            }

            if ($gdpr_filter) {
                $sql .= " AND t.gdpr_compliant = 1";
            }

            if ($api_filter) {
                $sql .= " AND t.has_api = 1";
            }

            $search_stmt = $pdo->prepare($sql);
            $search_stmt->execute($params);
            $matched_tools = $search_stmt->fetchAll();

            // Format response text with citations
            if (!empty($matched_tools)) {
                // Limit to 3 suggestions for crisp display
                $matched_tools = array_slice($matched_tools, 0, 3);
                
                $response = "J'ai analysé votre besoin universitaire ! 🎓\n\nVoici les meilleurs outils d'IA indexés sur **Daleel AI** qui correspondent parfaitement à vos critères :\n\n";
                foreach ($matched_tools as $index => $tool) {
                    $num = $index + 1;
                    $response .= "{$num}. **{$tool['name']}** (" . (float)$tool['average_rating'] . "★) : {$tool['short_description']}\n";
                    $response .= "   *🔍 Particularités : " . ($tool['gdpr_compliant'] ? '✓ Conforme RGPD' : '✗ Non RGPD') . " | " . ($tool['has_api'] ? '✓ API disponible' : '✗ Pas d\'API') . "*\n";
                    $response .= "   *🔗 Action : [Consulter Fiche](#tool-{$tool['id']}) et lancer [Essai Gratuit]({$tool['trial_url']})*\n\n";
                }
                $response .= "Souhaitez-vous affiner ces résultats en ajoutant d'autres critères (par exemple une langue spécifique ou un autre modèle de prix) ?";
            } else {
                // General response if no direct match
                $response = "Je n'ai pas trouvé d'outils correspondant précisément à tous ces critères combinés. 🧐\n\nCependant, en tant que conseiller d'orientation Daleel AI, je vous suggère de consulter nos outils d'IA académiques les mieux notés :\n\n";
                
                $top_tools = $pdo->query("SELECT * FROM ai_tools WHERE status = 'approved' ORDER BY average_rating DESC LIMIT 3")->fetchAll();
                foreach ($top_tools as $index => $tool) {
                    $num = $index + 1;
                    $response .= "{$num}. **{$tool['name']}** (" . (float)$tool['average_rating'] . "★) : {$tool['short_description']} ([Voir fiche](#tool-{$tool['id']}))\n";
                }
                $response .= "\nN'hésitez pas à reformuler votre recherche en indiquant par exemple 'générer du texte en français' ou 'coder en javascript'.";
            }

            // 4. Save Assistant Response Message
            $ins_reply = $pdo->prepare("INSERT INTO chatbot_messages (conversation_id, sender, message) VALUES (?, 'assistant', ?)");
            $ins_reply->execute([$conv_id, $response]);

            $pdo->commit();

            // Return new messages details
            echo json_encode([
                'success' => true,
                'conversation_id' => $conv_id,
                'user_message' => $message,
                'assistant_message' => $response,
                'matched_tools' => $matched_tools
            ]);

        } catch (\PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur de discussion du chatbot : ' . $e->getMessage()]);
        }
    }
}
