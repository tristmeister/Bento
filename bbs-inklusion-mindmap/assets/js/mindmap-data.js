/**
 * BBS Wesermarsch – Inklusion Mindmap
 * Datenstruktur der Mindmap
 */
const BBS_MINDMAP_DATA = {
  id: 'root',
  label: 'Inklusion an den\nBBS Wesermarsch',
  color: '#5c6bc0',
  icon: '⭐',
  children: [
    {
      id: 'barrierefreiheit',
      label: 'Barrierefreiheit',
      color: '#e8a435',
      icon: '♿',
      side: 'left',
      children: [
        { id: 'bf-1', label: 'Barrierefreie Parkplätze', url: '' },
        { id: 'bf-2', label: 'Aufzüge', url: '' },
        { id: 'bf-3', label: 'Barrierefreie Toiletten', url: '' },
        { id: 'bf-4', label: 'Individualisierte Raumplanung', url: '' },
        { id: 'bf-5', label: 'Beschilderung mit Piktogrammen (in Planung)', url: '', planned: true },
        { id: 'bf-6', label: 'Automatisierte Türen (in Planung)', url: '', planned: true },
        {
          id: 'bf-7',
          label: 'Leichte Sprache (in Planung)',
          url: '',
          planned: true,
          children: [
            { id: 'bf-7-1', label: 'Homepage', url: '' },
            { id: 'bf-7-2', label: 'Schulordnung', url: '' },
            { id: 'bf-7-3', label: 'Flyer', url: '' }
          ]
        }
      ]
    },
    {
      id: 'rechtlich',
      label: 'Rechtliche Grundlagen',
      color: '#7a9e5f',
      icon: '⚖️',
      side: 'right',
      children: [
        { id: 'rg-1', label: 'Grundgesetz der Bundesrepublik Deutschland', url: '' },
        { id: 'rg-2', label: 'UN-Behindertenrechtskonvention', url: '' },
        { id: 'rg-3', label: 'Niedersächsisches Schulgesetz', url: '' }
      ]
    },
    {
      id: 'uebergaenge',
      label: 'Übergänge allgemein bildende Schulen – berufsbildende Schulen',
      color: '#b03a3a',
      icon: '🔄',
      side: 'right',
      children: [
        { id: 'ue-1', label: 'Berufswegekonferenzen', url: '' },
        { id: 'ue-2', label: 'Anmeldung an den BBS Wesermarsch', url: '' },
        { id: 'ue-3', label: 'Übergabegespräche', url: '' }
      ]
    },
    {
      id: 'inklusion-unterricht',
      label: 'Inklusion im Unterricht',
      color: '#c8694a',
      icon: '📚',
      side: 'right',
      children: [
        {
          id: 'iu-1',
          label: 'Förderplanung',
          url: '',
          children: [
            { id: 'iu-1-1', label: 'Förderplanung', url: '' },
            { id: 'iu-1-2', label: 'Digitales Förderplanungs-Tool (Splint)', url: '' }
          ]
        },
        {
          id: 'iu-2',
          label: 'Nachteilsausgleich',
          url: '',
          children: [
            { id: 'iu-2-1', label: 'Nachteilsausgleich (alle Schulformen – außer Berufliches Gymnasium)', url: '' },
            { id: 'iu-2-2', label: 'Nachteilsausgleich Berufliches Gymnasium', url: '' }
          ]
        },
        {
          id: 'iu-3',
          label: 'Unterrichtsgestaltung',
          url: '',
          children: [
            { id: 'iu-3-1', label: 'Individualisierte Aufgaben', url: '' },
            { id: 'iu-3-2', label: 'Individualisiertes Material', url: '' },
            { id: 'iu-3-3', label: 'VETO-Prinzip', url: '' },
            { id: 'iu-3-4', label: 'Buddy-Prinzip', url: '' }
          ]
        }
      ]
    },
    {
      id: 'unterstuetzung',
      label: 'Unterstützungssysteme',
      color: '#7a9e5f',
      icon: '🤝',
      side: 'left',
      children: [
        { id: 'us-1', label: 'Fachstelle Inklusion', url: '' },
        { id: 'us-2', label: 'Mobiler Dienst', url: '' },
        { id: 'us-3', label: 'Schulsozialarbeit', url: '' },
        { id: 'us-4', label: 'Beratungsteam', url: '' },
        { id: 'us-5', label: 'Reha-Beratung', url: '' },
        { id: 'us-6', label: 'Schulbegleitung', url: '' },
        { id: 'us-7', label: 'Regionale Beratungs- und Unterstützungszentren Inklusive Schule', url: '' },
        { id: 'us-8', label: 'Fort- und Weiterbildung', url: '' }
      ]
    }
  ]
};
