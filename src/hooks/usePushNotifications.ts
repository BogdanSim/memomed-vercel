import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Hook pentru push notifications native pe iOS/Android.
 * Pe web nu face nimic (Capacitor detectează automat platforma).
 */
export const usePushNotifications = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setup = async () => {
      try {
        // Import dinamic — pachetul e disponibil doar în build-ul nativ
        const { PushNotifications } = await import('@capacitor/push-notifications');

        // Cere permisiunea utilizatorului
        const permission = await PushNotifications.requestPermissions();
        if (permission.receive !== 'granted') return;

        // Înregistrează device-ul pentru push notifications
        await PushNotifications.register();

        // Token primit de la APNs (iOS) / FCM (Android)
        await PushNotifications.addListener('registration', token => {
          console.log('[Push] Token:', token.value);
          // TODO: trimite token-ul la serverul tău pentru a putea trimite notificări
        });

        // Eroare la înregistrare
        await PushNotifications.addListener('registrationError', err => {
          console.error('[Push] Eroare înregistrare:', err.error);
        });

        // Notificare primită cu app-ul deschis
        await PushNotifications.addListener('pushNotificationReceived', notification => {
          console.log('[Push] Primit:', notification);
        });

        // Utilizatorul a apăsat pe notificare
        await PushNotifications.addListener('pushNotificationActionPerformed', action => {
          console.log('[Push] Acțiune:', action.notification);
        });
      } catch (e) {
        console.warn('[Push] Plugin indisponibil:', e);
      }
    };

    setup();
  }, []);
};
