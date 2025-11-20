// Google Analytics gtag type definitions

interface Window {
  dataLayer: any[];
  gtag: (
    command: 'config' | 'event' | 'set' | 'js',
    targetId: string | Date,
    config?: {
      page_path?: string;
      event_category?: string;
      event_label?: string;
      value?: number;
      [key: string]: any;
    }
  ) => void;
}

