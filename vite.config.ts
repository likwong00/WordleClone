import { defineConfig } from "vite";

// Some environments may have trouble requiring the ESM-only plugin during config load.
// Dynamically import it so Vite can handle ESM properly.
export default defineConfig(async () => {
	const react = (await import("@vitejs/plugin-react")).default;
	return {
		plugins: [react()],
	};
});
