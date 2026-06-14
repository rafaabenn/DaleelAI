<?php


//# Une seule fois après le clone ou le pull faire la cmd :
//cp back-end/config/ai.example.php back-end/config/ai.php
# Puis ouvrir ai.php et coller leur propre clé gsk_...

// =====================================================================
// Daleel AI - Groq AI Configuration
// =====================================================================
// 1. Créer un compte gratuit sur https://console.groq.com
// 2. Générer une API key (commence par gsk_...)
// 3. Copier CE fichier : cp config/ai.example.php config/ai.php
// 4. Coller ta clé ci-dessous
// =====================================================================

define('GROQ_API_KEY', 'YOUR_GROQ_API_KEY_HERE');
define('GROQ_MODEL',   'llama-3.3-70b-versatile');
