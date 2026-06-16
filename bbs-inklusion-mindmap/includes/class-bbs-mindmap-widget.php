<?php
namespace BBS_Mindmap;

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Box_Shadow;
use Elementor\Widget_Base;

defined( 'ABSPATH' ) || exit;

class Widget extends Widget_Base {

    public function get_name(): string  { return 'bbs_inklusion_mindmap'; }
    public function get_title(): string { return 'Inklusion Mindmap'; }
    public function get_icon(): string  { return 'eicon-sitemap'; }
    public function get_categories(): array { return [ 'bbs-widgets', 'general' ]; }
    public function get_keywords(): array   { return [ 'mindmap', 'inklusion', 'bbs', 'zoom', 'interaktiv' ]; }
    public function get_script_depends(): array { return [ 'bbs-mindmap' ]; }
    public function get_style_depends(): array  { return [ 'bbs-mindmap' ]; }

    /* ── Controls ──────────────────────────────────────────── */
    protected function register_controls(): void {
        $this->tab_content();
        $this->tab_style();
    }

    private function tab_content(): void {

        /* Mindmap Daten */
        $this->start_controls_section( 'sec_data', [
            'label' => '📊 Mindmap Daten (JSON)',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ] );

        $this->add_control( 'mindmap_json', [
            'label'       => 'Struktur (JSON)',
            'type'        => Controls_Manager::CODE,
            'language'    => 'json',
            'rows'        => 30,
            'default'     => $this->default_json(),
            'description' => '<strong>Aufbau jedes Knotens:</strong><br>
                <code>label</code> – Anzeigetext (Pflicht)<br>
                <code>color</code> – Hex-Farbe, z.B. <code>#e8a435</code><br>
                <code>icon</code> – Emoji oder Text-Icon<br>
                <code>url</code> – Verlinkung (öffnet in neuem Tab)<br>
                <code>content</code> – HTML-Inhalt für Leaf-Panels<br>
                <code>planned</code> – <code>true</code> = „Geplant"-Badge<br>
                <code>children</code> – Array mit Unterknoten',
        ] );

        $this->end_controls_section();

        /* Navigation */
        $this->start_controls_section( 'sec_nav', [
            'label' => '🧭 Navigation',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ] );

        $this->add_control( 'show_breadcrumb', [
            'label'     => 'Breadcrumb anzeigen',
            'type'      => Controls_Manager::SWITCHER,
            'default'   => 'yes',
            'label_on'  => 'Ja',
            'label_off' => 'Nein',
        ] );

        $this->add_control( 'show_home_btn', [
            'label'     => 'Startseite-Button',
            'type'      => Controls_Manager::SWITCHER,
            'default'   => 'yes',
            'label_on'  => 'Ja',
            'label_off' => 'Nein',
        ] );

        $this->add_control( 'click_bg_back', [
            'label'       => 'Klick auf Hintergrund = Zurück',
            'type'        => Controls_Manager::SWITCHER,
            'default'     => 'yes',
            'label_on'    => 'Ja',
            'label_off'   => 'Nein',
            'description' => 'Außerhalb der Karten klicken, um eine Ebene zurückzugehen.',
        ] );

        $this->add_control( 'anim_speed', [
            'label'   => 'Animationsgeschwindigkeit (ms)',
            'type'    => Controls_Manager::SLIDER,
            'range'   => [ 'px' => [ 'min' => 100, 'max' => 800, 'step' => 50 ] ],
            'default' => [ 'size' => 360 ],
        ] );

        $this->end_controls_section();

        /* Mobile */
        $this->start_controls_section( 'sec_mobile', [
            'label' => '📱 Mobile',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ] );

        $this->add_control( 'mobile_fullscreen', [
            'label'       => 'Vollbild auf Mobile (fixed)',
            'type'        => Controls_Manager::SWITCHER,
            'default'     => '',
            'label_on'    => 'Ja',
            'label_off'   => 'Nein',
            'description' => 'Legt das Widget als fixierten Vollbild-Layer über die Seite. Standard: Aus – das Widget bleibt ein normaler scrollbarer Block.',
        ] );

        $this->end_controls_section();
    }

    private function tab_style(): void {

        /* Container */
        $this->start_controls_section( 'sec_style_container', [
            'label' => 'Container',
            'tab'   => Controls_Manager::TAB_STYLE,
        ] );

        $this->add_responsive_control( 'min_height', [
            'label'      => 'Mindesthöhe',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => [ 'px', 'vh' ],
            'range'      => [
                'px' => [ 'min' => 300, 'max' => 1400 ],
                'vh' => [ 'min' => 30,  'max' => 100  ],
            ],
            'default'         => [ 'unit' => 'vh', 'size' => 82 ],
            'tablet_default'  => [ 'unit' => 'vh', 'size' => 78 ],
            'mobile_default'  => [ 'unit' => 'vh', 'size' => 65 ],
            'selectors'  => [ '{{WRAPPER}} .bbs-mindmap' => 'min-height: {{SIZE}}{{UNIT}};' ],
        ] );

        $this->add_control( 'container_bg', [
            'label'     => 'Hintergrundfarbe',
            'type'      => Controls_Manager::COLOR,
            'default'   => '#eef0f6',
            'selectors' => [ '{{WRAPPER}} .bbs-mindmap' => 'background-color: {{VALUE}};' ],
        ] );

        $this->add_responsive_control( 'container_radius', [
            'label'      => 'Eckenradius',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => [ 'px' ],
            'range'      => [ 'px' => [ 'min' => 0, 'max' => 40 ] ],
            'default'    => [ 'size' => 16 ],
            'selectors'  => [ '{{WRAPPER}} .bbs-mindmap' => 'border-radius: {{SIZE}}px; overflow: hidden;' ],
        ] );

        $this->end_controls_section();

        /* Navigationsleiste */
        $this->start_controls_section( 'sec_style_navbar', [
            'label' => 'Navigationsleiste',
            'tab'   => Controls_Manager::TAB_STYLE,
        ] );

        $this->add_control( 'navbar_bg', [
            'label'     => 'Hintergrund',
            'type'      => Controls_Manager::COLOR,
            'default'   => 'rgba(255,255,255,0.92)',
            'selectors' => [ '{{WRAPPER}} .mm-navbar' => 'background: {{VALUE}};' ],
        ] );

        $this->add_control( 'navbar_text_color', [
            'label'     => 'Textfarbe',
            'type'      => Controls_Manager::COLOR,
            'default'   => '#333333',
            'selectors' => [ '{{WRAPPER}} .mm-navbar' => 'color: {{VALUE}};' ],
        ] );

        $this->add_group_control( Group_Control_Typography::get_type(), [
            'name'     => 'breadcrumb_typo',
            'label'    => 'Breadcrumb Schrift',
            'selector' => '{{WRAPPER}} .mm-breadcrumb',
        ] );

        $this->end_controls_section();

        /* Knoten */
        $this->start_controls_section( 'sec_style_nodes', [
            'label' => 'Knoten (Cards)',
            'tab'   => Controls_Manager::TAB_STYLE,
        ] );

        $this->add_responsive_control( 'node_radius', [
            'label'      => 'Eckenradius',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => [ 'px' ],
            'range'      => [ 'px' => [ 'min' => 0, 'max' => 40 ] ],
            'default'    => [ 'size' => 14 ],
            'selectors'  => [ '{{WRAPPER}} .mm-node-card' => 'border-radius: {{SIZE}}px;' ],
        ] );

        $this->add_responsive_control( 'node_padding', [
            'label'      => 'Innenabstand',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => [ 'px' ],
            'range'      => [ 'px' => [ 'min' => 8, 'max' => 48 ] ],
            'default'    => [ 'size' => 22 ],
            'selectors'  => [ '{{WRAPPER}} .mm-node-card' => 'padding: {{SIZE}}px;' ],
        ] );

        $this->add_responsive_control( 'grid_gap', [
            'label'      => 'Abstand zwischen Karten',
            'type'       => Controls_Manager::SLIDER,
            'size_units' => [ 'px' ],
            'range'      => [ 'px' => [ 'min' => 4, 'max' => 40 ] ],
            'default'    => [ 'size' => 16 ],
            'selectors'  => [ '{{WRAPPER}} .mm-grid' => 'gap: {{SIZE}}px;' ],
        ] );

        $this->add_group_control( Group_Control_Box_Shadow::get_type(), [
            'name'     => 'node_shadow',
            'selector' => '{{WRAPPER}} .mm-node-card',
        ] );

        $this->end_controls_section();

        /* Typografie */
        $this->start_controls_section( 'sec_style_typo', [
            'label' => 'Typografie',
            'tab'   => Controls_Manager::TAB_STYLE,
        ] );

        $this->add_group_control( Group_Control_Typography::get_type(), [
            'name'     => 'root_label_typo',
            'label'    => 'Haupttitel (Root)',
            'selector' => '{{WRAPPER}} .mm-root-label',
        ] );

        $this->add_group_control( Group_Control_Typography::get_type(), [
            'name'     => 'node_label_typo',
            'label'    => 'Knotentext',
            'selector' => '{{WRAPPER}} .mm-node-label',
        ] );

        $this->add_group_control( Group_Control_Typography::get_type(), [
            'name'     => 'node_count_typo',
            'label'    => 'Anzahl-Hinweis',
            'selector' => '{{WRAPPER}} .mm-node-count',
        ] );

        $this->end_controls_section();
    }

    /* ── Render ─────────────────────────────────────────────── */
    protected function render(): void {
        $s = $this->get_settings_for_display();

        $data = json_decode( $s['mindmap_json'] ?? '{}', true );
        if ( ! $data || json_last_error() !== JSON_ERROR_NONE ) {
            echo '<div class="bbs-mindmap-error" style="padding:20px;color:#c00;">
                  ⚠ Ungültige JSON-Daten. Bitte die Mindmap-Struktur im Widget-Panel prüfen.<br>
                  Fehler: ' . esc_html( json_last_error_msg() ) . '</div>';
            return;
        }

        $config = [
            'data'            => $data,
            'showBreadcrumb'  => ( $s['show_breadcrumb']   ?? 'yes' ) === 'yes',
            'showHomeBtn'     => ( $s['show_home_btn']     ?? 'yes' ) === 'yes',
            'clickBgBack'     => ( $s['click_bg_back']     ?? 'yes' ) === 'yes',
            'mobileFullscreen'=> ( $s['mobile_fullscreen'] ?? 'yes' ) === 'yes',
            'animSpeed'       => (int) ( $s['anim_speed']['size'] ?? 360 ),
        ];

        $uid = 'bbs-mm-' . $this->get_id();
        ?>
        <div class="bbs-mindmap"
             id="<?php echo esc_attr( $uid ); ?>"
             data-config="<?php echo esc_attr( wp_json_encode( $config ) ); ?>"
             role="region"
             aria-label="Interaktive Mindmap – Inklusion an den BBS Wesermarsch">
        </div>
        <script>
        ( function () {
            function init() {
                var el = document.getElementById( '<?php echo esc_js( $uid ); ?>' );
                if ( el && window.BBSMindmap ) {
                    new BBSMindmap( el, JSON.parse( el.dataset.config ) );
                }
            }
            if ( document.readyState === 'loading' ) {
                document.addEventListener( 'DOMContentLoaded', init );
            } else {
                init();
            }
        } )();
        </script>
        <?php
    }

    /* Elementor-Editor-Vorschau */
    protected function content_template(): void {
        ?>
        <div class="bbs-mindmap" style="min-height:200px;display:flex;align-items:center;justify-content:center;background:#eef0f6;border-radius:12px;">
            <div style="text-align:center;color:#5c6bc0;font-family:sans-serif;">
                <div style="font-size:40px;margin-bottom:8px;">🗺</div>
                <strong style="font-size:16px;">BBS Inklusion Mindmap</strong><br>
                <span style="font-size:12px;color:#888;">Vorschau im Browser verfügbar</span>
            </div>
        </div>
        <?php
    }

    /* ── Standard-JSON ──────────────────────────────────────── */
    private function default_json(): string {
        $data = [
            'label' => 'Inklusion an den BBS Wesermarsch',
            'color' => '#5c6bc0',
            'icon'  => '',
            'children' => [
                [
                    'label' => 'Barrierefreiheit',
                    'color' => '#e8a435',
                    'icon'  => '♿',
                    'children' => [
                        [ 'label' => 'Barrierefreie Parkplätze', 'url' => '' ],
                        [ 'label' => 'Aufzüge', 'url' => '' ],
                        [ 'label' => 'Barrierefreie Toiletten', 'url' => '' ],
                        [ 'label' => 'Individualisierte Raumplanung', 'url' => '' ],
                        [ 'label' => 'Beschilderung mit Piktogrammen', 'url' => '', 'planned' => true ],
                        [ 'label' => 'Automatisierte Türen', 'url' => '', 'planned' => true ],
                        [ 'label' => 'Leichte Sprache', 'url' => '', 'planned' => true, 'children' => [
                            [ 'label' => 'Homepage',     'url' => '' ],
                            [ 'label' => 'Schulordnung', 'url' => '' ],
                            [ 'label' => 'Flyer',        'url' => '' ],
                        ]],
                    ],
                ],
                [
                    'label' => 'Rechtliche Grundlagen',
                    'color' => '#7a9e5f',
                    'icon'  => '⚖️',
                    'children' => [
                        [ 'label' => 'Grundgesetz der Bundesrepublik Deutschland', 'url' => '' ],
                        [ 'label' => 'UN-Behindertenrechtskonvention', 'url' => '' ],
                        [ 'label' => 'Niedersächsisches Schulgesetz', 'url' => '' ],
                    ],
                ],
                [
                    'label' => 'Übergänge allgemein bildende Schulen – berufsbildende Schulen',
                    'color' => '#b03a3a',
                    'icon'  => '🔄',
                    'children' => [
                        [ 'label' => 'Berufswegekonferenzen', 'url' => '' ],
                        [ 'label' => 'Anmeldung an den BBS Wesermarsch', 'url' => '' ],
                        [ 'label' => 'Übergabegespräche', 'url' => '' ],
                    ],
                ],
                [
                    'label' => 'Inklusion im Unterricht',
                    'color' => '#c8694a',
                    'icon'  => '📚',
                    'children' => [
                        [ 'label' => 'Förderplanung', 'color' => '#c8694a', 'children' => [
                            [ 'label' => 'Förderplanung', 'url' => '' ],
                            [ 'label' => 'Digitales Förderplanungs-Tool (Splint)', 'url' => '' ],
                        ]],
                        [ 'label' => 'Nachteilsausgleich', 'color' => '#c8694a', 'children' => [
                            [ 'label' => 'Nachteilsausgleich (alle Schulformen – außer Berufliches Gymnasium)', 'url' => '' ],
                            [ 'label' => 'Nachteilsausgleich Berufliches Gymnasium', 'url' => '' ],
                        ]],
                        [ 'label' => 'Unterrichtsgestaltung', 'color' => '#c8694a', 'children' => [
                            [ 'label' => 'Individualisierte Aufgaben',   'url' => '' ],
                            [ 'label' => 'Individualisiertes Material',  'url' => '' ],
                            [ 'label' => 'VETO-Prinzip',                 'url' => '' ],
                            [ 'label' => 'Buddy-Prinzip',                'url' => '' ],
                        ]],
                    ],
                ],
                [
                    'label' => 'Unterstützungssysteme',
                    'color' => '#7a9e5f',
                    'icon'  => '🤝',
                    'children' => [
                        [ 'label' => 'Fachstelle Inklusion', 'url' => '' ],
                        [ 'label' => 'Mobiler Dienst', 'url' => '' ],
                        [ 'label' => 'Schulsozialarbeit', 'url' => '' ],
                        [ 'label' => 'Beratungsteam', 'url' => '' ],
                        [ 'label' => 'Reha-Beratung', 'url' => '' ],
                        [ 'label' => 'Schulbegleitung', 'url' => '' ],
                        [ 'label' => 'Regionale Beratungs- und Unterstützungszentren Inklusive Schule', 'url' => '' ],
                        [ 'label' => 'Fort- und Weiterbildung', 'url' => '' ],
                    ],
                ],
            ],
        ];
        return json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
    }
}
