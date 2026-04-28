import { useEffect } from 'react';
import * as Location from 'expo-location';

import { useLocationStore } from '@/stores/locationStore';

/**
 * Solicita permisos de ubicación y guarda las coordenadas en el store.
 * Llamar UNA SOLA VEZ en el layout raíz de la app autenticada.
 */
export function useLocationInitializer() {
  const setCoordinates = useLocationStore((s) => s.setCoordinates);
  const setPermissionGranted = useLocationStore((s) => s.setPermissionGranted);
  const permissionGranted = useLocationStore((s) => s.permissionGranted);

  useEffect(() => {
    // Si ya tenemos el resultado del permiso, no repetir la solicitud
    if (permissionGranted !== null) return;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);

      if (!granted) return;

      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCoordinates({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch {
        // Si falla (ej. emulador sin GPS), usar Madrid como fallback
        setCoordinates({ latitude: 40.4168, longitude: -3.7038 });
      }
    })();
  }, [permissionGranted, setCoordinates, setPermissionGranted]);
}
