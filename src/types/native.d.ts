export {};

declare global {
  interface RevantNativeBridge {
    requestPushPermission?: () => void;
    startDeliveryActivity?: (payload: {
      orderReference: string;
      itemTitle: string;
      status: string;
      detail: string;
      etaLabel: string;
      progress: number;
    }) => void;
    endDeliveryActivity?: (payload: { orderReference: string }) => void;
  }

  interface Window {
    RevantNative?: RevantNativeBridge;
    __revantAPNSToken?: string;
  }
}
