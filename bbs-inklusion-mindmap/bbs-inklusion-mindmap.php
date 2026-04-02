<?php
/**
 * Plugin Name:       BBS Wesermarsch – Inklusion Mindmap
 * Plugin URI:        https://bbs-wesermarsch.de
 * Description:       Interaktive, animierte Mindmap zur Inklusion an den BBS Wesermarsch. Responsive: Deskt­op-Mindmap mit SVG-Kurven + Mobile Card-Navigation. Einbindung via Shortcode [bbs_mindmap] oder Elementor HTML-Widget.
 * Version:           1.0.0
 * Author:            BBS Wesermarsch
 * License:           GPL-2.0-or-later
 * Text Domain:       bbs-mindmap
 */

defined('ABSPATH') || exit;

define('BBS_MINDMAP_VERSION', '1.0.0');
define('BBS_MINDMAP_DIR',     plugin_dir_path(__FILE__));
define('BBS_MINDMAP_URL',     plugin_dir_url(__FILE__));

/* ── Enqueue assets ─────────────────────────────────────── */
function bbs_mindmap_enqueue_assets() {
    wp_enqueue_style(
        'bbs-mindmap',
        BBS_MINDMAP_URL . 'assets/css/mindmap.css',
        [],
        BBS_MINDMAP_VERSION
    );

    wp_enqueue_script(
        'bbs-mindmap-data',
        BBS_MINDMAP_URL . 'assets/js/mindmap-data.js',
        [],
        BBS_MINDMAP_VERSION,
        true
    );

    wp_enqueue_script(
        'bbs-mindmap',
        BBS_MINDMAP_URL . 'assets/js/mindmap.js',
        ['bbs-mindmap-data'],
        BBS_MINDMAP_VERSION,
        true
    );
}
add_action('wp_enqueue_scripts', 'bbs_mindmap_enqueue_assets');

/* ── Shortcode [bbs_mindmap] ────────────────────────────── */
/**
 * Attributes:
 *   height      – min-height of the desktop canvas, e.g. "700px" (default: auto)
 *   class       – extra CSS classes on the wrapper div
 *
 * Example:
 *   [bbs_mindmap height="750px"]
 */
function bbs_mindmap_shortcode($atts) {
    $atts = shortcode_atts([
        'height' => '',
        'class'  => '',
    ], $atts, 'bbs_mindmap');

    $extra_class  = sanitize_html_class($atts['class']);
    $inline_style = $atts['height'] ? 'min-height:' . esc_attr($atts['height']) . ';' : '';

    $id = 'bbs-mindmap-' . wp_unique_id();

    ob_start();
    ?>
    <div
        id="<?php echo esc_attr($id); ?>"
        class="bbs-mindmap-wrapper <?php echo $extra_class; ?>"
        style="<?php echo $inline_style; ?>"
    ></div>
    <script>
    (function() {
        function init() {
            var el = document.getElementById(<?php echo json_encode($id); ?>);
            if (el && typeof BBSMindmap !== 'undefined' && typeof BBS_MINDMAP_DATA !== 'undefined') {
                new BBSMindmap(el, BBS_MINDMAP_DATA);
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
add_shortcode('bbs_mindmap', 'bbs_mindmap_shortcode');

/* ── Elementor integration (optional) ──────────────────── */
/**
 * If Elementor is active, the shortcode works inside the HTML widget.
 * For a native widget, uncomment and extend the class below.
 */
/*
add_action('elementor/widgets/register', function($manager) {
    require_once BBS_MINDMAP_DIR . 'includes/elementor-widget.php';
    $manager->register(new \BBS_Mindmap_Elementor_Widget());
});
*/
