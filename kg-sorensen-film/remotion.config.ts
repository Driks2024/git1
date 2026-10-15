// Remotion CLI config for Mode A (the vertical film lives in video/).
// Lets `npx remotion studio video/src/index.ts` find video/public.
import { Config } from '@remotion/cli/config';

Config.setPublicDir('./video/public');
Config.setEntryPoint('./video/src/index.ts');
Config.setChromiumOpenGlRenderer('swangle');
Config.setDelayRenderTimeoutInMilliseconds(600000);
