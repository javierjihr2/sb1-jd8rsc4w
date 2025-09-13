import { useDeviceInfo } from './useDeviceInfo';

export type DeviceType = 'phone' | 'tablet';

export const useDeviceType = (): DeviceType => {
  const { deviceType } = useDeviceInfo();
  return deviceType;
};

export default useDeviceType;