import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = { appId: 'ne.revant.marketplace', appName: 'Revant', webDir: 'www', server: { url: 'https://revant-v2-ui-premium.onrender.com/', cleartext: false, androidScheme: 'https' }, android: { allowMixedContent: false } };
export default config;
