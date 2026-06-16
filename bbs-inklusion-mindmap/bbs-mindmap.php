<?php
/**
 * Plugin Name:  BBS Inklusion Mindmap
 * Description:  Interaktive Zoom-Mindmap für Elementor Pro – NotebookLM-Stil
 * Version:      1.0.0
 * Requires PHP: 8.0
 * Author:       BBS Wesermarsch
 * Text Domain:  bbs-mindmap
 */

defined( 'ABSPATH' ) || exit;

define( 'BBS_MINDMAP_VERSION', '1.0.0' );
define( 'BBS_MINDMAP_PATH',    plugin_dir_path( __FILE__ ) );
define( 'BBS_MINDMAP_URL',     plugin_dir_url( __FILE__ ) );

/* ── Assets registrieren ──────────────────────────────────── */
add_action( 'wp_enqueue_scripts', 'bbs_mindmap_register_assets' );
add_action( 'elementor/editor/before_enqueue_scripts', 'bbs_mindmap_register_assets' );

function bbs_mindmap_register_assets(): void {
    wp_register_style(
        'bbs-mindmap',
        BBS_MINDMAP_URL . 'assets/css/bbs-mindmap.css',
        [],
        BBS_MINDMAP_VERSION
    );
    wp_register_script(
        'bbs-mindmap',
        BBS_MINDMAP_URL . 'assets/js/bbs-mindmap.js',
        [],
        BBS_MINDMAP_VERSION,
        true
    );
}

/* ── Elementor Widget registrieren ────────────────────────── */
add_action( 'elementor/widgets/register', function ( $manager ): void {
    require_once BBS_MINDMAP_PATH . 'includes/class-bbs-mindmap-widget.php';
    $manager->register( new \BBS_Mindmap\Widget() );
} );

/* ── Elementor-Kategorie (optional) ──────────────────────── */
add_action( 'elementor/elements/categories_registered', function ( $manager ): void {
    $manager->add_category( 'bbs-widgets', [
        'title' => 'BBS Wesermarsch',
        'icon'  => 'fa fa-plug',
    ] );
} );
