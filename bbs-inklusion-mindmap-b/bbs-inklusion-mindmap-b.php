<?php
/**
 * Plugin Name:       BBS Wesermarsch – Inklusion Mindmap (Option B)
 * Plugin URI:        https://bbs-wesermarsch.de
 * Description:       "Focus Zoom Explorer" – interaktive Mindmap mit kreisförmiger Ripple-Animation. Klick auf ein Thema expandiert den Hintergrund aus dem Klickpunkt heraus. Shortcode: [bbs_mindmap_b] oder Elementor HTML-Widget.
 * Version:           1.0.0
 * Author:            BBS Wesermarsch
 * License:           GPL-2.0-or-later
 * Text Domain:       bbs-mindmap-b
 */

defined('ABSPATH') || exit;

define('BBS_MINDMAP_B_VERSION', '1.0.0');
define('BBS_MINDMAP_B_DIR',     plugin_dir_path(__FILE__));
define('BBS_MINDMAP_B_URL',     plugin_dir_url(__FILE__));

/* ── Assets ────────────────────────────────────────────────── */
function bbs_mindmap_b_assets() {
    wp_enqueue_style(
        'bbs-mindmap-b',
        BBS_MINDMAP_B_URL . 'assets/css/mindmap-b.css',
        [],
        BBS_MINDMAP_B_VERSION
    );

    wp_enqueue_script(
        'bbs-mindmap-b-data',
        BBS_MINDMAP_B_URL . 'assets/js/mindmap-data.js',
        [],
        BBS_MINDMAP_B_VERSION,
        true
    );

    wp_enqueue_script(
        'bbs-mindmap-b',
        BBS_MINDMAP_B_URL . 'assets/js/mindmap-b.js',
        ['bbs-mindmap-b-data'],
        BBS_MINDMAP_B_VERSION,
        true
    );
}
add_action('wp_enqueue_scripts', 'bbs_mindmap_b_assets');

/* ── Shortcode [bbs_mindmap_b] ─────────────────────────────── */
/**
 * Attribute:
 *   height  – Höhe des Widgets (Standard: 85vh). Empfohlen: mindestens 500px.
 *             Für Fullscreen-Feeling auf einer eigenen Seite: "100vh"
 *   class   – Zusätzliche CSS-Klassen
 *
 * Beispiele:
 *   [bbs_mindmap_b]
 *   [bbs_mindmap_b height="80vh"]
 *   [bbs_mindmap_b height="700px"]
 *
 * Hinweis: Für den besten Effekt das Widget auf einer eigenen Seite einbetten
 * und mit Elementor den Seiten-Abstand auf 0 setzen.
 */
function bbs_mindmap_b_shortcode($atts) {
    $atts = shortcode_atts([
        'height' => '85vh',
        'class'  => '',
    ], $atts, 'bbs_mindmap_b');

    $height       = esc_attr($atts['height']);
    $extra_class  = sanitize_html_class($atts['class']);
    $id           = 'bbs-mindmap-b-' . wp_unique_id();

    ob_start();
    ?>
    <div
        id="<?php echo esc_attr($id); ?>"
        class="bbs-mindmap-b-wrapper <?php echo $extra_class; ?>"
        style="position:relative; width:100%; height:<?php echo $height; ?>; overflow:hidden; border-radius:16px;"
    ></div>

    <style>
      /* Override fullscreen positioning for embedded widget */
      #<?php echo esc_attr($id); ?> .mm-screen {
        position: absolute !important;
      }
    </style>

    <script>
    (function() {
        function init() {
            var el = document.getElementById(<?php echo json_encode($id); ?>);
            if (el && typeof BBSMindmapB !== 'undefined' && typeof BBS_MINDMAP_DATA !== 'undefined') {
                new BBSMindmapB(el, BBS_MINDMAP_DATA);
            }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    })();
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('bbs_mindmap_b', 'bbs_mindmap_b_shortcode');
