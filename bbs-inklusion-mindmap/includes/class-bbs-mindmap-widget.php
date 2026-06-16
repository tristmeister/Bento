<?php
namespace BBS_Mindmap;

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Box_Shadow;
use Elementor\Repeater;
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

    /* ── Controls ──────────────────────────────────────────────── */
    protected function register_controls(): void {
        $this->tab_content();
        $this->tab_style();
    }

    private function tab_content(): void {

        /* ── Zentrale Karte ─────────────────────────────────────── */
        $this->start_controls_section( 'sec_root', [
            'label' => '🗺 Mindmap',
            'tab'   => Controls_Manager::TAB_CONTENT,
        ] );

        $this->add_control( 'root_label', [
            'label'   => 'Haupttitel (Zentralkarte)',
            'type'    => Controls_Manager::TEXT,
            'default' => 'Inklusion an den BBS Wesermarsch',
            'dynamic' => [ 'active' => true ],
        ] );

        $this->add_control( 'root_color', [
            'label'   => 'Farbe Zentralkarte',
            'type'    => Controls_Manager::COLOR,
            'default' => '#5c6bc0',
        ] );

        /* ── Knoten-Repeater ────────────────────────────────────── */
        $repeater = new Repeater();

        $repeater->add_control( 'node_depth', [
            'label'   => 'Ebene',
            'type'    => Controls_Manager::SELECT,
            'default' => '2',
            'options' => [
                '1' => '① Hauptkategorie  (kreist um die Mitte)',
                '2' => '② Unterpunkt  (kreist um Hauptkategorie)',
                '3' => '③ Detailpunkt / Blatt  (letzter Klick)',
            ],
        ] );

        $repeater->add_control( 'node_label', [
            'label'   => 'Bezeichnung',
            'type'    => Controls_Manager::TEXT,
            'default' => '',
            'dynamic' => [ 'active' => true ],
        ] );

        $repeater->add_control( 'node_color', [
            'label'     => 'Farbe',
            'type'      => Controls_Manager::COLOR,
            'condition' => [ 'node_depth' => [ '1', '2' ] ],
        ] );

        $repeater->add_control( 'node_icon', [
            'label'       => 'Icon (Emoji)',
            'type'        => Controls_Manager::TEXT,
            'placeholder' => '♿  ⚖️  📚  🤝  🔄 …',
            'condition'   => [ 'node_depth' => '1' ],
        ] );

        $repeater->add_control( 'node_content', [
            'label'       => 'Inhalt (klappt beim Klick auf)',
            'description' => 'Text, HTML, Links und Buttons sind erlaubt. Erscheint, wenn dieser Eintrag keine Unterpunkte hat.',
            'type'        => Controls_Manager::WYSIWYG,
            'condition'   => [ 'node_depth' => [ '2', '3' ] ],
        ] );

        $repeater->add_control( 'node_url', [
            'label'         => 'Externer Link (Button „Mehr erfahren →")',
            'type'          => Controls_Manager::URL,
            'placeholder'   => 'https://…',
            'show_external' => true,
            'condition'     => [ 'node_depth' => [ '2', '3' ] ],
        ] );

        $repeater->add_control( 'node_planned', [
            'label'     => 'Als „Geplant" markieren',
            'type'      => Controls_Manager::SWITCHER,
            'label_on'  => 'Ja',
            'label_off' => 'Nein',
            'default'   => '',
        ] );

        $this->add_control( 'nodes', [
            'label'       => 'Einträge',
            'type'        => Controls_Manager::REPEATER,
            'fields'      => $repeater->get_controls(),
            'default'     => $this->default_nodes(),
            /* Titel im Repeater: Ebenen-Prefix + Bezeichnung */
            'title_field' =>
                '<# var p = {"1":"① ","2":"&nbsp;&nbsp;&nbsp;② ","3":"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;③ "}; #>' .
                '{{{ (p[node_depth]||"") + node_label }}}',
        ] );

        $this->end_controls_section();

        /* ── Navigation ─────────────────────────────────────────── */
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

        /* ── Mobile ─────────────────────────────────────────────── */
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
            'default'        => [ 'unit' => 'vh', 'size' => 82 ],
            'tablet_default' => [ 'unit' => 'vh', 'size' => 78 ],
            'mobile_default' => [ 'unit' => 'vh', 'size' => 65 ],
            'selectors'      => [ '{{WRAPPER}} .bbs-mindmap' => 'min-height: {{SIZE}}{{UNIT}};' ],
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

    /* ── Render ─────────────────────────────────────────────────── */
    protected function render(): void {
        $s = $this->get_settings_for_display();

        $data = $this->build_tree_from_settings( $s );

        $config = [
            'data'             => $data,
            'showBreadcrumb'   => ( $s['show_breadcrumb']   ?? 'yes' ) === 'yes',
            'showHomeBtn'      => ( $s['show_home_btn']     ?? 'yes' ) === 'yes',
            'clickBgBack'      => ( $s['click_bg_back']     ?? 'yes' ) === 'yes',
            'mobileFullscreen' => ( $s['mobile_fullscreen'] ?? '' )    === 'yes',
            'animSpeed'        => (int) ( $s['anim_speed']['size'] ?? 360 ),
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

    /* ── Baum aus Repeater-Einträgen aufbauen ───────────────────── */

    /**
     * Konvertiert die flache Repeater-Liste (mit Ebenenwahl) in die
     * verschachtelte JSON-Struktur, die BBSMindmap.js erwartet.
     * Algorithmus: Rekursive Tiefenanalyse wie bei WordPress-Menüs.
     */
    private function build_tree_from_settings( array $s ): array {
        $root = [
            'label'    => sanitize_text_field( $s['root_label'] ?? 'Inklusion' ),
            'color'    => sanitize_hex_color( $s['root_color'] ?? '#5c6bc0' ) ?: '#5c6bc0',
            'icon'     => '',
            'children' => [],
        ];

        $items = array_values( $s['nodes'] ?? [] );
        if ( empty( $items ) ) return $root;

        $cursor = 0;
        $root['children'] = $this->nest_nodes( $items, $cursor, 1 );
        return $root;
    }

    /**
     * Rekursiver Helfer: nimmt die flache Liste (per Index-Cursor) und
     * sammelt alle Einträge der Ebene $target_depth als Kinder ein.
     * Tiefere Einträge werden als children des jeweils letzten Eintrags gesammelt.
     *
     * @param array $items   Flache Liste aller Repeater-Einträge (original, unverändert)
     * @param int   $cursor  Aktueller Lesezeiger (by reference über Caller)
     * @param int   $depth   Aktuell zu sammelnde Tiefe
     */
    private function nest_nodes( array $items, int &$cursor, int $depth ): array {
        $result = [];

        while ( $cursor < count( $items ) ) {
            $raw  = $items[ $cursor ];
            $d    = max( 1, min( 3, (int) ( $raw['node_depth'] ?? 2 ) ) );

            if ( $d < $depth ) break;  // gehört zum übergeordneten Level → Abbruch

            $cursor++;  // diesen Eintrag konsumieren

            $node = [ 'label' => sanitize_text_field( $raw['node_label'] ?? '' ) ];

            $color = sanitize_hex_color( $raw['node_color'] ?? '' );
            if ( $color )                              $node['color']   = $color;
            if ( ! empty( $raw['node_icon'] ) )        $node['icon']    = sanitize_text_field( $raw['node_icon'] );
            if ( ( $raw['node_planned'] ?? '' ) === 'yes' ) $node['planned'] = true;

            $url_data = $raw['node_url'] ?? [];
            if ( ! empty( $url_data['url'] ) )         $node['url']     = esc_url_raw( $url_data['url'] );
            if ( ! empty( $raw['node_content'] ) )     $node['content'] = wp_kses_post( $raw['node_content'] );

            // Tiefere Einträge werden als children dieses Knotens gesammelt
            $children = $this->nest_nodes( $items, $cursor, $depth + 1 );
            if ( ! empty( $children ) ) $node['children'] = $children;

            $result[] = $node;
        }

        return $result;
    }

    /* ── Standard-Einträge (flach, mit Ebenenangabe) ────────────── */
    private function default_nodes(): array {
        return [
            // ① Barrierefreiheit
            [ 'node_depth' => '1', 'node_label' => 'Barrierefreiheit',              'node_color' => '#e8a435', 'node_icon' => '♿',  'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Barrierefreie Parkplätze',      'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Aufzüge',                       'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Barrierefreie Toiletten',       'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Individualisierte Raumplanung', 'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Beschilderung mit Piktogrammen','node_planned' => 'yes' ],
            [ 'node_depth' => '2', 'node_label' => 'Automatisierte Türen',          'node_planned' => 'yes' ],
            [ 'node_depth' => '2', 'node_label' => 'Leichte Sprache',               'node_planned' => 'yes' ],
            [ 'node_depth' => '3', 'node_label' => 'Homepage',    'node_planned' => '' ],
            [ 'node_depth' => '3', 'node_label' => 'Schulordnung','node_planned' => '' ],
            [ 'node_depth' => '3', 'node_label' => 'Flyer',       'node_planned' => '' ],

            // ① Rechtliche Grundlagen
            [ 'node_depth' => '1', 'node_label' => 'Rechtliche Grundlagen', 'node_color' => '#7a9e5f', 'node_icon' => '⚖️', 'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Grundgesetz der Bundesrepublik Deutschland', 'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'UN-Behindertenrechtskonvention',             'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Niedersächsisches Schulgesetz',              'node_planned' => '' ],

            // ① Übergänge
            [ 'node_depth' => '1', 'node_label' => 'Übergänge allgemein bildende Schulen – berufsbildende Schulen', 'node_color' => '#b03a3a', 'node_icon' => '🔄', 'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Berufswegekonferenzen',              'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Anmeldung an den BBS Wesermarsch',  'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Übergabegespräche',                 'node_planned' => '' ],

            // ① Inklusion im Unterricht
            [ 'node_depth' => '1', 'node_label' => 'Inklusion im Unterricht', 'node_color' => '#c8694a', 'node_icon' => '📚', 'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Förderplanung',     'node_color' => '#c8694a', 'node_planned' => '' ],
            [ 'node_depth' => '3', 'node_label' => 'Förderplanung',                                     'node_planned' => '' ],
            [ 'node_depth' => '3', 'node_label' => 'Digitales Förderplanungs-Tool (Splint)',             'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Nachteilsausgleich', 'node_color' => '#c8694a', 'node_planned' => '' ],
            [ 'node_depth' => '3', 'node_label' => 'Nachteilsausgleich (alle Schulformen – außer Berufliches Gymnasium)', 'node_planned' => '' ],
            [ 'node_depth' => '3', 'node_label' => 'Nachteilsausgleich Berufliches Gymnasium',           'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Unterrichtsgestaltung', 'node_color' => '#c8694a', 'node_planned' => '' ],
            [ 'node_depth' => '3', 'node_label' => 'Individualisierte Aufgaben',   'node_planned' => '' ],
            [ 'node_depth' => '3', 'node_label' => 'Individualisiertes Material',  'node_planned' => '' ],
            [ 'node_depth' => '3', 'node_label' => 'VETO-Prinzip',                 'node_planned' => '' ],
            [ 'node_depth' => '3', 'node_label' => 'Buddy-Prinzip',                'node_planned' => '' ],

            // ① Unterstützungssysteme
            [ 'node_depth' => '1', 'node_label' => 'Unterstützungssysteme', 'node_color' => '#7a9e5f', 'node_icon' => '🤝', 'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Fachstelle Inklusion',    'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Mobiler Dienst',          'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Schulsozialarbeit',       'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Beratungsteam',           'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Reha-Beratung',           'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Schulbegleitung',         'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Regionale Beratungs- und Unterstützungszentren Inklusive Schule', 'node_planned' => '' ],
            [ 'node_depth' => '2', 'node_label' => 'Fort- und Weiterbildung', 'node_planned' => '' ],
        ];
    }
}
