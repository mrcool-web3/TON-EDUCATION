import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        onEvent: (eventName: string, callback: () => void) => void;
        offEvent: (eventName: string, callback: () => void) => void;
        sendData: (data: string) => void;
        openLink: (url: string) => void;
        isExpanded: boolean;
        backgroundColor: string;
        headerColor: string;
        setHeaderColor: (color: 'bg_color' | 'secondary_bg_color') => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
        };
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
      };
    };
  }
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  displayName: string;
}

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      
      if (tg.initDataUnsafe.user) {
        const { id, first_name, last_name, username } = tg.initDataUnsafe.user;
        setUser({
          id,
          first_name,
          last_name,
          username,
          displayName: `${first_name}${last_name ? ' ' + last_name : ''}`
        });
      }
      
      setIsLoaded(true);
    } else {
      // Fallback for development (when not running inside Telegram)
      const mockUser = {
        id: 12345,
        first_name: 'Alex',
        last_name: 'Johnson',
        username: 'alexjohnson',
        displayName: 'Alex Johnson'
      };
      setUser(mockUser);
      setIsLoaded(true);
    }
  }, [tg]);

  const onMainButtonClick = (callback: () => void) => {
    if (tg) {
      tg.MainButton.onClick(callback);
    }
  };

  const offMainButtonClick = (callback: () => void) => {
    if (tg) {
      tg.MainButton.offClick(callback);
    }
  };

  const showMainButton = (params: { text: string; color?: string; textColor?: string }) => {
    if (tg) {
      tg.MainButton.setText(params.text);
      if (params.color) tg.MainButton.color = params.color;
      if (params.textColor) tg.MainButton.textColor = params.textColor;
      tg.MainButton.show();
    }
  };

  const hideMainButton = () => {
    if (tg) {
      tg.MainButton.hide();
    }
  };

  const onBackButtonClick = (callback: () => void) => {
    if (tg) {
      tg.BackButton.onClick(callback);
    }
  };

  const offBackButtonClick = (callback: () => void) => {
    if (tg) {
      tg.BackButton.offClick(callback);
    }
  };

  const showBackButton = () => {
    if (tg) {
      tg.BackButton.show();
    }
  };

  const hideBackButton = () => {
    if (tg) {
      tg.BackButton.hide();
    }
  };

  const close = () => {
    if (tg) {
      tg.close();
    }
  };

  const openLink = (url: string) => {
    if (tg) {
      tg.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return {
    tg,
    user,
    isLoaded,
    onMainButtonClick,
    offMainButtonClick,
    showMainButton,
    hideMainButton,
    onBackButtonClick,
    offBackButtonClick,
    showBackButton,
    hideBackButton,
    close,
    openLink
  };
}
